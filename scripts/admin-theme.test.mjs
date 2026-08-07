import { describe, it, expect } from 'vitest';
import { toPreviewCss } from './admin-theme.mjs';

describe('toPreviewCss', () => {
  it('把容器自身的规则挂到 body 上', () => {
    const out = toPreviewCss('.note__body { font-size: 1.05rem; line-height: 1.8; }');
    expect(out).toContain('body {');
    expect(out).toContain('font-size: 1.05rem');
    expect(out).not.toContain('.note__body');
  });

  it('剥掉后代选择器上的容器前缀', () => {
    expect(toPreviewCss('.note__body p { color: red; }')).toBe('p { color: red; }');
  });

  it('逐个处理逗号分隔的选择器列表', () => {
    const out = toPreviewCss('.note__body ul,\n.note__body ol { margin: 0; }');
    expect(out).toBe('ul,\nol { margin: 0; }');
  });

  it('保留伪类和多级后代', () => {
    const out = toPreviewCss('.note__body .code-block:hover .copy { opacity: 1; }');
    expect(out).toBe('.code-block:hover .copy { opacity: 1; }');
  });

  it('不碰与容器无关的选择器', () => {
    const css = ':root { --x: 1px; }';
    expect(toPreviewCss(css)).toBe(css);
  });

  it('保留 @media 包装,并处理其中的规则', () => {
    const out = toPreviewCss('@media (max-width: 600px) {\n.note__body p { margin: 0; }\n}');
    expect(out).toContain('@media (max-width: 600px)');
    expect(out).toContain('p { margin: 0; }');
    expect(out).not.toContain('.note__body');
  });

  it('不误伤声明值里出现的容器名', () => {
    const css = '.note__body p { content: ".note__body"; }';
    expect(toPreviewCss(css)).toBe('p { content: ".note__body"; }');
  });

  it('前面有注释时照样识别得出选择器', () => {
    const out = toPreviewCss('/* 说明 */\n.note__body { font-size: 1rem; }');
    expect(out).toContain('/* 说明 */');
    expect(out).toContain('body {');
    expect(out).not.toContain('.note__body');
  });

  it('注释里出现容器名不影响改写', () => {
    const out = toPreviewCss('/* 见 .note__body 的定义 */\n.note__body p { margin: 0; }');
    expect(out).toContain('/* 见 .note__body 的定义 */');
    expect(out).toContain('\np { margin: 0; }');
  });

  it('处理子代和兄弟组合器', () => {
    expect(toPreviewCss('.note__body>p { margin: 0; }')).toBe('p { margin: 0; }');
    expect(toPreviewCss('.note__body > p { margin: 0; }')).toBe('p { margin: 0; }');
    expect(toPreviewCss('.note__body p + p { margin: 0; }')).toBe('p + p { margin: 0; }');
  });

  it('遇到改写不了的选择器就报错,而不是静默丢掉样式', () => {
    expect(() => toPreviewCss('article .note__body p { margin: 0; }')).toThrow(/note__body/);
    expect(() => toPreviewCss('.note__body.compact { margin: 0; }')).toThrow(/note__body/);
  });

  it('注释里提到容器名不算改写失败', () => {
    expect(() => toPreviewCss('/* .note__body 的说明 */\n.note__body p { margin: 0; }')).not.toThrow();
  });

  it('声明值里的花括号不影响改写', () => {
    expect(toPreviewCss('.note__body p { content: "{"; }')).toBe('p { content: "{"; }');
  });

  it('容器名可配置', () => {
    expect(toPreviewCss('.prose h2 { margin: 0; }', { container: '.prose' })).toBe(
      'h2 { margin: 0; }'
    );
  });
});
