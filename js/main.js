import { createPlayer } from './player.js';
import { WeaponSystem } from './weapons.js';
import { AIController } from './ai.js';
import { setupLighting, createFlashlight } from './lighting.js';
import { initAudio, startHorrorAmbient } from './audio.js';
import { JumpscareManager } from './jumpscare.js';
import { initMultiplayer } from './multiplayer.js';
import { setupMobileControls } from './mobile.js';

const canvas = document.getElementById('gameCanvas');
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.03, 1);
scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
scene.fogDensity = 0.003;
scene.fogColor = new BABYLON.Color3(0.08, 0.08, 0.1);

// UI elements
const startMenu = document.getElementById('startMenu');
const playButton = document.getElementById('playButton');

let player, weapons, flashlight, jumpscare;
let gameStarted = false;
let playerHealth = 100;
let lastDamageTime = 0;
let enemies = [];
let aiControllers = [];

// ----- Minimap setup -----
let minimapCamera, minimapTexture;
function createMinimap(scene, playerCamera) {
    minimapCamera = new BABYLON.FreeCamera("minimapCamera", new BABYLON.Vector3(0, 100, 0), scene);
    minimapCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    minimapCamera.orthoTop = 50;
    minimapCamera.orthoBottom = -50;
    minimapCamera.orthoLeft = -50;
    minimapCamera.orthoRight = 50;
    minimapCamera.rotation.x = Math.PI / 2;   // look straight down
    minimapCamera.layerMask = 2;               // only render layer 2

    // Give all environment meshes layerMask = 2 (or default 1 and we change camera mask)
    // Actually we can set camera to render everything and only show on minimap canvas
    minimapTexture = new BABYLON.RenderTargetTexture("minimap", 128, scene, false);
    minimapTexture.renderList = scene.meshes.filter(m => m.name !== 'flashBody' && !m.name.startsWith('hitEffect'));
    minimapTexture.activeCamera = minimapCamera;
    scene.customRenderTargets.push(minimapTexture);

    const minimapCanvas = document.getElementById('minimapCanvas');
    if (minimapCanvas) {
        const ctx = minimapCanvas.getContext('2d');
        scene.onAfterRenderObservable.add(() => {
            ctx.clearRect(0, 0, 128, 128);
            if (minimapTexture) {
                ctx.drawImage(minimapTexture.getInternalTexture().getCanvas(), 0, 0, 128, 128);
                // Draw player dot
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(64, 64, 3, 0, Math.PI*2);
                ctx.fill();
            }
        });
    }
}

// ----- Build Map -----
async function buildMap() {
    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 200, height: 200 }, scene);
    ground.isVisible = true;
    ground.checkCollisions = true;
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.1, 0.15, 0.05);
    ground.material = groundMat;
    ground.receiveShadows = true;

    // Load forest model
    try {
        const forest = await BABYLON.SceneLoader.ImportMeshAsync(null, "assets/models/", "forest.glb", scene);
        forest.meshes.forEach(m => { m.checkCollisions = true; m.receiveShadows = true; });
        forest.transformNodes[0].position.set(0, 0, 0);
        console.log("Forest loaded successfully");
    } catch (e) {
        console.warn("Forest model missing – fallback to procedural trees");
        // fallback: many procedural trees
        const trunkMat = new BABYLON.StandardMaterial("trunk", scene);
        trunkMat.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.1);
        for (let i=0; i<200; i++) {
            const x = (Math.random()-0.5)*180;
            const z = (Math.random()-0.5)*180;
            if (Math.sqrt(x*x+z*z)<10) continue;
            const trunk = BABYLON.MeshBuilder.CreateCylinder("tree", {height:4, diameter:0.4}, scene);
            trunk.position.set(x,2,z); trunk.checkCollisions=true;
            const top = BABYLON.MeshBuilder.CreateSphere("top", {diameter:2}, scene);
            top.position.set(x,4,z); top.checkCollisions=true;
        }
    }

    // Load abandoned house
    try {
        const house = await BABYLON.SceneLoader.ImportMeshAsync(null, "assets/models/", "Abandoned_House.glb", scene);
        house.meshes.forEach(m => { m.checkCollisions = true; });
        house.transformNodes[0].position.set(-40, 0, -45);
    } catch (e) { console.warn("House model missing"); }
}

// ----- Spawn enemies -----
async function spawnEnemy() {
    if (!player) return;
    const angle = Math.random()*Math.PI*2;
    const dist = 25 + Math.random()*20;
    let x = player.camera.position.x + Math.cos(angle)*dist;
    let z = player.camera.position.z + Math.sin(angle)*dist;
    x = Math.max(-95, Math.min(95, x));
    z = Math.max(-95, Math.min(95, z));
    try {
        const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "assets/models/", "Aswang1.fbx", scene);
        const root = result.transformNodes[0];
        root.position.set(x, 0, z);
        root.isMoving = false;
        result.meshes.forEach(m => m.checkCollisions = true);
        enemies.push(root);
        aiControllers.push(new AIController(root, player.camera, scene));
    } catch (e) { console.warn("Aswang model loading failed"); }
}

async function spawnInitialEnemies() {
    for (let i=0; i<4; i++) await spawnEnemy();
}

// ----- Health & HUD -----
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
    document.getElementById('healthDisplay').textContent = `❤️ ${playerHealth}`;
    if (weapons) {
        const w = weapons.currentWeapon;
        document.getElementById('weaponDisplay').textContent = `${w.icon} ${w.name}`;
        document.getElementById('ammoDisplay').textContent = (w.ammo === Infinity) ? '∞' : `${w.ammo} / ${w.maxAmmo}`;
    }
}
function showMessage(text, dur=2000) {
    const el = document.getElementById('messageDisplay');
    el.textContent = text;
    setTimeout(() => el.textContent = '', dur);
}

// Shooting callback (unchanged)
function onShoot(hitInfo) { /* … same as before … */ }
function isDescendantOf(mesh, root) { /* … same … */ }
function destroyEnemy(index) { /* … same … */ }

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

// ----- Init Game -----
async function initGame() {
    if (!gameStarted) return;
    await buildMap();
    setupLighting(scene);
    createMinimap(scene);
    initAudio();

    player = createPlayer(canvas, scene);
    player.camera.position = new BABYLON.Vector3(0, 1.7, 0);
    flashlight = createFlashlight(player.camera, scene);

    weapons = new WeaponSystem(scene, player.camera, onShoot, updateHUD);
    await spawnInitialEnemies();

    jumpscare = new JumpscareManager(
        document.getElementById('jumpscareOverlay'),
        document.getElementById('jumpscareText'),
        player.camera
    );

    // Mobile controls (only on touch devices)
    if ('ontouchstart' in window) {
        setupMobileControls(player.camera, canvas, scene, weapons, flashlight);
    }

    scene.onBeforeRenderObservable.add(() => {
        if (!player || playerHealth <= 0) return;
        for (let i=aiControllers.length-1; i>=0; i--) {
            if (enemies[i] && !enemies[i].isDisposed()) {
                aiControllers[i].update();
                const dist = BABYLON.Vector3.Distance(enemies[i].position, player.camera.position);
                if (dist < 1.8) {
                    jumpscare.trigger(); damagePlayer(30); destroyEnemy(i); continue;
                }
                if (dist < 2.5) {
                    const now = performance.now();
                    if (now - lastDamageTime > 1000) {
                        damagePlayer(8); showMessage("Inaatake ka!"); lastDamageTime = now;
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

// ----- Start Game (now awaiting properly) -----
async function startGame() {
    try {
        startMenu.style.display = 'none';
        gameStarted = true;
        canvas.requestPointerLock();
        await initGame();      // <-- crucial fix
        startHorrorAmbient();
    } catch (e) {
        console.error(e);
        startMenu.style.display = 'flex';
        alert('Failed to start: ' + e.message);
    }
}
window.startGame = startGame;
playButton.addEventListener('click', startGame);