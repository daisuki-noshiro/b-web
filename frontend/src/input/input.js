import { clamp } from '../core/layout.js';

export class Input {
  constructor(host, camera, getScale, isBlocked) {
    this.camera = camera;
    this.keys = new Set();
    this.buttons = new Set();
    this.isBlocked = isBlocked;
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    host.addEventListener('wheel', (event) => {
      if (event.ctrlKey) return; // 保留浏览器缩放。
      event.preventDefault();
      if (this.isBlocked()) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? host.clientHeight : 1;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      camera.moveBy(clamp(delta * unit, -240, 240) / getScale());
    }, { ...options, passive: false });
    window.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (this.isBlocked()) return;
      event.preventDefault();
      this.keys.add(event.key);
    }, options);
    window.addEventListener('keyup', (event) => this.keys.delete(event.key), options);
    window.addEventListener('blur', () => this.clear(), options);
    document.addEventListener('visibilitychange', () => this.clear(), options);
    for (const [id, key] of [['move-left', 'ArrowLeft'], ['move-right', 'ArrowRight']]) {
      const button = document.getElementById(id);
      button.addEventListener('pointerdown', (event) => {
        if (this.isBlocked()) return;
        button.setPointerCapture(event.pointerId);
        this.buttons.add(key);
      }, options);
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => this.buttons.delete(key), options);
      // Enter / Space 可通过真实按钮点击逐步探索。
      button.addEventListener('click', (event) => { if (event.detail === 0 && !this.isBlocked()) camera.moveBy(key === 'ArrowLeft' ? -180 : 180); }, options);
    }
  }

  update(dt) {
    if (this.isBlocked()) return this.clear();
    const left = this.keys.has('ArrowLeft') || this.buttons.has('ArrowLeft');
    const right = this.keys.has('ArrowRight') || this.buttons.has('ArrowRight');
    if (left !== right) this.camera.moveBy((right ? 1 : -1) * 280 * dt);
  }

  clear() { this.keys.clear(); this.buttons.clear(); }
  destroy() { this.abort.abort(); this.clear(); }
}
