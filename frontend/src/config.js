export const SCENE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('scene') === 'technical' ? 'technical' : 'visual';

const technicalWorld = {
  width: 6400,
  pixelHeight: 360,
  speeds: { sky: 0.08, mountains: 0.22, forest: 0.55, foreground: 1 },
  regions: [
    { start: 0, name: '晚霞起点', number: '01' },
    { start: 720, name: '回忆邮局', number: '02' },
    { start: 2200, name: '风吹草地', number: '03' },
  ],
};

const visualWorld = {
  width: 2048,
  pixelHeight: 360,
  speeds: { sky: 0.06, mountains: 0.18, forest: 0.42, garden: 0.72, foreground: 1 },
  regions: [
    { start: 0, name: '晴光湖畔', number: '01', title: '今天，世界<br />为你温柔。', note: '把喜欢的风景，藏进一封信。<br />沿着湖边慢慢走，惊喜就在前面。' },
    { start: 740, name: '回忆小屋', number: '02', title: '有些日子，<br />想和你收藏。', note: '林间有一间小屋。<br />门前的信箱里，有一封只写给你的信。' },
    { start: 1460, name: '花开岸边', number: '03', title: '愿你的每一天，<br />都有花开。', note: '风会继续向前，花也会慢慢长大。<br />我们还有很多风景，可以一起看。' },
  ],
};

export const WORLD = SCENE === 'technical' ? technicalWorld : visualWorld;

export const WORLD_EVENTS = [
  { id: 'first-memory', type: 'memory', contentId: 'evening', x: 980, radius: 250, label: '打开这封回忆' },
];

export const regionAt = (x) => WORLD.regions.findLast((region) => x >= region.start) || WORLD.regions[0];
