export const WORLD = {
  width: 6400,
  pixelHeight: 360,
  speeds: { sky: 0.08, mountains: 0.22, forest: 0.55, foreground: 1 },
  regions: [
    { start: 0, name: '晚霞起点', number: '01' },
    { start: 720, name: '回忆邮局', number: '02' },
    { start: 2200, name: '风吹草地', number: '03' },
  ],
};

export const WORLD_EVENTS = [
  { id: 'first-memory', type: 'memory', contentId: 'evening', x: 980, radius: 250, label: '打开这封回忆' },
];

export const regionAt = (x) => WORLD.regions.findLast((region) => x >= region.start) || WORLD.regions[0];
