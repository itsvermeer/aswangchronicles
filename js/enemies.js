// enemies.js
import { createAswangModel, createManananggalModel, createTikbalangModel, createTiyanakModel } from './enemyModels.js';

function spawnEnemy(modelCreator, scene, playerPosition) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * 15;
    let x = playerPosition.x + Math.cos(angle) * dist;
    let z = playerPosition.z + Math.sin(angle) * dist;
    if (Math.abs(x) > 95) x = 95 * Math.sign(x);
    if (Math.abs(z) > 95) z = 95 * Math.sign(z);

    const result = modelCreator(scene);
    const enemy = result.root || result; // some models return object with root
    enemy.position.set(x, 0, z);
    enemy.isMoving = false; // will be toggled by AI

    // Store animation function if available
    if (enemy.updateAnimation) {
        scene.onBeforeRenderObservable.add(() => {
            if (!enemy.isDisposed()) enemy.updateAnimation();
        });
    }
    return enemy;
}

export function createAswang(scene, playerPosition) {
    return spawnEnemy(createAswangModel, scene, playerPosition);
}
export function createManananggal(scene, playerPosition) {
    return spawnEnemy(createManananggalModel, scene, playerPosition);
}
export function createTikbalang(scene, playerPosition) {
    return spawnEnemy(createTikbalangModel, scene, playerPosition);
}
export function createTiyanak(scene, playerPosition) {
    return spawnEnemy(createTiyanakModel, scene, playerPosition);
}