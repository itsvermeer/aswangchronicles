// ai.js

export class AIController {
    constructor(enemyRoot, playerCamera, scene) {
        this.enemy = enemyRoot;
        this.player = playerCamera;
        this.scene = scene;
        this.speed = 0.025;          // very slow, horror pace
        this.detectionRange = 40;    // start chasing when player within this distance
        this.attackRange = 2.5;      // same damage range
        this.giveUpRange = 50;       // stop chasing if too far
    }

    setTarget(newEnemy) {
        this.enemy = newEnemy;
    }

    update() {
        // Safety checks
        if (!this.enemy || this.enemy.isDisposed() || !this.player) {
            if (this.enemy && !this.enemy.isDisposed()) {
                this.enemy.isMoving = false;   // ensure animation stops
            }
            return;
        }

        const playerPos = this.player.position.clone();
        const enemyPos = this.enemy.position.clone();
        const dist = BABYLON.Vector3.Distance(playerPos, enemyPos);

        // Stop moving if player is too far or already inside attack range
        if (dist > this.detectionRange || dist <= this.attackRange) {
            this.enemy.isMoving = false;
            return;
        }

        // --- Move towards player ---
        this.enemy.isMoving = true;

        // Direction vector (ignore height differences)
        const direction = playerPos.subtract(enemyPos);
        direction.y = 0;
        direction.normalize();

        // Smooth rotation towards player
        const targetAngle = Math.atan2(direction.x, direction.z);
        let currentAngle = this.enemy.rotation.y;
        let diff = targetAngle - currentAngle;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        this.enemy.rotation.y += diff * 0.04;   // slow rotation

        // Move forward in the direction the enemy is facing
        const forward = new BABYLON.Vector3(
            Math.sin(this.enemy.rotation.y),
            0,
            Math.cos(this.enemy.rotation.y)
        );
        const newPos = enemyPos.add(forward.scale(this.speed));

        // Keep within map bounds (avoid leaving the playable area)
        if (Math.abs(newPos.x) < 95 && Math.abs(newPos.z) < 95) {
            this.enemy.position.copyFrom(newPos);
        }
    }
}