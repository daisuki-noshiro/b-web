export class Modal {
  constructor(onChange) {
    this.dialog = document.getElementById('memory-dialog');
    this.onChange = onChange;
    this.returnFocus = null;
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    for (const id of ['memory-close', 'memory-return']) document.getElementById(id).addEventListener('click', () => this.close(), options);
    this.dialog.addEventListener('close', () => {
      this.onChange(false);
      // Canvas 点击没有可恢复的焦点时，返回可访问的 HTML 提示。
      const previous = this.returnFocus;
      const target = previous instanceof HTMLElement && previous !== document.body && previous.isConnected && previous.getClientRects().length ? previous : document.getElementById('interaction-hint');
      target?.focus({ preventScroll: true });
    }, options);
    this.dialog.addEventListener('click', (event) => {
      if (event.target !== this.dialog) return;
      const rect = this.dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) this.close();
    }, options);
  }

  get isOpen() { return this.dialog.open; }

  open(memory) {
    if (!memory || this.isOpen) return;
    this.returnFocus = document.activeElement;
    document.getElementById('memory-title').textContent = memory.title;
    const date = document.getElementById('memory-date');
    date.textContent = memory.displayDate;
    date.dateTime = memory.date;
    document.getElementById('memory-description').textContent = memory.description;
    const img = document.getElementById('memory-image');
    img.src = memory.image;
    img.alt = memory.alt;
    this.onChange(true);
    // 原生模态 dialog 将背景置为 inert，阻止点击穿透并提供焦点约束、Escape 关闭。
    this.dialog.showModal();
  }

  close() { this.dialog.close(); }
  destroy() { if (this.isOpen) this.close(); this.abort.abort(); }
}
