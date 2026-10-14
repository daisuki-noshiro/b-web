import { Container, Graphics, Rectangle, Sprite, TilingSprite } from 'pixi.js';
import { Parallax } from './parallax.js';
import { WORLD, WORLD_EVENTS } from '../config.js';

// 固定世界构图；Resize 调整地平线与露出的高度，不拉伸素材。
const TREES = [
  { x: 550, kind: 'tree', scale: 2 },
  { x: 1450, kind: 'pine', scale: 2 },
  { x: 1840, kind: 'tree', scale: 2 },
];

export class World {
  constructor(stage, onEvent, textures) {
    this.stage = stage;
    this.onEvent = onEvent;
    this.textures = textures;
    this.layers = Object.fromEntries(['sky', 'mountains', 'forest', 'garden', 'foreground'].map((name) => [name, new Container({ label: name })]));
    for (const layer of Object.values(this.layers)) stage.addChild(layer);
    this.parallax = new Parallax(this.layers, WORLD.speeds);
    this.time = 0;
    this.reducedMotion = false;
  }

  sprite(name, x, y, scale = 1, parent = this.layers.foreground) {
    const node = new Sprite(this.textures[name]);
    node.anchor.set(0.5, 1);
    node.position.set(Math.round(x), Math.round(y));
    node.scale.set(scale);
    node.roundPixels = true;
    parent.addChild(node);
    return node;
  }

  tile(name, width, height, x, y, parent, scale = 1) {
    const node = new TilingSprite({ texture: this.textures[name], width, height, roundPixels: true });
    node.position.set(x, y);
    node.tileScale.set(scale);
    parent.addChild(node);
    return node;
  }

  resize(viewport) {
    this.viewport = viewport;
    this.groundY = Math.floor(viewport.height * 0.69);
    this.shoreY = this.groundY + 40;
    this.extent = Math.max(WORLD.width, viewport.width) + 512;
    for (const layer of Object.values(this.layers)) {
      for (const child of layer.removeChildren()) child.destroy({ children: true, context: true });
    }
    this.clouds = [];
    this.grasses = [];
    this.reflected = [];
    this.pollen = [];
    this.buildSky();
    this.buildLandscape();
    this.buildGarden();
    this.buildShore();
    this.buildCottage();
    this.buildDetails();
    this.buildReflections();
  }

  buildSky() {
    this.tile('sky', this.extent, this.viewport.height, 0, 0, this.layers.sky);
    this.sun = this.sprite('sun', Math.min(470, this.viewport.width * 0.76), Math.max(140, this.groundY * 0.62), 2, this.layers.sky);
    for (const [i, x] of [-180, 230, 680, 1170, 1710, 2250].entries()) {
      const cloud = this.sprite('clouds', x, 165 + (i % 3) * 11, 1, this.layers.sky);
      cloud.alpha = 0.65;
      this.clouds.push({ node: cloud, origin: x, speed: 1.8 + i % 3 * 0.4 });
    }
  }

  buildLandscape() {
    this.tile('mountains', this.extent, 208, 0, this.groundY - 238, this.layers.mountains);
    this.tile('forest', this.extent, 64, 0, this.groundY - 86, this.layers.forest);
    this.tile('meadow', this.extent, 80, 0, this.groundY - 22, this.layers.forest);
    for (const [i, x] of [220, 610, 960, 1390, 1700, 2050].entries()) {
      const tree = this.sprite(i % 2 ? 'tree' : 'pine', x, this.groundY + 4, 1, this.layers.garden);
      tree.alpha = 0.78;
      tree.tint = 0xb5c3a2;
    }
  }

  buildGarden() {
    for (const tree of TREES) {
      const node = this.sprite(tree.kind, tree.x, this.groundY + 14, tree.scale);
      this.reflected.push(node);
    }
    const lantern = this.sprite('lantern', 1540, this.groundY - 112);
    this.lamp = lantern;
    this.lampBaseY = lantern.y;
    const string = new Graphics().moveTo(1450, this.groundY - 129).quadraticCurveTo(1500, this.groundY - 112, 1540, this.groundY - 137).stroke({ color: 0x9c8f6e, width: 1, alpha: 0.7 });
    this.layers.foreground.addChild(string);
  }

  buildShore() {
    const foreground = this.layers.foreground;
    const scenery = foreground.removeChildren();
    this.water = this.tile('water', this.extent, Math.max(1, this.viewport.height - this.shoreY), 0, this.shoreY, foreground);
    this.bank = this.tile('bank', this.extent, 48, 0, this.groundY - 8, foreground);
    this.bank.tint = 0xdadbbe;
    this.tile('path', this.extent, 20, 0, this.groundY + 9, foreground);
    foreground.addChild(...scenery);
  }

  buildCottage() {
    const event = WORLD_EVENTS[0];
    const house = this.sprite('house', event.x + 112, this.groundY + 13);
    this.reflected.push(house);
    this.house = house;
    const mailbox = this.sprite('mailbox', event.x, this.groundY + 15);
    mailbox.eventMode = 'static';
    mailbox.cursor = 'pointer';
    // Sprite 的 hitArea 使用纹理局部坐标，anchor 由 Pixi 自己处理。
    mailbox.hitArea = new Rectangle(-22, -64, 44, 64);
    mailbox.on('pointertap', () => this.onEvent(event.id));
    this.reflected.push(mailbox);
    this.mailbox = mailbox;
    this.porchLamp = this.sprite('lantern', event.x + 35, this.groundY - 56);
  }

  buildDetails() {
    for (const [i, x] of [36, 180, 395, 750, 870, 1220, 1310, 1610, 1740, 1970].entries()) {
      const flowers = this.sprite('flowers', x, this.groundY + 5);
      this.grasses.push({ node: flowers, phase: i * 1.73 });
      if (i % 3 === 0) this.sprite('plant', x + 55, this.groundY + 5);
      if (i % 3 === 1) this.sprite('rock', x + 26, this.groundY + 10);
      if (i % 3 === 2) this.sprite('mushroom-red', x + 38, this.groundY + 8);
    }
    for (let i = 0; i < 24; i++) {
      const node = new Graphics().rect(0, 0, i % 3 === 0 ? 2 : 1, 1).fill(i % 2 ? 0xffedc4 : 0xe6c887);
      const originX = (i * 83 + 47) % WORLD.width;
      const originY = this.groundY - 12 - (i * 37 % 120);
      this.layers.foreground.addChild(node);
      this.pollen.push({ node, originX, originY, phase: i * 0.7 });
    }
  }

  buildReflections() {
    const reflection = new Container({ label: 'water-reflections' });
    for (const original of this.reflected) {
      const mirrored = new Sprite(original.texture);
      mirrored.anchor.set(0.5, 1);
      mirrored.scale.set(original.scale.x, -original.scale.y);
      mirrored.position.set(original.x, this.shoreY + 1);
      mirrored.alpha = 0.2;
      mirrored.tint = 0xa8bea3;
      reflection.addChild(mirrored);
    }
    const mask = new Graphics().rect(0, this.shoreY + 1, this.extent, Math.max(1, this.viewport.height - this.shoreY)).fill(0xffffff);
    this.layers.foreground.addChild(mask);
    reflection.mask = mask;
    this.layers.foreground.addChild(reflection);
    this.reflection = reflection;
    this.ripples = this.tile('water', this.extent, Math.max(1, this.viewport.height - this.shoreY), 0, this.shoreY, this.layers.foreground);
    this.ripples.alpha = 0.16;
  }

  update(dt, camera) {
    if (!this.reducedMotion) this.time += dt;
    this.parallax.update(camera.renderX, this.viewport.width);
    for (const cloud of this.clouds) cloud.node.x = Math.round((cloud.origin + 240 + this.time * cloud.speed) % (this.extent + 480) - 240);
    for (const grass of this.grasses) grass.node.skew.x = this.reducedMotion ? 0 : Math.sin(this.time * 1.25 + grass.phase) * 0.04;
    this.lamp.alpha = this.porchLamp.alpha = this.reducedMotion ? 1 : 0.87 + Math.sin(this.time * 1.7) * 0.09;
    this.lamp.y = this.lampBaseY + (this.reducedMotion ? 0 : Math.round(Math.sin(this.time) * 1));
    this.ripples.tilePosition.x = this.reducedMotion ? 0 : Math.round(this.time * 2);
    for (const item of this.pollen) {
      item.node.position.set(Math.round(item.originX + Math.sin(this.time * 0.3 + item.phase) * 18), Math.round(item.originY + Math.sin(this.time * 0.5 + item.phase) * 8));
      item.node.alpha = 0.3 + (Math.sin(this.time + item.phase) + 1) * 0.22;
    }
    for (const layer of [this.layers.garden, this.layers.foreground]) {
      for (const child of layer.children) {
        if (child instanceof Sprite && !(child instanceof TilingSprite)) {
          const screenX = child.x + layer.x;
          child.visible = screenX + child.width / 2 >= -4 && screenX - child.width / 2 <= this.viewport.width + 4;
        }
      }
    }
  }

  eventScreenPosition(camera, event) {
    return { x: (event.x - camera.renderX) * this.viewport.scale, y: (this.groundY - 59) * this.viewport.scale };
  }

  diagnostics() {
    return { textures: Object.keys(this.textures).length, sourcePixels: Object.fromEntries(Object.entries(this.textures).map(([name, texture]) => [name, { width: texture.width, height: texture.height, scaleMode: texture.source.scaleMode }])), rippleX: this.ripples.tilePosition.x };
  }

  destroy() {
    for (const layer of Object.values(this.layers)) layer.destroy({ children: true, context: true });
  }
}
