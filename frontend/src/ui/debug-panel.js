export class DebugPanel {
  constructor() {
    this.panel = document.getElementById('debug-panel');
    this.toggle = document.getElementById('debug-toggle');
    this.elapsed = 0;
    this.frames = 0;
    this.fps = 0;
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    this.toggle.addEventListener('click', () => this.setVisible(this.panel.hidden), options);
    document.getElementById('debug-close').addEventListener('click', () => this.setVisible(false), options);
    this.setVisible(window.innerWidth > 700);
  }

  setVisible(visible) { this.panel.hidden = !visible; this.toggle.setAttribute('aria-expanded', String(visible)); }

  update(dt, camera, region) {
    this.frames += 1;
    this.elapsed += dt;
    if (this.elapsed < 0.3) return;
    this.fps = Math.round(this.frames / this.elapsed);
    document.getElementById('debug-fps').textContent = String(this.fps);
    document.getElementById('debug-camera').textContent = `${camera.renderX} px`;
    document.getElementById('debug-region').textContent = region.name;
    this.frames = 0;
    this.elapsed = 0;
  }

  async checkAPI() {
    const label = document.getElementById('debug-api');
    try {
      const response = await fetch('/api/health', { signal: AbortSignal.any([this.abort.signal, AbortSignal.timeout(5000)]), cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.status !== 'ok' || result.service !== 'b-web') throw new Error('响应格式异常');
      label.textContent = '已连接 · b-web';
      label.dataset.state = 'ok';
    } catch (error) {
      if (this.abort.signal.aborted) return;
      label.textContent = `未连接 · ${error.name === 'TimeoutError' ? '超时' : error.message}`;
      label.dataset.state = 'error';
    }
  }

  destroy() { this.abort.abort(); }
}
