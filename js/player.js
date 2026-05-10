export function createPlayer(canvas, scene) {
    const camera = new BABYLON.UniversalCamera("fpsCamera", new BABYLON.Vector3(0, 1.7, 0), scene);
    camera.minZ = 0.1;
    camera.fov = 1.2;
    camera.speed = 1.0;
    camera.inertia = 0.7;
    camera.angularSensibility = 2000;
    camera.checkCollisions = true;
    camera.applyGravity = true;
    camera.ellipsoid = new BABYLON.Vector3(0.5, 0.9, 0.5);

    // Enable collisions for all meshes with checkCollisions = true (set in map)
    // Attach control when pointer locked
    camera.attachControl(canvas, true);

    return { camera };
}