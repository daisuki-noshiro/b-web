// 1 世界单位 = 1 个逻辑像素。整数 CSS 放大，避免非整数采样模糊。
export function viewportFor(width, height, targetHeight = 360) {
  const scale = Math.max(1, Math.min(4, Math.floor(height / targetHeight)));
  return { width: Math.ceil(width / scale), height: Math.ceil(height / scale), scale };
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
