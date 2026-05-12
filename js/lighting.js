// js/lighting.js
export function setupLighting(scene) {
    const ambient = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(0, 1, 0), scene);
    ambient.intensity = 0.5;          // brighter – you can see silhouettes
    ambient.diffuse = new BABYLON.Color3(0.25, 0.28, 0.3);
}

export function createFlashlight(camera, scene) {
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
    return flashlight;
}