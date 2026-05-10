import { createPlayer } from './player.js';
import { createAswang } from './enemies.js';
import { WeaponSystem } from './weapons.js';
import { AIController } from './ai.js';
import { setupLighting } from './lighting.js';
import { initAudio } from './audio.js';
import { JumpscareManager } from './jumpscare.js';
import { initMultiplayer } from './multiplayer.js';

const canvas = document.getElementById('gameCanvas');
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.03, 1);
scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
scene.fogDensity = 0.015;
scene.fogColor = new BABYLON.Color3(0.02, 0.02, 0.03);

// ----- Simple procedural map (dark barangay) -----
function buildMap() {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 40, height: 40 }, scene);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.15, 0.12, 0.08);
    ground.material = groundMat;
    ground.receiveShadows = true;

    // Creepy ruined walls
    const wallMat = new BABYLON.StandardMaterial("wallMat", scene);
    wallMat.diffuseColor = new BABYLON.Color3(0.3, 0.25, 0.2);
    const addWall = (x, z, w, h, d, rotY = 0) => {
        const wall = BABYLON.MeshBuilder.CreateBox("wall", { width: w, height: h, depth: d }, scene);
        wall.position.set(x, h/2, z);
        wall.rotation.y = rotY;
        wall.material = wallMat;
        wall.checkCollisions = true;
        wall.receiveShadows = true;
    };

    // Outer boundary
    for (let i = -19; i <= 19; i += 2.5) {
        addWall(i, -19.5, 2, 3, 0.5);
        addWall(i, 19.5, 2, 3, 0.5);
        addWall(-19.5, i, 0.5, 3, 2);
        addWall(19.5, i, 0.5, 3, 2);
    }
    // Inner structures
    addWall(-7, -8, 8, 2.8, 0.5);
    addWall(8, 6, 6, 2.8, 0.5, Math.PI/3);
    addWall(-11, 10, 5, 2.5, 0.5, -Math.PI/4);
    addWall(0, 0, 6, 2.5, 0.5);
    // Old trees (simple pillars)
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + 0.5;
        const r = 12;
        const x = Math.cos(angle) * r, z = Math.sin(angle) * r;
        const trunk = BABYLON.MeshBuilder.CreateCylinder("tree", { height: 4, diameter: 0.5 }, scene);
        trunk.position.set(x, 2, z);
        trunk.material = wallMat;
        trunk.checkCollisions = true;
    }
}

// ----- Game state -----
let player, aswang, weapons, ai, jumpscare;
let ammo = 7;
const MAX_AMMO = 7;

// UI elements
const ammoEl = document.getElementById('ammoDisplay');
const healthEl = document.getElementById('healthDisplay');
const messageEl = document.getElementById('messageDisplay');

function updateHUD() {
    ammoEl.textContent = `🔫 ${ammo} / ${MAX_AMMO}`;
    healthEl.textContent = `❤️ 100`;
}

function showMessage(text, duration = 2000) {
    messageEl.textContent = text;
    setTimeout(() => { messageEl.textContent = ''; }, duration);
}

// Shooting callback (called from weapons.js)
function onShoot(hitInfo) {
    if (ammo <= 0) {
        showMessage("Walang bala!");
        return false;
    }
    ammo--;
    updateHUD();
    if (hitInfo?.hit && hitInfo.pickedMesh) {
        // Check if it's the aswang
        let node = hitInfo.pickedMesh;
        while (node) {
            if (node.name === 'aswang_root') {
                destroyAswang();
                showMessage("Patay na ang Aswang!", 3000);
                break;
            }
            node = node.parent;
        }
    }
    return true;
}

function destroyAswang() {
    if (aswang) {
        aswang.dispose();
        aswang = null;
        ai.setTarget(null);
        // Respawn after a while
        setTimeout(() => {
            if (!aswang) {
                aswang = createAswang(scene, player.camera.position);
                ai.setTarget(aswang);
                showMessage("May bagong Aswang...");
            }
        }, 8000);
    }
}

// Reload on 'R' key
window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        ammo = MAX_AMMO;
        updateHUD();
        showMessage("Nagreload!", 1000);
    }
});

// ----- Initialization -----
buildMap();
setupLighting(scene);
initAudio();

player = createPlayer(canvas, scene);
weapons = new WeaponSystem(scene, player.camera, onShoot);
aswang = createAswang(scene, player.camera.position);
ai = new AIController(aswang, player.camera, scene);

jumpscare = new JumpscareManager(
    document.getElementById('jumpscareOverlay'),
    document.getElementById('jumpscareText'),
    player.camera
);

// Check jumpscare distance
scene.onBeforeRenderObservable.add(() => {
    if (!aswang || aswang.isDisposed()) return;
    const dist = BABYLON.Vector3.Distance(aswang.position, player.camera.position);
    if (dist < 1.8) {
        jumpscare.trigger();
        destroyAswang();
    }
});

// Multiplayer placeholder
initMultiplayer();

// Start
engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());

// Click to lock pointer
canvas.addEventListener('click', () => canvas.requestPointerLock());
updateHUD();