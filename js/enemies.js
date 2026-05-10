export function createAswang(scene, playerPosition) {
    // Spawn far from player
    const angle = Math.random() * Math.PI * 2;
    const dist = 10 + Math.random() * 8;
    let spawnX = playerPosition.x + Math.cos(angle) * dist;
    let spawnZ = playerPosition.z + Math.sin(angle) * dist;
    if (Math.abs(spawnX) > 18) spawnX = 18 * Math.sign(spawnX);
    if (Math.abs(spawnZ) > 18) spawnZ = 18 * Math.sign(spawnZ);

    const root = new BABYLON.TransformNode("aswang_root");
    root.position.set(spawnX, 0, spawnZ);

    // Body
    const body = BABYLON.MeshBuilder.CreateBox("body", { width: 0.7, height: 1.1, depth: 0.4 }, scene);
    body.parent = root;
    body.position.y = 0.9;
    const bodyMat = new BABYLON.StandardMaterial("bodyMat", scene);
    bodyMat.diffuseColor = new BABYLON.Color3(0.1, 0.08, 0.05);
    body.material = bodyMat;

    // Head
    const head = BABYLON.MeshBuilder.CreateSphere("head", { diameterX: 0.65, diameterY: 0.7, diameterZ: 0.55 }, scene);
    head.parent = root;
    head.position.y = 1.6;
    const headMat = new BABYLON.StandardMaterial("headMat", scene);
    headMat.diffuseColor = new BABYLON.Color3(0.2, 0.15, 0.1);
    head.material = headMat;

    // Glowing eyes
    const eyeMat = new BABYLON.StandardMaterial("eyeMat", scene);
    eyeMat.emissiveColor = new BABYLON.Color3(1, 0.1, 0.1);
    const leftEye = BABYLON.MeshBuilder.CreateSphere("eye", { diameter: 0.12 }, scene);
    leftEye.parent = head;
    leftEye.position.set(-0.2, 0.18, 0.26);
    leftEye.material = eyeMat;
    const rightEye = leftEye.clone("rightEye");
    rightEye.parent = head;
    rightEye.position.x = 0.2;

    // Wings
    const wingMat = new BABYLON.StandardMaterial("wingMat", scene);
    wingMat.diffuseColor = new BABYLON.Color3(0.08, 0.06, 0.04);
    wingMat.backFaceCulling = false;
    const createWing = (side) => {
        const wing = BABYLON.MeshBuilder.CreatePlane("wing", { width: 1.0, height: 0.5 }, scene);
        wing.parent = root;
        wing.position.y = 1.2;
        wing.position.x = side * 0.55;
        wing.rotation.z = side * 0.5;
        wing.rotation.y = side * 0.4;
        wing.material = wingMat;
    };
    createWing(-1);
    createWing(1);

    // Long tongue
    const tongue = BABYLON.MeshBuilder.CreateCylinder("tongue", { height: 0.7, diameter: 0.07 }, scene);
    tongue.parent = head;
    tongue.position.set(0, -0.25, 0.35);
    tongue.rotation.x = Math.PI/2;
    const tongueMat = new BABYLON.StandardMaterial("tongueMat", scene);
    tongueMat.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
    tongueMat.emissiveColor = new BABYLON.Color3(0.3, 0, 0);
    tongue.material = tongueMat;

    return root;
}