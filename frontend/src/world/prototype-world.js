import { Container, Graphics, Rectangle } from 'pixi.js';
import { Parallax } from './parallax.js';
import { WORLD, WORLD_EVENTS } from '../config.js';

const C = {
  sky: [0xd7a4b2, 0xe3abba, 0xeab2b1, 0xf0bca9, 0xf4c6a9, 0xf7d1b0, 0xf9dab8],
  sun: 0xffe5b2, cloud: 0xfbe0cb,
  mountain: 0xac93aa, mountainLight: 0xbca0b0, mountainFront: 0x98879f,
  forestBack: 0x82908d, forest: 0x6d8580, forestDark: 0x5d7674,
  grass: 0x536b56, grassLight: 0x8d9d6a, grassDark: 0x3c574b,
  soil: 0x344a41, soilDeep: 0x2c3e38, path: 0xc6ad87, pathShadow: 0xaa9278,
};

function random(seed) {
  let value = seed >>> 0;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}

function rect(g, x, y, w, h, color, alpha = 1) {
  g.rect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)).fill({ color, alpha });
}

function pixelDisc(g, x, y, radius, color) {
  for (let dy = -radius; dy <= radius; dy += 3) {
    const half = Math.floor(Math.sqrt(Math.max(0, radius * radius - dy * dy)) / 3) * 3;
    if (half) rect(g, x - half, y + dy, half * 2, 3, color);
  }
}

function pine(g, x, base, height, color) {
  rect(g, x - 2, base - height + 9, 4, height - 9, color);
  for (let row = 0; row < 5; row++) {
    const y = base - height + row * height * 0.15;
    const width = 8 + row * height * 0.18;
    rect(g, x - width / 2, y, width, height * 0.23, color);
  }
}

export class World {
  constructor(stage, onEvent) {
    this.stage = stage;
    this.onEvent = onEvent;
    this.background = new Graphics();
    stage.addChild(this.background);
    this.layers = Object.fromEntries(['sky', 'mountains', 'forest', 'foreground'].map((name) => [name, new Container({ label: name })]));
    for (const layer of Object.values(this.layers)) stage.addChild(layer);
    this.parallax = new Parallax(this.layers, WORLD.speeds);
    this.time = 0;
    this.reducedMotion = false;
  }

  resize(viewport) {
    this.viewport = viewport;
    this.groundY = Math.floor(viewport.height * 0.77);
    this.extent = Math.max(WORLD.width, viewport.width) + 512;
    for (const layer of Object.values(this.layers)) {
      for (const child of layer.removeChildren()) child.destroy({ children: true, context: true });
    }
    this.clouds = [];
    this.grasses = [];
    this.background.clear();
    const bandHeight = Math.ceil(this.groundY / C.sky.length);
    C.sky.forEach((color, i) => rect(this.background, 0, i * bandHeight, viewport.width, bandHeight + 1, color));
    rect(this.background, 0, this.groundY, viewport.width, viewport.height - this.groundY, C.soilDeep);
    this.buildSky();
    this.buildMountains();
    this.buildForest();
    this.buildGround();
    this.buildMailbox();
  }

  buildSky() {
    const sun = new Graphics();
    pixelDisc(sun, 0, 0, 37, C.sun);
    sun.position.set(Math.floor(this.viewport.width * 0.7), Math.floor(this.groundY * 0.45));
    this.layers.sky.addChild(sun);
    const rng = random(36);
    for (let x = -220; x < this.extent; x += 210) {
      const cloud = new Graphics();
      const size = 0.65 + rng() * 0.8;
      rect(cloud, 0, 10, 94 * size, 8, C.cloud, 0.45);
      rect(cloud, 18, 4, 56 * size, 6, C.cloud, 0.45);
      rect(cloud, 34, 0, 26 * size, 4, C.cloud, 0.45);
      cloud.position.set(x, Math.floor(35 + rng() * this.groundY * 0.26));
      this.layers.sky.addChild(cloud);
      this.clouds.push({ node: cloud, origin: x, speed: 2 + rng() * 2 });
    }
  }

  buildMountains() {
    const rng = random(1024);
    for (let x = 0; x < this.extent; x += 512) {
      const chunk = new Graphics();
      chunk.x = x;
      chunk.coverageWidth = 512;
      for (let local = 0; local < 512; local += 8) {
        const wx = local + x;
        const wave = Math.sin(wx / 110) * 0.5 + Math.sin(wx / 247 + 1.4) * 0.35;
        const top = this.groundY - 52 - Math.round((wave + 1) * this.groundY * 0.18 / 4) * 4;
        rect(chunk, local, top, 8, this.groundY - top, C.mountainLight);
        if (rng() > 0.78) rect(chunk, local, top + 12, 8, 4, C.mountain, 0.4);
        const front = this.groundY - 25 - Math.round((Math.sin(wx / 176 + 2) + 1) * this.groundY * 0.12 / 4) * 4;
        rect(chunk, local, front, 8, this.groundY - front, C.mountain);
        if (Math.sin(wx / 65) > 0.5) rect(chunk, local, front + 19, 8, this.groundY - front - 19, C.mountainFront, 0.4);
      }
      this.layers.mountains.addChild(chunk);
    }
  }

  buildForest() {
    for (let x = 0; x < this.extent; x += 512) {
      const rng = random(x + 71);
      const chunk = new Graphics();
      chunk.x = x;
      chunk.coverageWidth = 550;
      rect(chunk, 0, this.groundY - 16, 512, 28, C.forestDark);
      for (let local = 0; local < 512; local += 16) pine(chunk, local, this.groundY, 42 + rng() * 32, C.forestBack);
      for (let local = 4; local < 512; local += 26) pine(chunk, local, this.groundY + 7, 38 + rng() * 40, rng() > 0.5 ? C.forest : C.forestDark);
      this.layers.forest.addChild(chunk);
    }
  }

  buildGround() {
    const ground = this.groundY;
    for (let x = 0; x < this.extent; x += 512) {
      const rng = random(x + 19);
      const chunk = new Container();
      const art = new Graphics();
      chunk.addChild(art);
      chunk.x = x;
      chunk.coverageWidth = 590;
      const depth = this.viewport.height - ground;
      rect(art, 0, ground, 512, depth, C.soil);
      rect(art, 0, ground, 512, 4, C.grassLight);
      rect(art, 0, ground + 4, 512, 21, C.grass);
      rect(art, 0, ground + 25, 512, 13, C.pathShadow);
      rect(art, 0, ground + 26, 512, 8, C.path);
      rect(art, 0, ground + 38, 512, 5, C.grassDark);
      rect(art, 0, ground + 55, 512, Math.max(1, depth - 55), C.soilDeep);
      for (let local = 0; local < 512; local += 5) {
        const h = 1 + Math.floor(rng() * 5);
        rect(art, local, ground - h, 2, h, rng() > 0.55 ? C.grassLight : C.grass);
        if (rng() > 0.7) rect(art, local, ground + 10 + rng() * 9, 2, 1, C.grassLight);
        if (rng() > 0.6) rect(art, local, ground + 28, 4, 1, C.pathShadow);
        if (rng() > 0.65) rect(art, local, ground + 46 + rng() * Math.max(3, depth - 49), 3, 1, C.grassDark);
        if (rng() > 0.9) {
          rect(art, local, ground - 5, 1, 5, C.grassDark);
          rect(art, local - 1, ground - 6, 3, 2, rng() > 0.5 ? 0xefbd9d : 0xe9d3ad);
        }
      }
      // 每个世界块一簇会轻微摆动的草；动画只改变变换，不重建几何。
      const grass = new Graphics();
      for (let blade = 0; blade < 6; blade++) rect(grass, blade * 3, -8 - rng() * 5, 2, 10 + rng() * 3, C.grassLight);
      grass.position.set(120 + rng() * 280, ground);
      chunk.addChild(grass);
      this.grasses.push({ node: grass, phase: rng() * Math.PI * 2 });
      const treeX = 30 + rng() * 350;
      if (x + treeX > 240 && Math.abs(x + treeX - WORLD_EVENTS[0].x) > 135) {
        rect(art, treeX - 4, ground - 77, 8, 77, 0x544e49);
        rect(art, treeX + 1, ground - 70, 2, 66, 0x706157);
        rect(art, treeX - 20, ground - 75, 24, 5, 0x544e49);
        rect(art, treeX + 4, ground - 64, 19, 4, 0x544e49);
        rect(art, treeX - 31, ground - 106, 61, 32, C.grassDark);
        rect(art, treeX - 20, ground - 121, 41, 17, C.grassDark);
        rect(art, treeX - 40, ground - 96, 78, 15, C.grassDark);
        rect(art, treeX - 25, ground - 113, 36, 13, C.grass);
        rect(art, treeX - 31, ground - 97, 22, 5, C.grass);
        rect(art, treeX + 16, ground - 85, 13, 3, C.grass);
      }
      this.layers.foreground.addChild(chunk);
    }
    // 低矮栅栏与长椅是普通占位装饰，没有新增交互事件。
    for (const x of [520, 1770, 3160, 4680, 5970]) {
      const decoration = new Graphics();
      decoration.x = x;
      for (let post = 0; post < 6; post++) rect(decoration, post * 18, this.groundY - 19, 3, 19, 0xa68f75);
      rect(decoration, 0, this.groundY - 16, 94, 3, 0xc5aa88);
      rect(decoration, 0, this.groundY - 7, 94, 3, 0xa68f75);
      this.layers.foreground.addChild(decoration);
    }
  }

  buildMailbox() {
    const mailbox = new Container({ label: 'first-memory' });
    mailbox.position.set(WORLD_EVENTS[0].x, this.groundY);
    const g = new Graphics();
    rect(g, -6, -35, 9, 35, 0x74604f);
    rect(g, -3, -35, 2, 33, 0xa68b68);
    rect(g, -24, -65, 44, 7, 0xd89785);
    rect(g, -28, -58, 52, 27, 0xb96f6c);
    rect(g, -24, -58, 42, 19, 0xcf8b7c);
    rect(g, -24, -58, 42, 3, 0xe5b095);
    rect(g, -16, -49, 27, 3, 0x7d5556);
    rect(g, -5, -39, 8, 2, 0xf6d3a4);
    rect(g, 22, -71, 3, 32, 0x6d5550);
    rect(g, 25, -71, 14, 9, 0xedbd89);
    rect(g, -10, -3, 18, 3, 0x34493f);
    // 小小的路灯与信箱共享世界坐标，但灯光独立循环。
    rect(g, 70, -96, 3, 96, 0x665956);
    rect(g, 50, -96, 23, 3, 0x665956);
    rect(g, 49, -91, 10, 14, 0x615658);
    rect(g, 47, -77, 14, 3, 0x615658);
    mailbox.addChild(g);
    this.lamp = new Graphics();
    rect(this.lamp, 51, -88, 6, 9, 0xffdfa4);
    rect(this.lamp, 46, -93, 16, 22, 0xffd79d, 0.11);
    mailbox.addChild(this.lamp);
    mailbox.eventMode = 'static';
    mailbox.cursor = 'pointer';
    mailbox.hitArea = new Rectangle(-34, -76, 78, 80);
    mailbox.on('pointertap', () => this.onEvent(WORLD_EVENTS[0].id));
    this.layers.foreground.addChild(mailbox);
    this.mailbox = mailbox;
  }

  update(dt, camera) {
    if (!this.reducedMotion) this.time += dt;
    this.parallax.update(camera.renderX, this.viewport.width);
    const span = this.extent + 400;
    for (const cloud of this.clouds) cloud.node.x = Math.round(((cloud.origin + 200 + this.time * cloud.speed) % span + span) % span - 200);
    for (const grass of this.grasses) grass.node.skew.x = this.reducedMotion ? 0 : Math.sin(this.time * 1.4 + grass.phase) * 0.07;
    this.lamp.alpha = this.reducedMotion ? 1 : 0.78 + Math.sin(this.time * 2.1) * 0.13 + Math.sin(this.time * 3.7) * 0.06;
  }

  // HTML 提示使用与 Canvas 前景相同的投影与缩放，Resize 后不会错位。
  eventScreenPosition(camera, event) {
    return { x: (event.x - camera.renderX) * this.viewport.scale, y: (this.groundY - 90) * this.viewport.scale };
  }

  destroy() {
    this.background.destroy({ context: true });
    for (const layer of Object.values(this.layers)) layer.destroy({ children: true, context: true });
  }
}
