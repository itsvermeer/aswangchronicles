export class WeaponSystem {
    constructor(scene, camera, onShootCallback) {
        this.scene = scene;
        this.camera = camera;
        this.onShoot = onShootCallback;
        this.cooldown = false;
        this.cooldownTime = 250; // ms

        window.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            if (!document.pointerLockElement) return;
            if (this.cooldown) return;
            this.cooldown = true;
            setTimeout(() => this.cooldown = false, this.cooldownTime);

            // Raycast
            const origin = camera.position.clone();
            const forward = camera.getDirection(BABYLON.Vector3.Forward()).normalize();
            const ray = new BABYLON.Ray(origin, forward, 25);
            const hit = this.scene.pickWithRay(ray, (mesh) => mesh.name !== 'ground' && mesh.checkCollisions !== undefined);
            
            // Gunshot sound
            this.playGunshot();

            // Callback
            this.onShoot({ hit: hit?.hit, pickedMesh: hit?.pickedMesh, point: hit?.pickedPoint });
        });
    }

    playGunshot() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 120;
            osc.type = 'square';
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.08);
        } catch (e) {}
    }
}