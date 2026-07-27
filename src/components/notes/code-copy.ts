/**
 * 代码块复制按钮。挂到笔记正文的 pre 上。
 * 纯 Web Component 风格的初始化脚本,无框架依赖。
 */
export function enhanceCodeBlocks(root: ParentNode = document) {
  root.querySelectorAll('pre').forEach((pre) => {
    if (pre.parentElement?.classList.contains('code-block')) return;

    const wrap = document.createElement('div');
    wrap.className = 'code-block';
    pre.parentNode?.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-block__copy';
    btn.textContent = '复制';
    btn.addEventListener('click', async () => {
      const text = pre.textContent ?? '';
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = '已复制 ✓';
      } catch {
        btn.textContent = '失败';
      }
      window.setTimeout(() => {
        btn.textContent = '复制';
      }, 1500);
    });
    wrap.appendChild(btn);
  });
}
