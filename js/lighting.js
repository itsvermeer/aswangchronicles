// js/lighting.js
export function setupLighting(scene) {
    const ambient = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(0, 1, 0), scene);
    ambient.intensity = 0.7;          // much brighter – ground visible even without flashlight
    ambient.diffuse = new BABYLON.Color3(0.4, 0.4, 0.45);
}

export function createFlashlight(camera, scene) {
    // Flashlight (spot)
    const flashlight = new BABYLON.SpotLight(
        "flashlight",
        new BABYLON.Vector3(0.3, -0.35, 0.7),
        new BABYLON.Vector3(0, -0.1, 1),
        Math.PI / 3.3,
        0.8,
        scene
    );
    flashlight.parent = camera;
    flashlight.intensity = 4.0;
    flashlight.diffuse = new BABYLON.Color3(1, 0.92, 0.75);
    flashlight.specular = new BABYLON.Color3(1, 0.92, 0.75);
    flashlight.range = 20;
    flashlight.falloffType = BABYLON.Light.FALLOFF_PHYSICAL;

    // Backup point light (so something always illuminates the nearby ground)
    const pointLight = new BABYLON.PointLight("backupLight", camera.position, scene);
    pointLight.parent = camera;
    pointLight.intensity = 0.8;
    pointLight.range = 8;

    return flashlight;
}