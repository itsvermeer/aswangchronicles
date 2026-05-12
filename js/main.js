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

const startMenu = document.getElementById('startMenu');
const playButton = document.getElementById('playButton');
let player, weapons, flashlight, jumpscare;
let gameStarted = false;
let playerHealth = 100;
let lastDamageTime = 0;
let enemies = [], aiControllers = [];

// ---- Minimap ----
let minimapCamera, minimapTexture;
function createMinimap() {
    minimapCamera = new BABYLON.FreeCamera("minimapCam", new BABYLON.Vector3(0, 100, 0), scene);
    minimapCamera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    minimapCamera.orthoTop = 50; minimapCamera.orthoBottom = -50;
    minimapCamera.orthoLeft = -50; minimapCamera.orthoRight = 50;
    minimapCamera.rotation.x = Math.PI/2;
    minimapTexture = new BABYLON.RenderTargetTexture("minimap", 128, scene, false);
    minimapTexture.renderList = scene.meshes.filter(m => m.name !== 'flashBody');
    minimapTexture.activeCamera = minimapCamera;
    scene.customRenderTargets.push(minimapTexture);
}

// ---- Skybox using HDRI ----
function createSkybox(hdriPath) {
    const hdrTexture = new BABYLON.HDRCubeTexture(hdriPath, scene, 512);
    scene.environmentTexture = hdrTexture;
    scene.createDefaultSkybox(hdrTexture, true, 1000);
}

// ---- Build Map ----
async function buildMap() {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 200, height: 200 }, scene);
    ground.checkCollisions = true;
    const gmat = new BABYLON.StandardMaterial("gmat", scene);
    gmat.diffuseColor = new BABYLON.Color3(0.10, 0.15, 0.05);
    ground.material = gmat;
    ground.receiveShadows = true;

    // Forest model (if available)
    try {
        const forest = await BABYLON.SceneLoader.ImportMeshAsync(null, "assets/models/", "forest.glb", scene);
        forest.meshes.forEach(m => { m.checkCollisions = true; m.receiveShadows = true; });
        forest.transformNodes[0].position.set(0,0,0);
    } catch(e) {
        // fallback trees (cylinder+sphere) already in earlier code? We'll skip for brevity
    }

    // Grass patches
    try {
        const grass = await BABYLON.SceneLoader.ImportMeshAsync(null, "assets/models/", "grass.glb", scene);
        grass.meshes.forEach(m => m.isVisible = false);
        for (let i=0; i<100; i++) {
            const x = (Math.random()-0.5)*190;
            const z = (Math.random()-0.5)*190;
            if (Math.sqrt(x*x+z*z)<12) continue;
            const clone = grass.meshes[0].clone("grass"+i);
            clone.isVisible = true;
            clone.position.set(x, 0, z);
            clone.scaling.setAll(0.3+Math.random()*0.5);
            clone.checkCollisions = false;
        }
    } catch(e) { console.warn('Grass model missing'); }

    // Abandoned House
    try {
        const house = await BABYLON.SceneLoader.ImportMeshAsync(null, "assets/models/", "Abandoned_House.glb", scene);
        house.meshes.forEach(m => m.checkCollisions = true);
        house.transformNodes[0].position.set(-40, 0, -45);
    } catch(e) {}
}

// ---- Enemies ----
async function spawnEnemy() {
    if (!player) return;
    const angle = Math.random()*Math.PI*2, dist = 25+Math.random()*20;
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
    } catch(e) {}
}

async function spawnInitialEnemies() {
    for (let i=0; i<4; i++) await spawnEnemy();
}

// ---- Health & HUD ----
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
    document.getElementById('healthBox').textContent = `❤️ ${playerHealth}`;
    if (weapons) {
        const w = weapons.currentWeapon;
        document.getElementById('weaponName').textContent = w.name;
        document.getElementById('ammoBox').textContent = (w.ammo===Infinity) ? '∞' : `${w.ammo} / ${w.maxAmmo}`;
    }
}
function showMessage(text, dur=2000) {
    const el = document.getElementById('messageDisplay');
    el.textContent = text;
    setTimeout(() => el.textContent = '', dur);
}

// ---- Shooting ----
function onShoot(hitInfo) {
    if (hitInfo.empty) { showMessage("Walang bala! Mag-reload (R)"); return; }
    if (hitInfo.melee) {
        for (let i=enemies.length-1; i>=0; i--) {
            if (enemies[i] && !enemies[i].isDisposed() && BABYLON.Vector3.Distance(enemies[i].position, player.camera.position)<2.5) {
                destroyEnemy(i); showMessage("Tinaga mo ang kalaban!", 2500); return;
            }
        }
        showMessage("Wala sa abot!"); return;
    }
    if (hitInfo?.hit && hitInfo.pickedMesh) {
        let node = hitInfo.pickedMesh;
        while (node) {
            for (let i=enemies.length-1; i>=0; i--) {
                if (enemies[i] && !enemies[i].isDisposed() && isDescendantOf(node, enemies[i])) {
                    destroyEnemy(i); showMessage("Napatay ang kalaban!", 2500); return;
                }
            }
            node = node.parent;
        }
    }
}
function isDescendantOf(mesh, root) { let cur=mesh; while(cur){if(cur===root)return true; cur=cur.parent;} return false; }
function destroyEnemy(index) {
    if (enemies[index]) enemies[index].dispose();
    enemies.splice(index,1);
    aiControllers.splice(index,1);
    setTimeout(() => { if (gameStarted && player) spawnEnemy(); }, 8000);
}

// ---- Reload ----
window.addEventListener('keydown', (e) => {
    if ((e.key==='r'||e.key==='R') && gameStarted && weapons) {
        const w = weapons.currentWeapon;
        if (w.type!=='melee') { w.ammo = w.maxAmmo; updateHUD(); showMessage("Nagreload!", 1000); }
    }
});

// ---- Init Game ----
async function initGame() {
    if (!gameStarted) return;
    await buildMap();
    setupLighting(scene);
    createSkybox("assets/textures/night_stars.exr");   // <-- your HDRI
    createMinimap();
    initAudio();

    player = createPlayer(canvas, scene);
    player.camera.position.set(0, 1.7, 0);
    flashlight = createFlashlight(player.camera, scene);

    weapons = new WeaponSystem(scene, player.camera, onShoot, updateHUD);
    await spawnInitialEnemies();

    jumpscare = new JumpscareManager(
        document.getElementById('jumpscareOverlay'),
        document.getElementById('jumpscareText'),
        player.camera
    );

    if ('ontouchstart' in window) {
        setupMobileControls(player.camera, canvas, scene, weapons, flashlight);
    }

    scene.onBeforeRenderObservable.add(() => {
        if (!player || playerHealth<=0) return;
        for (let i=aiControllers.length-1; i>=0; i--) {
            if (enemies[i] && !enemies[i].isDisposed()) {
                aiControllers[i].update();
                const dist = BABYLON.Vector3.Distance(enemies[i].position, player.camera.position);
                if (dist<1.8) { jumpscare.trigger(); damagePlayer(30); destroyEnemy(i); continue; }
                if (dist<2.5) {
                    const now = performance.now();
                    if (now - lastDamageTime > 1000) { damagePlayer(8); showMessage("Inaatake ka!"); lastDamageTime=now; }
                }
            }
        }
        // Draw minimap player dot
        const mc = document.getElementById('minimapCanvas');
        if (mc && minimapTexture) {
            const ctx = mc.getContext('2d');
            ctx.clearRect(0,0,128,128);
            ctx.drawImage(minimapTexture.getInternalTexture().getCanvas(),0,0,128,128);
            ctx.fillStyle='red'; ctx.beginPath(); ctx.arc(64,64,3,0,Math.PI*2); ctx.fill();
        }
    });

    initMultiplayer();
    engine.runRenderLoop(() => scene.render());
    window.addEventListener('resize', () => engine.resize());
    updateHUD();
}

// ---- Start ----
async function startGame() {
    try {
        startMenu.style.display = 'none';
        gameStarted = true;
        canvas.requestPointerLock();
        await initGame();
        startHorrorAmbient();
    } catch(e) {
        console.error(e);
        startMenu.style.display = 'flex';
        alert('Failed to start: ' + e.message);
    }
}
window.startGame = startGame;
playButton.addEventListener('click', startGame);