import { Application, TextureStyle } from 'pixi.js';
import { viewportFor } from './layout.js';

export async function createApplication(host, onResize) {
  TextureStyle.defaultOptions.scaleMode = 'nearest';
  const app = new Application();
  const viewport = () => viewportFor(host.clientWidth, host.clientHeight);
  const initial = viewport();
  await app.init({
    width: initial.width,
    height: initial.height,
    resolution: 1,
    autoDensity: false,
    antialias: false,
    roundPixels: true,
    preference: 'webgl',
    background: '#f2c3a5',
    autoStart: false,
  });
  app.canvas.setAttribute('aria-label', '像素晚霞景观，使用滚轮或左右方向键横向探索');
  host.append(app.canvas);
  let current;
  const resize = () => {
    const next = viewport();
    if (current && current.width === next.width && current.height === next.height && current.scale === next.scale) return;
    current = next;
    app.renderer.resize(next.width, next.height);
    // 向上取整会多出不足 scale 个 CSS 像素，由 host 裁切；始终填满窗口。
    app.canvas.style.width = `${next.width * next.scale}px`;
    app.canvas.style.height = `${next.height * next.scale}px`;
    onResize(next);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  return { app, destroy() { observer.disconnect(); app.destroy(true, { children: true, context: true }); } };
}
