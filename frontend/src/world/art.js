import { Assets } from 'pixi.js';

export const ART_NAMES = ['sky', 'clouds', 'mountains', 'forest', 'meadow', 'path', 'bank', 'tree', 'pine', 'house', 'plant', 'mushroom-red', 'rock', 'sun', 'water', 'mailbox', 'flowers', 'lantern'];

export async function loadArt() {
  const entries = await Promise.all(ART_NAMES.map(async (name) => {
    const texture = await Assets.load(`/art/${name}.png`);
    texture.source.scaleMode = 'nearest';
    return [name, texture];
  }));
  return Object.fromEntries(entries);
}
