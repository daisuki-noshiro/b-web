import { gsap } from 'gsap';
import { clamp } from './layout.js';

export class Camera {
  constructor(worldWidth, viewportWidth, reducedMotion = false) {
    this.worldWidth = worldWidth;
    this.viewportWidth = viewportWidth;
    this.x = 0;
    this.target = 0;
    this.reducedMotion = reducedMotion;
    // quickTo 永远重定向同一个 Tween，连续滚轮不会创建动画队列。
    this.toX = gsap.quickTo(this, 'x', { duration: 0.42, ease: 'power3.out' });
  }

  get maxX() { return Math.max(0, this.worldWidth - this.viewportWidth); }
  get renderX() { return clamp(Math.round(this.x), 0, this.maxX); }
  get centerX() { return this.renderX + this.viewportWidth / 2; }

  moveBy(delta) { this.moveTo(this.target + delta); }

  moveTo(value) {
    if (!Number.isFinite(value)) return;
    this.target = clamp(value, 0, this.maxX);
    if (this.reducedMotion) {
      this.toX.tween.pause();
      this.x = this.target;
    } else {
      this.toX(this.target, this.x);
    }
  }

  stop() {
    this.toX.tween.pause();
    this.target = this.x = clamp(this.x, 0, this.maxX);
  }

  resize(viewportWidth) {
    const destination = this.target;
    this.viewportWidth = viewportWidth;
    this.stop();
    this.moveTo(destination);
  }

  destroy() { this.toX.tween.kill(); }
}
