// js/player.js
export function createPlayer(canvas, scene) {
    const camera = new BABYLON.UniversalCamera("fpsCamera", new BABYLON.Vector3(0, 1.7, 0), scene);
    camera.minZ = 0.1;
    camera.fov = 1.2;
    camera.speed = 0.3;                // ⬅️ VERY SLOW walk
    camera.checkCollisions = true;
    camera.applyGravity = true;
    camera.ellipsoid = new BABYLON.Vector3(0.5, 0.9, 0.5);

    const keys = { w: false, a: false, s: false, d: false };
    camera.isJumping = false;
    camera.isCrouching = false;
    camera.isSitting = false;
    camera._jumpVelocity = 0;
    camera._normalHeight = 1.7;
    camera._normalSpeed = 0.3;         // base speed

    let isLocked = false;

    canvas.addEventListener('click', () => canvas.requestPointerLock());
    document.addEventListener('pointerlockchange', () => {
        isLocked = (document.pointerLockElement === canvas);
    });

    // ---- MOUSE LOOK (extremely dampened) ----
    window.addEventListener('mousemove', (e) => {
        if (!isLocked) return;
        const dx = e.movementX;
        const dy = e.movementY;
        camera.cameraRotation.y += dx * 0.0004;   // ⬅️ much slower (was 0.001)
        camera.cameraRotation.x += dy * 0.0004;
        camera.cameraRotation.x = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, camera.cameraRotation.x));
    });

    // ---- KEYBOARD ----
    window.addEventListener('keydown', (e) => {
        if (!isLocked && e.key !== ' ') return;
        const key = e.key.toLowerCase();
        if (key in keys) {
            e.preventDefault();
            keys[key] = true;
        }
        // Jump
        if (key === ' ' || key === 'tab') {
            e.preventDefault();
            if (!camera.isJumping && !camera.isSitting) {
                camera.isJumping = true;
                camera._jumpVelocity = 0.22;
            }
        }
        // Crouch toggle
        if (key === 'c') {
            e.preventDefault();
            if (!camera.isCrouching && !camera.isSitting) {
                camera.isCrouching = true;
                camera.speed = 0.15;           // even slower crouch
                camera.ellipsoid.y = 0.5;
                camera.position.y -= 0.4;
            } else if (camera.isCrouching) {
                camera.isCrouching = false;
                camera.speed = camera._normalSpeed;
                camera.ellipsoid.y = 0.9;
                camera.position.y += 0.4;
            }
        }
        // Sit toggle
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
                camera.speed = 0.08;            // crawling pace
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
        if (key in keys) {
            e.preventDefault();
            keys[key] = false;
        }
    });

    // ---- MOVEMENT UPDATE ----
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
        const forward = camera.getDirection(BABYLON.Vector3.Forward());
        forward.y = 0; forward.normalize();
        const right = camera.getDirection(BABYLON.Vector3.Right());
        right.y = 0; right.normalize();

        let moveDir = BABYLON.Vector3.Zero();
        if (keys.w) moveDir = moveDir.add(forward);
        if (keys.s) moveDir = moveDir.subtract(forward);
        if (keys.a) moveDir = moveDir.subtract(right);
        if (keys.d) moveDir = moveDir.add(right);
        if (moveDir.length() > 0) moveDir.normalize();
        camera.cameraDirection = moveDir.scale(camera.speed);
    });

    // Mobile controls (same as before, just using the same speed values)
    if ('ontouchstart' in window) {
        setupMobileControls(camera, canvas, scene);
    }
    return { camera };
}

function setupMobileControls(camera, canvas, scene) {
    const mobileDiv = document.getElementById('mobileControls');
    if (mobileDiv) mobileDiv.style.display = 'flex';

    const joystickZone = document.getElementById('joystickZone');
    const thumb = document.getElementById('joystickThumb');
    let joystickActive = false;
    let joyCenter = { x: 0, y: 0 };
    let moveX = 0, moveY = 0;
    const maxDist = 40;

    function handleJoystickStart(e) {
        e.preventDefault();
        joystickActive = true;
        const touch = e.touches[0];
        const rect = joystickZone.getBoundingClientRect();
        joyCenter.x = rect.left + rect.width / 2;
        joyCenter.y = rect.top + rect.height / 2;
        handleJoystickMove(e);
    }
    function handleJoystickMove(e) {
        if (!joystickActive) return;
        e.preventDefault();
        const touch = e.touches[0];
        let dx = touch.clientX - joyCenter.x;
        let dy = touch.clientY - joyCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }
        thumb.style.transform = `translate(${dx}px, ${dy}px)`;
        moveX = dx / maxDist;
        moveY = -dy / maxDist;
    }
    function handleJoystickEnd(e) {
        joystickActive = false;
        moveX = 0; moveY = 0;
        thumb.style.transform = `translate(0px, 0px)`;
    }
    joystickZone.addEventListener('touchstart', handleJoystickStart);
    joystickZone.addEventListener('touchmove', handleJoystickMove);
    joystickZone.addEventListener('touchend', handleJoystickEnd);

    const shootBtn = document.getElementById('shootButton');
    shootBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mousedown', { button: 0 });
        canvas.dispatchEvent(mouseEvent);
    });

    const jumpBtn = document.getElementById('jumpButton');
    jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!camera.isJumping && !camera.isSitting) {
            camera.isJumping = true;
            camera._jumpVelocity = 0.22;
        }
    });

    scene.onBeforeRenderObservable.add(() => {
        if (joystickActive) {
            const forward = camera.getDirection(BABYLON.Vector3.Forward());
            forward.y = 0; forward.normalize();
            const right = camera.getDirection(BABYLON.Vector3.Right());
            right.y = 0; right.normalize();
            const moveVector = forward.scale(moveY).add(right.scale(moveX));
            camera.cameraDirection = moveVector.scale(camera.speed);
        }
    });
}