// js/weapons.js
import { playSound } from './audio.js';

export class WeaponSystem {
    constructor(scene, camera, onShootCallback, updateHUDCallback) {
        this.scene = scene;
        this.camera = camera;
        this.onShoot = onShootCallback;
        this.updateHUD = updateHUDCallback;

        this.weapons = [
            { name: 'Pistol',   ammo: 12, maxAmmo: 12, damage: 1,   cooldown: 250, icon: 'P', type: 'hitscan', pelletCount: 1,  spread: 0.01 },
            { name: 'Shotgun',  ammo: 4,  maxAmmo: 4,  damage: 0.34,cooldown: 900, icon: 'S', type: 'shotgun', pelletCount: 6,  spread: 0.12 },
            { name: 'Rifle',    ammo: 5,  maxAmmo: 5,  damage: 3,   cooldown: 600, icon: 'R', type: 'hitscan', pelletCount: 1,  spread: 0.005 },
            { name: 'Bolo',     ammo: Infinity, maxAmmo: Infinity, damage: 100, cooldown: 500, icon: 'B', type: 'melee' }
        ];

        this.currentWeaponIndex = 0;
        this.cooldownActive = false;

        window.addEventListener('keydown', (e) => {
            if (e.key === '1') this.switchWeapon(0);
            if (e.key === '2') this.switchWeapon(1);
            if (e.key === '3') this.switchWeapon(2);
            if (e.key === '4') this.switchWeapon(3);
        });

        this.setupShooting();
    }

    get currentWeapon() {
        return this.weapons[this.currentWeaponIndex];
    }

    switchWeapon(index) {
        if (index === this.currentWeaponIndex) return;
        if (index >= 0 && index < this.weapons.length) {
            this.currentWeaponIndex = index;
            this.updateHUD();
        }
    }

    // ---------- Muzzle Flash Effect ----------
    createMuzzleFlash() {
        const flashLight = new BABYLON.PointLight("muzzleFlashLight", this.camera.position.clone(), this.scene);
        flashLight.intensity = 0.8;
        flashLight.diffuse = new BABYLON.Color3(1, 0.7, 0.3);
        flashLight.range = 3;
        // Position it slightly in front of the camera
        const forward = this.camera.getDirection(BABYLON.Vector3.Forward());
        flashLight.position.addInPlace(forward.scale(0.5));
        flashLight.position.y += 0.2;

        // Expanding sphere as visual flash
        const flashSphere = BABYLON.MeshBuilder.CreateSphere("muzzleSphere", { diameter: 0.05 }, this.scene);
        flashSphere.position = flashLight.position.clone();
        const flashMat = new BABYLON.StandardMaterial("flashMat", this.scene);
        flashMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0.2);
        flashMat.alpha = 0.9;
        flashSphere.material = flashMat;

        // Animate: quick scale up and fade out
        const startScale = 0.05;
        const endScale = 0.25;
        let frame = 0;
        const maxFrames = 8;   // ~8 frames at 60fps = 0.13s
        const observer = this.scene.onBeforeRenderObservable.add(() => {
            frame++;
            const progress = frame / maxFrames;
            const scale = startScale + (endScale - startScale) * progress;
            flashSphere.scaling.setAll(scale);
            flashMat.alpha = 0.9 * (1 - progress);
            if (frame >= maxFrames) {
                flashLight.dispose();
                flashSphere.dispose();
                this.scene.onBeforeRenderObservable.remove(observer);
            }
        });
    }

    // ---------- Shooting ----------
    setupShooting() {
        window.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            if (!document.pointerLockElement) return;
            if (this.cooldownActive) return;

            const weapon = this.currentWeapon;
            if (weapon.type === 'melee') {
                this.performMelee();
            } else {
                if (weapon.ammo <= 0) {
                    this.onShoot({ hit: false, empty: true });
                    return;
                }
                weapon.ammo--;
                if (weapon.type === 'hitscan') {
                    this.performHitscan(weapon);
                } else if (weapon.type === 'shotgun') {
                    this.performShotgun(weapon);
                }
            }

            // Muzzle flash for guns (not melee)
            if (weapon.type !== 'melee') {
                this.createMuzzleFlash();
            }

            this.cooldownActive = true;
            setTimeout(() => { this.cooldownActive = false; }, weapon.cooldown);

            // Play improved sound
            playSound(weapon.type);
            this.updateHUD();
        });
    }

    performHitscan(weapon) {
        const origin = this.camera.position.clone();
        const forward = this.camera.getDirection(BABYLON.Vector3.Forward()).normalize();
        const spreadVec = new BABYLON.Vector3(
            (Math.random() - 0.5) * weapon.spread,
            (Math.random() - 0.5) * weapon.spread,
            0
        );
        const dir = forward.add(spreadVec).normalize();
        const ray = new BABYLON.Ray(origin, dir, 30);
        const hit = this.scene.pickWithRay(ray, (mesh) => mesh.name !== 'ground' && mesh.checkCollisions !== undefined);
        this.onShoot({ hit: hit && hit.hit, pickedMesh: hit && hit.pickedMesh, point: hit && hit.pickedPoint, damage: weapon.damage });
    }

    performShotgun(weapon) {
        const origin = this.camera.position.clone();
        const forward = this.camera.getDirection(BABYLON.Vector3.Forward()).normalize();
        let anyHit = false;
        for (let i = 0; i < weapon.pelletCount; i++) {
            const spread = new BABYLON.Vector3(
                (Math.random() - 0.5) * weapon.spread * 2,
                (Math.random() - 0.5) * weapon.spread * 2,
                0
            );
            const dir = forward.add(spread).normalize();
            const ray = new BABYLON.Ray(origin, dir, 15);
            const hit = this.scene.pickWithRay(ray, (mesh) => mesh.name !== 'ground' && mesh.checkCollisions !== undefined);
            if (hit && hit.hit) {
                anyHit = true;
                this.onShoot({ hit: true, pickedMesh: hit.pickedMesh, point: hit.pickedPoint, damage: weapon.damage });
                break;
            }
        }
        if (!anyHit) this.onShoot({ hit: false });
    }

    performMelee() {
        const origin = this.camera.position.clone();
        const forward = this.camera.getDirection(BABYLON.Vector3.Forward()).normalize();
        const hitPoint = origin.add(forward.scale(1.8));
        this.onShoot({ hit: true, melee: true, point: hitPoint, damage: this.currentWeapon.damage });
    }
}