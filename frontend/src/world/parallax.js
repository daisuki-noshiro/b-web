export function layerOffset(cameraX, speed) {
  return -Math.round(cameraX * speed);
}

export class Parallax {
  constructor(layers, speeds) {
    if (speeds.foreground !== 1) throw new Error('前景速度必须为 1，以保持交互物件的世界坐标');
    this.layers = layers;
    this.speeds = speeds;
    for (const name of Object.keys(layers)) {
      if (!Number.isFinite(speeds[name]) || speeds[name] < 0 || speeds[name] > 1) {
        throw new Error(`视差速度 ${name} 必须在 0～1 之间`);
      }
    }
  }

  update(cameraX, viewportWidth) {
    for (const [name, layer] of Object.entries(this.layers)) {
      const offset = layerOffset(cameraX, this.speeds[name]);
      layer.x = offset;
      // 静态景观按块绘制，只渲染有可能进入视口的块，避免整片世界逐帧绘制。
      for (const child of layer.children) {
        if (child.coverageWidth) child.visible = child.x + child.coverageWidth >= -offset && child.x <= -offset + viewportWidth;
      }
    }
  }
}
