import { SCENE } from '../config.js';

// 内容独立于场景；明信片由有明确授权的真实像素素材组合，不是私人照片。
export const memories = {
  evening: {
    title: SCENE === 'technical' ? '一起等过的晚霞' : '把晴天，寄给你',
    date: '2026-10-15',
    displayDate: '2026 / 10 / 15',
    description: '想把湖边的阳光、慢慢飘过的云，还有风里摇晃的小花，都装进这封信。愿你的新一岁，依然有勇气去喜欢、去期待，也总有人陪你收藏那些小小的幸福。',
    image: SCENE === 'technical' ? '/images/memory-placeholder.svg' : '/art/memory-landscape.png',
    alt: '用授权像素素材组合的明信片：晴光、山林、湖畔小屋和信箱',
  },
};
