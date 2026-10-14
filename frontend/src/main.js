import './styles.css';
import { Camera } from './core/camera.js';
import { createApplication } from './core/application.js';
import { clamp } from './core/layout.js';
import { World } from './world/world.js';
import { Input } from './input/input.js';
import { Interaction } from './interaction/interaction.js';
import { Modal } from './ui/modal.js';
import { DebugPanel } from './ui/debug-panel.js';
import { memories } from './data/memories.js';
import { WORLD, WORLD_EVENTS, regionAt } from './config.js';

async function start() {
  const host = document.getElementById('world');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const camera = new Camera(WORLD.width, 1, motion.matches);
  const hint = document.getElementById('interaction-hint');
  const debug = new DebugPanel();
  const interaction = new Interaction(WORLD_EVENTS, (event) => {
    if (event.type === 'memory') modal.open(memories[event.contentId]);
  });
  const modal = new Modal((open) => {
    interaction.blocked = open;
    hint.hidden = open || !interaction.nearby;
    input?.clear();
    camera.stop();
  });
  let world;
  let input;
  let viewport;
  let hintWidth = 0;
  let lastHintPosition = '';
  const runtime = await createApplication(host, (next) => {
    viewport = next;
    hintWidth = 0;
    lastHintPosition = '';
    camera.resize(next.width);
    if (world) world.resize(next);
  });
  const app = runtime.app;
  world = new World(app.stage, (id) => interaction.trigger(id));
  world.resize(viewport);
  world.reducedMotion = motion.matches;
  input = new Input(host, camera, () => viewport.scale, () => modal.isOpen || document.hidden);
  const abort = new AbortController();
  hint.addEventListener('click', () => interaction.nearby && interaction.trigger(interaction.nearby.id), { signal: abort.signal });
  const changeMotion = () => { camera.stop(); camera.reducedMotion = world.reducedMotion = motion.matches; };
  motion.addEventListener('change', changeMotion, { signal: abort.signal });
  document.addEventListener('visibilitychange', () => {
    camera.stop();
    if (document.hidden) app.stop(); else app.start();
  }, { signal: abort.signal });

  let lastProgress = -1;
  let lastRegion;
  app.ticker.maxFPS = 60;
  app.ticker.add((ticker) => {
    const realDt = ticker.elapsedMS / 1000;
    const dt = Math.min(realDt, 0.05);
    input.update(dt);
    world.update(dt, camera);
    const nearby = interaction.update(camera);
    hint.hidden = !nearby || modal.isOpen;
    if (nearby) {
      const point = world.eventScreenPosition(camera, nearby);
      const position = `${point.x},${point.y}`;
      if (!hintWidth) hintWidth = hint.offsetWidth;
      if (position !== lastHintPosition) {
        const left = clamp(point.x, hintWidth / 2 + 12, host.clientWidth - hintWidth / 2 - 12);
        hint.style.left = `${left}px`;
        hint.style.top = `${point.y}px`;
        hint.style.setProperty('--pointer-x', `${hintWidth / 2 + point.x - left}px`);
        lastHintPosition = position;
      }
    }
    const region = regionAt(camera.centerX);
    if (lastRegion !== region.name) {
      document.getElementById('region-label').textContent = `${region.number} / ${region.name}`;
      lastRegion = region.name;
    }
    const progress = Math.round(camera.renderX / Math.max(1, camera.maxX) * 1000) / 10;
    if (progress !== lastProgress) {
      document.getElementById('progress-fill').style.width = `${progress}%`;
      document.getElementById('progress-marker').style.left = `${progress}%`;
      lastProgress = progress;
    }
    debug.update(realDt, camera, region);
  });
  app.start();
  document.getElementById('loading').hidden = true;
  debug.checkAPI();

  // 只在开发/专门验证构建中暴露只读快照，E2E 必须通过真实输入操作世界。
  if (import.meta.env.DEV || import.meta.env.VITE_VALIDATION === 'true') {
    window.__BWEB_DEBUG__ = {
      snapshot: () => ({
        x: camera.x, renderX: camera.renderX, target: camera.target, maxX: camera.maxX,
        viewport: { ...viewport }, modalOpen: modal.isOpen, nearby: interaction.nearby?.id || null,
        region: regionAt(camera.centerX).name, fps: debug.fps,
        layers: Object.fromEntries(Object.entries(world.layers).map(([name, node]) => [name, node.x])),
        animations: { cloudX: world.clouds[2].node.x, lampAlpha: world.lamp.alpha, grassSkew: world.grasses[1].node.skew.x },
        mailbox: world.eventScreenPosition(camera, WORLD_EVENTS[0]),
      }),
    };
  }

  const destroy = () => {
    abort.abort();
    input.destroy();
    modal.destroy();
    debug.destroy();
    camera.destroy();
    world.destroy();
    runtime.destroy();
    delete window.__BWEB_DEBUG__;
  };
  if (import.meta.hot) import.meta.hot.dispose(destroy);
  window.addEventListener('pagehide', (event) => { if (!event.persisted) destroy(); }, { once: true, signal: abort.signal });
}

start().catch((error) => {
  console.error('b-web 初始化失败', error);
  document.getElementById('loading').textContent = '场景未能启动，请确认浏览器支持 WebGL，然后刷新页面。';
});
