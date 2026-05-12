// js/player.js
export function createPlayer(canvas, scene) {
    const camera = new BABYLON.UniversalCamera("fpsCamera", new BABYLON.Vector3(0, 1.7, 0), scene);
    camera.minZ = 0.1;
    camera.fov = 1.2;
    camera.speed = 0.3;
    camera.checkCollisions = true;
    camera.applyGravity = true;
    camera.ellipsoid = new BABYLON.Vector3(0.5, 0.9, 0.5);

    const keys = { w: false, a: false, s: false, d: false };
    camera.isJumping = false;
    camera.isCrouching = false;
    camera.isSitting = false;
    camera._jumpVelocity = 0;
    camera._normalHeight = 1.7;
    camera._normalSpeed = 0.3;

    let isLocked = false;

    canvas.addEventListener('click', () => canvas.requestPointerLock());
    document.addEventListener('pointerlockchange', () => {
        isLocked = (document.pointerLockElement === canvas);
    });

    window.addEventListener('mousemove', (e) => {
        if (!isLocked) return;
        camera.cameraRotation.y += e.movementX * 0.0004;
        camera.cameraRotation.x += e.movementY * 0.0004;
        camera.cameraRotation.x = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, camera.cameraRotation.x));
    });

    window.addEventListener('keydown', (e) => {
        if (!isLocked && e.key !== ' ') return;
        const key = e.key.toLowerCase();
        if (key in keys) { e.preventDefault(); keys[key] = true; }
        if (key === ' ' || key === 'tab') {
            e.preventDefault();
            if (!camera.isJumping && !camera.isSitting) {
                camera.isJumping = true;
                camera._jumpVelocity = 0.22;
            }
        }
        if (key === 'c') {
            e.preventDefault();
            if (!camera.isCrouching && !camera.isSitting) {
                camera.isCrouching = true;
                camera.speed = 0.15;
                camera.ellipsoid.y = 0.5;
                camera.position.y -= 0.4;
            } else if (camera.isCrouching) {
                camera.isCrouching = false;
                camera.speed = camera._normalSpeed;
                camera.ellipsoid.y = 0.9;
                camera.position.y += 0.4;
            }
        }
        if (key === 'x') {
            e.preventDefault();
            if (!camera.isSitting) {
                if (camera.isCrouching) {
                    camera.isCrouching = false;
                    camera.speed = camera._normalSpeed;
                    camera.ellipsoid.y = 0.9;
                    camera.position.y += 0.4;
                }
                camera.isSitting = true;
                camera.speed = 0.08;
                camera.ellipsoid.y = 0.4;
                camera.position.y -= 0.7;
            } else {
                camera.isSitting = false;
                camera.speed = camera._normalSpeed;
                camera.ellipsoid.y = 0.9;
                camera.position.y += 0.7;
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key in keys) { e.preventDefault(); keys[key] = false; }
    });

    scene.onBeforeRenderObservable.add(() => {
        if (camera.isJumping) {
            camera.position.y += camera._jumpVelocity;
            camera._jumpVelocity -= 0.008;
            if (camera.position.y <= camera._normalHeight) {
                camera.position.y = camera._normalHeight;
                camera.isJumping = false;
                camera._jumpVelocity = 0;
            }
        }
        if (!isLocked) return;
        const forward = camera.getDirection(BABYLON.Vector3.Forward()); forward.y = 0; forward.normalize();
        const right = camera.getDirection(BABYLON.Vector3.Right()); right.y = 0; right.normalize();
        let moveDir = BABYLON.Vector3.Zero();
        if (keys.w) moveDir = moveDir.add(forward);
        if (keys.s) moveDir = moveDir.subtract(forward);
        if (keys.a) moveDir = moveDir.subtract(right);
        if (keys.d) moveDir = moveDir.add(right);
        if (moveDir.length() > 0) moveDir.normalize();
        camera.cameraDirection = moveDir.scale(camera.speed);
    });

    return { camera };
}