/**
 * CopyButton —— 共享的"复制到剪贴板"按钮。
 * M3 所有工具复用。纯 Web Component,无框架依赖,Astro 里当 island 用。
 */
export class CopyButton extends HTMLElement {
  connectedCallback() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tool-copy';
    btn.textContent = '复制';
    btn.addEventListener('click', () => this.copy());
    this.appendChild(btn);
    this.button = btn;
  }

  private button!: HTMLButtonElement;

  /** 设置要复制的内容。无内容时按钮禁用。 */
  setValue(value: string) {
    this.value = value;
    if (this.button) {
      this.button.disabled = !value;
      this.button.textContent = '复制';
    }
  }

  private value = '';

  private async copy() {
    if (!this.value) return;
    try {
      await navigator.clipboard.writeText(this.value);
      this.button.textContent = '已复制 ✓';
      window.setTimeout(() => {
        this.button.textContent = '复制';
      }, 1500);
    } catch {
      this.button.textContent = '复制失败';
      window.setTimeout(() => {
        this.button.textContent = '复制';
      }, 1500);
    }
  }
}

customElements.define('copy-button', CopyButton);
