import { playSound } from './audio.js';

export class JumpscareManager {
    constructor(overlayElement, textElement, camera) {
        this.overlay = overlayElement;
        this.text = textElement;
        this.camera = camera;
        this.triggered = false;
    }

    trigger() {
        if (this.triggered) return;
        this.triggered = true;
        this.overlay.style.display = 'flex';
        playSound('jumpscare');

        // Screen shake
        const originalPos = this.camera.position.clone();
        const start = performance.now();
        const interval = setInterval(() => {
            const elapsed = performance.now() - start;
            if (elapsed > 600) {
                clearInterval(interval);
                this.camera.position.copyFrom(originalPos);
                this.overlay.style.display = 'none';
                this.triggered = false;
                return;
            }
            const shake = 0.12;
            this.camera.position.set(
                originalPos.x + (Math.random() - 0.5) * shake * 2,
                originalPos.y + (Math.random() - 0.5) * shake * 2,
                originalPos.z
            );
        }, 16);
    }
}