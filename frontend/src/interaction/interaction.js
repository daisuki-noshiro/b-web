// 只关心坐标、事件类型和内容 ID，完全不知道卡片的标题、照片和描述。
export class Interaction {
  constructor(events, dispatch) {
    this.events = events;
    this.dispatch = dispatch;
    this.nearby = null;
    this.blocked = false;
  }

  update(camera) {
    this.nearby = this.events.find((event) => {
      const screenX = event.x - camera.renderX;
      return screenX >= 38 && screenX <= camera.viewportWidth - 38 && Math.abs(event.x - camera.centerX) <= Math.max(event.radius, camera.viewportWidth * 0.4);
    }) || null;
    return this.nearby;
  }

  trigger(id) {
    if (this.blocked || this.nearby?.id !== id) return false;
    const event = this.events.find((item) => item.id === id);
    if (!event) return false;
    this.dispatch({ type: event.type, contentId: event.contentId, eventId: event.id });
    return true;
  }
}
