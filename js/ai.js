export class AIController {
    constructor(targetTransform, playerCamera, scene) {
        this.target = targetTransform;
        this.player = playerCamera;
        this.scene = scene;
        this.speed = 0.045;
    }

    setTarget(newTarget) {
        this.target = newTarget;
    }

    // Called every frame in main loop
    update() {
        if (!this.target || this.target.isDisposed()) return;

        const playerPos = this.player.position;
        const enemyPos = this.target.position;
        const direction = playerPos.subtract(enemyPos);
        const distance = direction.length();
        if (distance > 1.8) {
            direction.normalize();
            // Rotate smoothly
            const targetAngle = Math.atan2(direction.x, direction.z);
            let current = this.target.rotation.y;
            let diff = targetAngle - current;
            while (diff > Math.PI) diff -= 2*Math.PI;
            while (diff < -Math.PI) diff += 2*Math.PI;
            this.target.rotation.y += diff * 0.06;

            // Move forward
            const forward = new BABYLON.Vector3(Math.sin(this.target.rotation.y), 0, Math.cos(this.target.rotation.y));
            const newPos = enemyPos.add(forward.scale(this.speed));
            // Bounds check
            if (Math.abs(newPos.x) < 18 && Math.abs(newPos.z) < 18) {
                this.target.position.copyFrom(newPos);
            }
        }
    }
}