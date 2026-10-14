import test from 'node:test';
import assert from 'node:assert/strict';
import { gsap } from 'gsap';
import { Camera } from '../src/core/camera.js';
import { viewportFor } from '../src/core/layout.js';
import { layerOffset, Parallax } from '../src/world/parallax.js';
import { Interaction } from '../src/interaction/interaction.js';

test('整数像素倍率完整覆盖常见视口，额外裁切不足一个逻辑像素', () => {
  for (const [width, height] of [[1280, 800], [390, 844], [1920, 1080], [667, 375], [3840, 2160]]) {
    const view = viewportFor(width, height);
    assert.ok(Number.isInteger(view.scale));
    assert.ok(view.width * view.scale >= width);
    assert.ok(view.width * view.scale - width < view.scale);
    assert.ok(view.height * view.scale >= height);
  }
});

test('连续输入共用 Tween，目标有边界，resize 后立即回到有效范围', () => {
  const camera = new Camera(6400, 640);
  const tween = camera.toX.tween;
  for (let i = 0; i < 100; i++) camera.moveBy(120);
  assert.equal(camera.target, 5760);
  assert.equal(camera.toX.tween, tween);
  assert.equal(gsap.getTweensOf(camera).length, 1);
  camera.x = 5600;
  camera.resize(1200);
  assert.ok(camera.x <= 5200);
  assert.equal(camera.target, 5200);
  camera.moveBy(-99999);
  assert.equal(camera.target, 0);
  camera.stop();
  assert.equal(camera.target, camera.x);
  camera.destroy();
});

test('减少动态效果时仍可探索；超宽视口不会产生负边界', () => {
  const camera = new Camera(6400, 640, true);
  camera.moveBy(425.4);
  assert.equal(camera.x, 425.4);
  assert.equal(camera.renderX, 425);
  camera.moveTo(NaN);
  assert.equal(camera.x, 425.4);
  camera.resize(8000);
  assert.equal(camera.x, 0);
  assert.equal(camera.maxX, 0);
  camera.destroy();
});

test('视差投影、块可见性与前景坐标约束', () => {
  assert.equal(layerOffset(501, 0.22), -110);
  const layers = { mountains: { x: 0, children: [{ x: 0, coverageWidth: 512 }, { x: 3000, coverageWidth: 512 }] }, foreground: { x: 0, children: [] } };
  const system = new Parallax(layers, { mountains: 0.22, foreground: 1 });
  system.update(1000, 640);
  assert.equal(layers.foreground.x, -1000);
  assert.equal(layers.mountains.children[0].visible, true);
  assert.equal(layers.mountains.children[1].visible, false);
  assert.throws(() => new Parallax(layers, { mountains: 0.22, foreground: 0.9 }));
});

test('事件必须在可探索范围内；阻止重复穿透；发送内容 ID 而非具体文案', () => {
  const received = [];
  const event = { id: 'letter', x: 980, radius: 250, type: 'memory', contentId: 'evening' };
  const interaction = new Interaction([event], (payload) => received.push(payload));
  interaction.update({ renderX: 0, centerX: 320, viewportWidth: 640 });
  assert.equal(interaction.trigger('letter'), false);
  interaction.update({ renderX: 660, centerX: 980, viewportWidth: 640 });
  assert.equal(interaction.trigger('letter'), true);
  assert.deepEqual(received[0], { type: 'memory', contentId: 'evening', eventId: 'letter' });
  interaction.blocked = true;
  assert.equal(interaction.trigger('letter'), false);
  assert.equal(received.length, 1);
});

gsap.ticker.sleep();
