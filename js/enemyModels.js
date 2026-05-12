// enemyModels.js

// ---------- UTILITY: Procedural fur texture (canvas) ----------
function createFurTexture(scene, baseColor, furColor, density = 1500) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    // Base skin color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);
    // Draw many thin fur strands
    ctx.strokeStyle = furColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < density; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const angle = Math.random() * Math.PI * 2;
        const length = Math.random() * 12 + 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        ctx.stroke();
    }
    const texture = new BABYLON.DynamicTexture("furTex", canvas, scene);
    const mat = new BABYLON.StandardMaterial("furMat", scene);
    mat.diffuseTexture = texture;
    mat.specularColor = BABYLON.Color3.Black();
    return mat;
}

// ---------- ASWANG (werewolf‑like, fur, claws, digitigrade legs) ----------
export function createAswangModel(scene) {
    const root = new BABYLON.TransformNode("aswang_root");
    const furMat = createFurTexture(scene, '#1a1205', '#2d1f0c', 1800);
    const darkFur = createFurTexture(scene, '#0d0802', '#1c1108', 1200);
    const clawMat = new BABYLON.StandardMaterial("claw", scene);
    clawMat.diffuseColor = new BABYLON.Color3(0.4, 0.35, 0.2);
    const eyeMat = new BABYLON.StandardMaterial("eye", scene);
    eyeMat.emissiveColor = new BABYLON.Color3(0.9, 0.1, 0.1);
    const mouthMat = new BABYLON.StandardMaterial("mouth", scene);
    mouthMat.diffuseColor = new BABYLON.Color3(0.4, 0, 0);

    // Torso (muscular, wide)
    const torso = BABYLON.MeshBuilder.CreateSphere("torso", { diameter: 1.0, diameterY: 1.2 }, scene);
    torso.parent = root;
    torso.position.y = 1.1;
    torso.scaling = new BABYLON.Vector3(1.1, 0.9, 0.8);
    torso.material = furMat;

    // Head (wolf‑human hybrid)
    const head = BABYLON.MeshBuilder.CreateSphere("head", { diameterX: 0.65, diameterY: 0.8, diameterZ: 0.7 }, scene);
    head.parent = root;
    head.position.set(0, 1.9, 0.15);
    head.material = darkFur;
    // Snout
    const snout = BABYLON.MeshBuilder.CreateCylinder("snout", { height: 0.5, diameterTop: 0.25, diameterBottom: 0.35 }, scene);
    snout.parent = head;
    snout.position.set(0, -0.05, 0.4);
    snout.rotation.x = Math.PI/2;
    snout.material = darkFur;
    // Mouth / teeth
    const upperJaw = BABYLON.MeshBuilder.CreateBox("jaw", { width: 0.35, height: 0.1, depth: 0.2 }, scene);
    upperJaw.parent = snout;
    upperJaw.position.z = 0.15;
    upperJaw.material = mouthMat;
    for (let i = -2; i <= 2; i++) {
        const tooth = BABYLON.MeshBuilder.CreateCylinder("tooth", { height: 0.12, diameterTop: 0, diameterBottom: 0.04 }, scene);
        tooth.parent = upperJaw;
        tooth.position.set(i*0.07, 0.1, 0.05);
        tooth.rotation.x = Math.PI;
        tooth.material = clawMat;
    }
    // Eyes
    const eyeL = BABYLON.MeshBuilder.CreateSphere("eyeL", { diameter: 0.12 }, scene);
    eyeL.parent = head;
    eyeL.position.set(-0.22, 0.25, 0.25);
    eyeL.material = eyeMat;
    const eyeR = eyeL.clone("eyeR");
    eyeR.parent = head;
    eyeR.position.x = 0.22;
    // Ears (pointed)
    const earL = BABYLON.MeshBuilder.CreateCylinder("ear", { height: 0.4, diameterTop: 0.03, diameterBottom: 0.1 }, scene);
    earL.parent = head;
    earL.position.set(-0.2, 0.5, 0);
    earL.rotation.z = -0.25;
    earL.material = darkFur;
    earL.clone("earR").parent = head;
    earL.clone("earR").position.x = 0.2;
    earL.clone("earR").rotation.z = 0.25;

    // Arms (jointed, with claws)
    const createArm = (side) => {
        const shoulder = BABYLON.MeshBuilder.CreateSphere("shoulder", { diameter: 0.3 }, scene);
        shoulder.parent = root;
        shoulder.position.set(side*0.65, 1.5, 0);
        shoulder.material = furMat;
        const upperArm = BABYLON.MeshBuilder.CreateCylinder("upperArm", { height: 0.9, diameter: 0.18 }, scene);
        upperArm.parent = shoulder;
        upperArm.position.y = -0.2;
        upperArm.rotation.z = side*0.3;
        upperArm.material = furMat;
        const elbow = BABYLON.MeshBuilder.CreateSphere("elbow", { diameter: 0.2 }, scene);
        elbow.parent = upperArm;
        elbow.position.y = -0.5;
        elbow.material = furMat;
        const forearm = BABYLON.MeshBuilder.CreateCylinder("forearm", { height: 0.85, diameter: 0.14 }, scene);
        forearm.parent = elbow;
        forearm.position.y = -0.1;
        forearm.material = furMat;
        // Hand & claws
        const hand = BABYLON.MeshBuilder.CreateSphere("hand", { diameter: 0.22 }, scene);
        hand.parent = forearm;
        hand.position.y = -0.5;
        hand.material = darkFur;
        for (let i = 0; i < 4; i++) {
            const claw = BABYLON.MeshBuilder.CreateCylinder("claw", { height: 0.25, diameterTop: 0, diameterBottom: 0.05 }, scene);
            claw.parent = hand;
            claw.position.set((i-1.5)*0.1, -0.18, 0.1);
            claw.rotation.x = -0.4;
            claw.rotation.z = (i-1.5)*0.15;
            claw.material = clawMat;
        }
        return { shoulder, elbow, hand };
    };
    const leftArm = createArm(-1);
    const rightArm = createArm(1);

    // Legs (digitigrade, furred)
    const createLeg = (side) => {
        const hip = BABYLON.MeshBuilder.CreateSphere("hip", { diameter: 0.35 }, scene);
        hip.parent = root;
        hip.position.set(side*0.4, 0.6, -0.1);
        hip.material = furMat;
        const thigh = BABYLON.MeshBuilder.CreateCylinder("thigh", { height: 0.9, diameter: 0.24 }, scene);
        thigh.parent = hip;
        thigh.position.y = -0.2;
        thigh.material = furMat;
        const knee = BABYLON.MeshBuilder.CreateSphere("knee", { diameter: 0.22 }, scene);
        knee.parent = thigh;
        knee.position.y = -0.5;
        knee.material = furMat;
        const shin = BABYLON.MeshBuilder.CreateCylinder("shin", { height: 0.9, diameter: 0.18 }, scene);
        shin.parent = knee;
        shin.position.y = -0.1;
        shin.rotation.x = -0.3;
        shin.material = furMat;
        const foot = BABYLON.MeshBuilder.CreateBox("foot", { width: 0.35, height: 0.15, depth: 0.5 }, scene);
        foot.parent = shin;
        foot.position.set(0, -0.5, 0.1);
        foot.material = darkFur;
        return { hip, knee };
    };
    const leftLeg = createLeg(-1);
    const rightLeg = createLeg(1);

    // Fur tufts (many thin cylinders on shoulders and back)
    for (let i = 0; i < 12; i++) {
        const tuft = BABYLON.MeshBuilder.CreateCylinder("tuft", { height: 0.35, diameterTop: 0.01, diameterBottom: 0.06 }, scene);
        tuft.parent = torso;
        tuft.position.set((Math.random()-0.5)*0.8, 0.5 + Math.random()*0.3, (Math.random()-0.5)*0.5);
        tuft.rotation.x = Math.random()*0.5;
        tuft.rotation.z = (Math.random()-0.5)*0.5;
        tuft.material = darkFur;
    }

    // Animation state
    root.walkTime = 0;
    root.breathTime = 0;
    root.updateAnimation = function() {
        if (this.isDisposed()) return;
        this.breathTime += 0.03;
        // Breathing
        torso.scaling.y = 0.9 + Math.sin(this.breathTime)*0.03;
        // Simple walk cycle (when moving, we'll use a flag set by AI)
        if (root.isMoving) {
            root.walkTime += 0.15;
            const swing = Math.sin(root.walkTime) * 0.4;
            // Swing arms and legs (rotate shoulders/hips)
            leftArm.shoulder.rotation.z = -0.3 + swing;
            rightArm.shoulder.rotation.z = 0.3 - swing;
            leftLeg.hip.rotation.x = swing * 0.5;
            rightLeg.hip.rotation.x = -swing * 0.5;
        } else {
            // Idle slight sway
            leftArm.shoulder.rotation.z = -0.3 + Math.sin(this.breathTime)*0.05;
            rightArm.shoulder.rotation.z = 0.3 - Math.sin(this.breathTime)*0.05;
        }
    };

    return { root, leftArm, rightArm, leftLeg, rightLeg };
}

// ---------- MANANANGGAL (floating half‑body, hair, entrails) ----------
export function createManananggalModel(scene) {
    const root = new BABYLON.TransformNode("manananggal_root");
    const skinMat = createFurTexture(scene, '#2c2c2c', '#1a1a1a', 900);
    const bloodMat = new BABYLON.StandardMaterial("blood", scene);
    bloodMat.diffuseColor = new BABYLON.Color3(0.7, 0.1, 0.1);
    bloodMat.emissiveColor = new BABYLON.Color3(0.2, 0, 0);
    const eyeMat = new BABYLON.StandardMaterial("eye", scene);
    eyeMat.emissiveColor = new BABYLON.Color3(1, 0.2, 0.2);

    // Torso (severed, with ribs showing)
    const torso = BABYLON.MeshBuilder.CreateSphere("torso", { diameter: 0.9, diameterY: 0.6, slice: 0.6 }, scene);
    torso.parent = root;
    torso.position.y = 0.8;
    torso.material = skinMat;
    // Ribs
    for (let i = 0; i < 4; i++) {
        const rib = BABYLON.MeshBuilder.CreateCylinder("rib", { height: 0.4, diameter: 0.05 }, scene);
        rib.parent = torso;
        rib.position.set(0, -0.3 + i*0.15, 0.2);
        rib.rotation.x = Math.PI/2;
        rib.material = bloodMat;
    }

    // Hanging entrails
    for (let i = 0; i < 6; i++) {
        const tube = BABYLON.MeshBuilder.CreateCylinder("entrail", { height: 0.5, diameter: 0.07 }, scene);
        tube.parent = root;
        tube.position.set((Math.random()-0.5)*0.4, 0.4, (Math.random()-0.5)*0.4);
        tube.rotation.x = Math.random()*0.8;
        tube.material = bloodMat;
    }

    // Head (gaunt, long hair)
    const head = BABYLON.MeshBuilder.CreateSphere("head", { diameterX: 0.55, diameterY: 0.65, diameterZ: 0.55 }, scene);
    head.parent = root;
    head.position.y = 1.3;
    head.material = skinMat;
    // Hair (many thin planes)
    const hairMat = new BABYLON.StandardMaterial("hair", scene);
    hairMat.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    for (let i = 0; i < 20; i++) {
        const strand = BABYLON.MeshBuilder.CreatePlane("strand", { width: 0.05, height: 0.6 }, scene);
        strand.parent = head;
        strand.position.set((Math.random()-0.5)*0.6, -0.4, (Math.random()-0.5)*0.6);
        strand.rotation.x = Math.random()*0.4;
        strand.rotation.z = Math.random()*0.4;
        strand.material = hairMat;
    }
    // Eyes
    const eyeL = BABYLON.MeshBuilder.CreateSphere("eyeL", { diameter: 0.12 }, scene);
    eyeL.parent = head;
    eyeL.position.set(-0.2, 0.15, 0.25);
    eyeL.material = eyeMat;
    eyeL.clone("eyeR").parent = head;
    eyeL.clone("eyeR").position.x = 0.2;

    // Wings (bat‑like, membrane)
    const wingMat = new BABYLON.StandardMaterial("wing", scene);
    wingMat.diffuseColor = new BABYLON.Color3(0.2, 0.1, 0.1);
    wingMat.alpha = 0.7;
    wingMat.backFaceCulling = false;
    for (let side = -1; side <= 1; side += 2) {
        const armBone = BABYLON.MeshBuilder.CreateCylinder("wingArm", { height: 1.3, diameter: 0.07 }, scene);
        armBone.parent = root;
        armBone.position.set(side*0.7, 0.9, 0);
        armBone.rotation.z = side*0.6;
        armBone.material = skinMat;
        // membrane
        const membrane = BABYLON.MeshBuilder.CreatePlane("membrane", { width: 1.6, height: 1.2 }, scene);
        membrane.parent = armBone;
        membrane.position.set(side*0.15, 0.5, 0);
        membrane.rotation.z = side*0.3;
        membrane.rotation.y = side*0.3;
        membrane.material = wingMat;
        // finger bones
        for (let j = 0; j < 3; j++) {
            const finger = BABYLON.MeshBuilder.CreateCylinder("finger", { height: 0.8, diameter: 0.04 }, scene);
            finger.parent = armBone;
            finger.position.set(side*0.2, 0.7, (j-1)*0.2);
            finger.rotation.z = side*0.2;
            finger.rotation.x = (j-1)*0.2;
            finger.material = skinMat;
        }
    }

    root.breathTime = 0;
    root.updateAnimation = function() {
        this.breathTime += 0.02;
        // floating bobbing
        this.position.y = 2 + Math.sin(this.breathTime)*0.3;
    };

    return root;
}

// ---------- TIKBALANG (muscular horse‑man, mane, hooves) ----------
export function createTikbalangModel(scene) {
    const root = new BABYLON.TransformNode("tikbalang_root");
    const furMat = createFurTexture(scene, '#3a2a1a', '#2a1a0a', 1500);
    const maneMat = new BABYLON.StandardMaterial("mane", scene);
    maneMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    maneMat.alpha = 0.8;
    const hoofMat = new BABYLON.StandardMaterial("hoof", scene);
    hoofMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    const eyeMat = new BABYLON.StandardMaterial("eye", scene);
    eyeMat.emissiveColor = new BABYLON.Color3(1, 0.5, 0);

    // Legs (digitigrade, thick)
    const createLeg = (side) => {
        const hip = BABYLON.MeshBuilder.CreateSphere("hip", { diameter: 0.4 }, scene);
        hip.parent = root;
        hip.position.set(side*0.5, 0.8, 0);
        hip.material = furMat;
        const upper = BABYLON.MeshBuilder.CreateCylinder("upperLeg", { height: 1.2, diameter: 0.28 }, scene);
        upper.parent = hip;
        upper.position.y = -0.3;
        upper.material = furMat;
        const knee = BABYLON.MeshBuilder.CreateSphere("knee", { diameter: 0.25 }, scene);
        knee.parent = upper;
        knee.position.y = -0.7;
        knee.material = furMat;
        const lower = BABYLON.MeshBuilder.CreateCylinder("lowerLeg", { height: 1.0, diameter: 0.2 }, scene);
        lower.parent = knee;
        lower.position.y = -0.2;
        lower.rotation.x = -0.2;
        lower.material = furMat;
        const hoof = BABYLON.MeshBuilder.CreateBox("hoof", { width: 0.3, height: 0.2, depth: 0.4 }, scene);
        hoof.parent = lower;
        hoof.position.set(0, -0.6, 0.05);
        hoof.material = hoofMat;
        return { hip, knee };
    };
    const leftLeg = createLeg(-1);
    const rightLeg = createLeg(1);

    // Torso (muscular, wide)
    const torso = BABYLON.MeshBuilder.CreateSphere("torso", { diameter: 1.0, diameterY: 1.4 }, scene);
    torso.parent = root;
    torso.position.y = 1.8;
    torso.scaling.x = 1.2;
    torso.material = furMat;

    // Mane (planes along neck)
    for (let i = 0; i < 15; i++) {
        const strand = BABYLON.MeshBuilder.CreatePlane("mane", { width: 0.1, height: 0.6 }, scene);
        strand.parent = torso;
        strand.position.set((Math.random()-0.5)*0.4, 0.8, (Math.random()-0.5)*0.3);
        strand.rotation.x = 0.2;
        strand.rotation.z = Math.random()*0.3;
        strand.material = maneMat;
    }

    // Horse head
    const head = BABYLON.MeshBuilder.CreateBox("head", { width: 0.5, height: 0.6, depth: 0.9 }, scene);
    head.parent = root;
    head.position.y = 2.8;
    head.position.z = 0.3;
    head.material = furMat;
    // Snout
    const snout = BABYLON.MeshBuilder.CreateCylinder("snout", { height: 0.4, diameterTop: 0.15, diameterBottom: 0.25 }, scene);
    snout.parent = head;
    snout.position.set(0, 0, 0.5);
    snout.rotation.x = Math.PI/2;
    snout.material = furMat;
    // Ears
    const earL = BABYLON.MeshBuilder.CreateCylinder("ear", { height: 0.35, diameterTop: 0.03, diameterBottom: 0.12 }, scene);
    earL.parent = head;
    earL.position.set(-0.18, 0.35, 0);
    earL.rotation.z = -0.3;
    earL.material = furMat;
    earL.clone("earR").parent = head;
    earL.clone("earR").position.x = 0.18;
    earL.clone("earR").rotation.z = 0.3;
    // Eyes
    const eyeL = BABYLON.MeshBuilder.CreateSphere("eyeL", { diameter: 0.14 }, scene);
    eyeL.parent = head;
    eyeL.position.set(-0.2, 0.18, 0.4);
    eyeL.material = eyeMat;
    eyeL.clone("eyeR").parent = head;
    eyeL.clone("eyeR").position.x = 0.2;

    // Arms (muscular)
    const createArm = (side) => {
        const shoulder = BABYLON.MeshBuilder.CreateSphere("shoulder", { diameter: 0.3 }, scene);
        shoulder.parent = root;
        shoulder.position.set(side*0.7, 2.1, 0);
        shoulder.material = furMat;
        const upper = BABYLON.MeshBuilder.CreateCylinder("upperArm", { height: 1.1, diameter: 0.2 }, scene);
        upper.parent = shoulder;
        upper.position.y = -0.2;
        upper.rotation.z = side*0.3;
        upper.material = furMat;
        const elbow = BABYLON.MeshBuilder.CreateSphere("elbow", { diameter: 0.2 }, scene);
        elbow.parent = upper;
        elbow.position.y = -0.6;
        elbow.material = furMat;
        const forearm = BABYLON.MeshBuilder.CreateCylinder("forearm", { height: 1.0, diameter: 0.16 }, scene);
        forearm.parent = elbow;
        forearm.position.y = -0.2;
        forearm.material = furMat;
        const hand = BABYLON.MeshBuilder.CreateBox("hand", { width: 0.25, height: 0.15, depth: 0.2 }, scene);
        hand.parent = forearm;
        hand.position.y = -0.6;
        hand.material = furMat;
        return { shoulder, elbow };
    };
    const leftArm = createArm(-1);
    const rightArm = createArm(1);

    root.walkTime = 0;
    root.breathTime = 0;
    root.updateAnimation = function() {
        this.breathTime += 0.02;
        torso.scaling.y = 1.0 + Math.sin(this.breathTime)*0.04;
        if (root.isMoving) {
            root.walkTime += 0.12;
            const swing = Math.sin(root.walkTime)*0.5;
            leftLeg.hip.rotation.x = swing;
            rightLeg.hip.rotation.x = -swing;
            leftArm.shoulder.rotation.z = -0.3 + swing*0.2;
            rightArm.shoulder.rotation.z = 0.3 - swing*0.2;
        }
    };

    return { root, leftLeg, rightLeg, leftArm, rightArm };
}

// ---------- TIYANAK (crawling demon baby, fur patches, sharp teeth) ----------
export function createTiyanakModel(scene) {
    const root = new BABYLON.TransformNode("tiyanak_root");
    const skinMat = createFurTexture(scene, '#4a2a2a', '#2a1a1a', 1000);
    const bloodMat = new BABYLON.StandardMaterial("blood", scene);
    bloodMat.diffuseColor = new BABYLON.Color3(0.5, 0, 0);
    const toothMat = new BABYLON.StandardMaterial("tooth", scene);
    toothMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.7);
    const eyeMat = new BABYLON.StandardMaterial("eye", scene);
    eyeMat.emissiveColor = new BABYLON.Color3(0.8, 0, 0);

    // Body (plump)
    const body = BABYLON.MeshBuilder.CreateSphere("body", { diameter: 0.6, diameterY: 0.5 }, scene);
    body.parent = root;
    body.position.y = 0.3;
    body.material = skinMat;

    // Head (oversized)
    const head = BABYLON.MeshBuilder.CreateSphere("head", { diameter: 0.55 }, scene);
    head.parent = root;
    head.position.y = 0.7;
    head.material = skinMat;
    // Eyes
    const eyeL = BABYLON.MeshBuilder.CreateSphere("eyeL", { diameter: 0.1 }, scene);
    eyeL.parent = head;
    eyeL.position.set(-0.15, 0.15, 0.22);
    eyeL.material = eyeMat;
    eyeL.clone("eyeR").parent = head;
    eyeL.clone("eyeR").position.x = 0.15;
    // Mouth (jagged teeth)
    for (let i = -2; i <= 2; i++) {
        const tooth = BABYLON.MeshBuilder.CreateCylinder("tooth", { height: 0.1, diameterTop: 0, diameterBottom: 0.04 }, scene);
        tooth.parent = head;
        tooth.position.set(i*0.08, -0.1, 0.25);
        tooth.rotation.x = 0.3;
        tooth.material = toothMat;
    }

    // Crawling limbs (short, bent)
    const limbMat = skinMat;
    const createLimb = (x, y, z, length, angle) => {
        const base = BABYLON.MeshBuilder.CreateSphere("joint", { diameter: 0.15 }, scene);
        base.parent = root;
        base.position.set(x, y, z);
        base.material = limbMat;
        const segment = BABYLON.MeshBuilder.CreateCylinder("segment", { height: length, diameter: 0.1 }, scene);
        segment.parent = base;
        segment.position.y = -length/2;
        segment.rotation.x = angle;
        segment.material = limbMat;
        return base;
    };
    createLimb(0.25, 0.2, 0.2, 0.35, 0.4);
    createLimb(-0.25, 0.2, 0.2, 0.35, 0.4);
    createLimb(0.25, 0.2, -0.2, 0.35, -0.4);
    createLimb(-0.25, 0.2, -0.2, 0.35, -0.4);

    root.breathTime = 0;
    root.updateAnimation = function() {
        this.breathTime += 0.08;
        const bounce = Math.abs(Math.sin(this.breathTime)) * 0.06;
        this.position.y = 0.1 + bounce;
    };

    return root;
}