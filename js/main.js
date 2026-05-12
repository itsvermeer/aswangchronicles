import { createPlayer } from './player.js';
import { WeaponSystem } from './weapons.js';
import { AIController } from './ai.js';
import { setupLighting, createFlashlight } from './lighting.js';
import { initAudio, startHorrorAmbient } from './audio.js';
import { JumpscareManager } from './jumpscare.js';
import { initMultiplayer } from './multiplayer.js';

const canvas = document.getElementById('gameCanvas');
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.03, 1);
scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
scene.fogDensity = 0.003;
scene.fogColor = new BABYLON.Color3(0.08, 0.08, 0.1);

// UI
const ammoEl = document.getElementById('ammoDisplay');
const healthEl = document.getElementById('healthDisplay');
const weaponEl = document.getElementById('weaponDisplay');
const messageEl = document.getElementById('messageDisplay');
const startMenu = document.getElementById('startMenu');

let player, weapons, jumpscare;
let gameStarted = false;
let playerHealth = 100;
let lastDamageTime = 0;
let enemies = [];
let aiControllers = [];

// ---------- Build Map with your models ----------
async function buildMap() {
    // 1. Ground (hidden inside forest model, but keep for collisions)
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 200, height: 200 }, scene);
    ground.isVisible = false;   // the forest model contains its own ground
    ground.checkCollisions = true;

    // 2. Load the whole forest scene
    try {
        const forest = await BABYLON.SceneLoader.ImportMeshAsync(
            null,
            "assets/models/",
            "forest.glb",
            scene
        );
        // Position the forest (adjust if needed)
        forest.transformNodes[0].position.set(0, 0, 0);
        forest.transformNodes[0].scaling.setAll(1.0);
        // Enable collisions on all forest meshes (walls, trees, etc.)
        forest.meshes.forEach(m => {
            m.checkCollisions = true;
            m.receiveShadows = true;
        });
    } catch (e) {
        console.error("Forest model not found!", e);
        // Fallback: procedural terrain
        const fallbackGround = BABYLON.MeshBuilder.CreateGround("ground", { width: 200, height: 200 }, scene);
        const gMat = new BABYLON.StandardMaterial("gMat", scene);
        gMat.diffuseColor = new BABYLON.Color3(0.1, 0.15, 0.05);
        fallbackGround.material = gMat;
        fallbackGround.checkCollisions = true;
    }

    // 3. Load the abandoned house
    try {
        const house = await BABYLON.SceneLoader.ImportMeshAsync(
            null,
            "assets/models/",
            "Abandoned_House.glb",
            scene
        );
        house.meshes.forEach(m => {
            m.checkCollisions = true;
            m.receiveShadows = true;
        });
        house.transformNodes[0].position.set(-40, 0, -45);
        house.transformNodes[0].scaling.setAll(0.9);
    } catch (e) {
        console.warn("Abandoned house model missing");
    }
}

// ---------- Spawn enemies using Aswang1.fbx ----------
async function spawnEnemy() {
    if (!player) return;
    const angle = Math.random() * Math.PI * 2;
    const dist = 25 + Math.random() * 20;
    let x = player.camera.position.x + Math.cos(angle) * dist;
    let z = player.camera.position.z + Math.sin(angle) * dist;
    // Keep inside map bounds
    x = Math.max(-95, Math.min(95, x));
    z = Math.max(-95, Math.min(95, z));

    try {
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            null,
            "assets/models/",
            "Aswang1.fbx",
            scene
        );
        const root = result.transformNodes[0];
        root.position.set(x, 0, z);
        root.isMoving = false;
        // Make all meshes collidable (though they won't block player much)
        result.meshes.forEach(m => m.checkCollisions = true);
        enemies.push(root);
        aiControllers.push(new AIController(root, player.camera, scene));
    } catch (e) {
        console.error("Aswang1.fbx not found or failed to load:", e);
        // Spawn a simple fallback enemy if needed
    }
}

async function spawnInitialEnemies() {
    // Spawn 4 Aswangs
    for (let i = 0; i < 4; i++) {
        await spawnEnemy();
    }
}

// ---------- Health / HUD / Shooting (unchanged) ----------
function damagePlayer(amount) {
    if (playerHealth <= 0) return;
    playerHealth = Math.max(0, playerHealth - amount);
    updateHUD();
    if (playerHealth <= 0) {
        showMessage("PATAY KA NA...", 4000);
        setTimeout(() => location.reload(), 4500);
    }
}

function updateHUD() {
    if (!weapons) return;
    const w = weapons.currentWeapon;
    if (weaponEl) weaponEl.textContent = `${w.icon} ${w.name}`;
    if (ammoEl) ammoEl.textContent = (w.ammo === Infinity) ? '∞' : `${w.ammo} / ${w.maxAmmo}`;
    if (healthEl) healthEl.textContent = `❤️ ${playerHealth}`;
}

function showMessage(text, duration = 2000) {
    if (messageEl) {
        messageEl.textContent = text;
        setTimeout(() => { if (messageEl) messageEl.textContent = ''; }, duration);
    }
}

function onShoot(hitInfo) {
    if (hitInfo.empty) { showMessage("Walang bala! Mag-reload (R)"); return; }
    if (hitInfo.melee) {
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (enemy && !enemy.isDisposed()) {
                const dist = BABYLON.Vector3.Distance(enemy.position, player.camera.position);
                if (dist < 2.5) { destroyEnemy(i); showMessage("Pinatay mo ang kalaban!", 2500); return; }
            }
        }
        showMessage("Wala sa abot!"); return;
    }
    if (hitInfo?.hit && hitInfo.pickedMesh) {
        let node = hitInfo.pickedMesh;
        while (node) {
            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                if (enemy && !enemy.isDisposed() && isDescendantOf(node, enemy)) {
                    destroyEnemy(i); showMessage("Napatay ang kalaban!", 2500); return;
                }
            }
            node = node.parent;
        }
    }
}

function isDescendantOf(mesh, root) {
    let current = mesh;
    while (current) { if (current === root) return true; current = current.parent; }
    return false;
}

function destroyEnemy(index) {
    const enemy = enemies[index];
    if (enemy) { enemy.dispose(); enemies.splice(index, 1); aiControllers.splice(index, 1); }
    // Respawn after a while
    setTimeout(() => { if (gameStarted && player) spawnEnemy(); }, 8000);
}

// ---------- Reload ----------
window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        if (!gameStarted || !weapons) return;
        const w = weapons.currentWeapon;
        if (w.type === 'melee') return;
        w.ammo = w.maxAmmo;
        updateHUD();
        showMessage("Nagreload!", 1000);
    }
});

// ---------- Init Game ----------
async function initGame() {
    if (!gameStarted) return;

    await buildMap();
    setupLighting(scene);
    initAudio();

    player = createPlayer(canvas, scene);
    player.camera.position = new BABYLON.Vector3(0, 1.7, 0);
    createFlashlight(player.camera, scene);

    weapons = new WeaponSystem(scene, player.camera, onShoot, updateHUD);

    await spawnInitialEnemies();

    jumpscare = new JumpscareManager(
        document.getElementById('jumpscareOverlay'),
        document.getElementById('jumpscareText'),
        player.camera
    );

    scene.onBeforeRenderObservable.add(() => {
        if (!player || playerHealth <= 0) return;
        for (let i = aiControllers.length - 1; i >= 0; i--) {
            if (enemies[i] && !enemies[i].isDisposed()) {
                aiControllers[i].update();
                const dist = BABYLON.Vector3.Distance(enemies[i].position, player.camera.position);
                if (dist < 1.8) {
                    jumpscare.trigger();
                    damagePlayer(30);
                    destroyEnemy(i); continue;
                }
                if (dist < 2.5) {
                    const now = performance.now();
                    if (now - lastDamageTime > 1000) {
                        damagePlayer(8);
                        showMessage("Inaatake ka!");
                        lastDamageTime = now;
                    }
                }
            }
        }
    });

    initMultiplayer();
    engine.runRenderLoop(() => scene.render());
    window.addEventListener('resize', () => engine.resize());
    updateHUD();
}

// ---------- Start Game ----------
function startGame() {
    try {
        if (startMenu) startMenu.style.display = 'none';
        gameStarted = true;
        canvas.requestPointerLock();
        initGame();
        startHorrorAmbient();
    } catch (e) {
        console.error('Game start failed:', e);
        if (startMenu) startMenu.style.display = 'flex';
        alert('Failed to start: ' + e.message);
    }
}

window.startGame = startGame;
const playButton = document.getElementById('playButton');
if (playButton) {
    playButton.addEventListener('click', startGame);
    playButton.addEventListener('touchend', (e) => { e.preventDefault(); startGame(); });
}