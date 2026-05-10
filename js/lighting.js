export function setupLighting(scene) {
    // Very dim ambient
    const ambient = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(0, 1, 0), scene);
    ambient.intensity = 0.12;
    ambient.diffuse = new BABYLON.Color3(0.15, 0.15, 0.18);

    // Flashlight: activated in main.js after camera created? We'll attach there.
    // But to keep it modular, we can export a function to create it.
}

export function createFlashlight(camera, scene) {
    const flashlight = new BABYLON.SpotLight(
        "flashlight",
        new BABYLON.Vector3(0.25, -0.35, 0.7),
        new BABYLON.Vector3(0, -0.1, 1),
        Math.PI / 7,
        0.4,
        scene
    );
    flashlight.parent = camera;
    flashlight.intensity = 2.2;
    flashlight.diffuse = new BABYLON.Color3(1, 0.9, 0.7);
    flashlight.specular = new BABYLON.Color3(1, 0.9, 0.7);
    flashlight.range = 14;
    flashlight.falloffType = BABYLON.Light.FALLOFF_PHYSICAL;
    return flashlight;
}