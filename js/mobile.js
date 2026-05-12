// js/mobile.js
export function setupMobileControls(camera, canvas, scene, weapons, flashlight) {
    const mobileDiv = document.getElementById('mobileControls');
    if (!mobileDiv) return;
    mobileDiv.style.display = 'flex';

    // ----- Joystick -----
    const joystickZone = document.getElementById('joystickZone');
    const thumb = document.getElementById('joystickThumb');
    let joystickActive = false;
    let joyCenter = { x: 0, y: 0 };
    let moveX = 0, moveY = 0;
    const maxDist = 40;

    function joystickStart(e) {
        e.preventDefault();
        joystickActive = true;
        const touch = e.touches[0];
        const rect = joystickZone.getBoundingClientRect();
        joyCenter.x = rect.left + rect.width/2;
        joyCenter.y = rect.top + rect.height/2;
        joystickMove(e);
    }
    function joystickMove(e) {
        if (!joystickActive) return;
        e.preventDefault();
        const touch = e.touches[0];
        let dx = touch.clientX - joyCenter.x;
        let dy = touch.clientY - joyCenter.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }
        thumb.style.transform = `translate(${dx}px, ${dy}px)`;
        moveX = dx / maxDist;
        moveY = -dy / maxDist;
    }
    function joystickEnd(e) {
        joystickActive = false;
        moveX = 0; moveY = 0;
        thumb.style.transform = 'translate(0px, 0px)';
    }
    joystickZone.addEventListener('touchstart', joystickStart);
    joystickZone.addEventListener('touchmove', joystickMove);
    joystickZone.addEventListener('touchend', joystickEnd);

    // ----- Action Buttons -----
    document.getElementById('btnFire').addEventListener('touchstart', (e) => {
        e.preventDefault();
        canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
    });
    document.getElementById('btnFire').addEventListener('touchend', (e) => {
        e.preventDefault();
        canvas.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
    });

    document.getElementById('btnAim').addEventListener('touchstart', (e) => {
        e.preventDefault();
        camera.fov = 0.7;   // zoom in
    });
    document.getElementById('btnAim').addEventListener('touchend', (e) => {
        e.preventDefault();
        camera.fov = 1.2;   // restore
    });

    document.getElementById('btnReload').addEventListener('touchstart', (e) => {
        e.preventDefault();
        // Trigger 'R' key logic via custom event or direct call
        if (weapons) {
            const w = weapons.currentWeapon;
            if (w.type !== 'melee') {
                w.ammo = w.maxAmmo;
                weapons.updateHUD();
            }
        }
    });

    let flashlightOn = true;
    document.getElementById('btnFlashlight').addEventListener('touchstart', (e) => {
        e.preventDefault();
        flashlightOn = !flashlightOn;
        if (flashlight) {
            flashlight.intensity = flashlightOn ? 4.0 : 0.0;
        }
    });

    // ----- Apply joystick movement every frame -----
    scene.onBeforeRenderObservable.add(() => {
        if (!joystickActive) return;
        const forward = camera.getDirection(BABYLON.Vector3.Forward());
        forward.y = 0; forward.normalize();
        const right = camera.getDirection(BABYLON.Vector3.Right());
        right.y = 0; right.normalize();
        const moveVector = forward.scale(moveY).add(right.scale(moveX));
        camera.cameraDirection = moveVector.scale(camera.speed);
    });
}