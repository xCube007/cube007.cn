/**
 * 后台主题的纯函数部分 —— 把站点样式改写成 Sveltia CMS 预览面板能用的形式。
 *
 * 站点上正文包在 `.note__body` 容器里,预览 iframe 里没有这层容器,
 * 整个 document 就是正文。所以复制过去之前要把容器前缀剥掉。
 *
 * 只做选择器改写,不碰声明块 —— 保证预览和真实文章用的是同一套值。
 */

const DEFAULT_CONTAINER = '.note__body';

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 改写单个选择器:容器自身挂到 body,后代选择器剥掉前缀,其余原样。 */
function rescopeSelector(selector, container) {
  const [, lead, core, trail] = selector.match(/^(\s*)([\s\S]*?)(\s*)$/);

  if (core === container) return `${lead}body${trail}`;

  // 容器后面跟空白或组合器 —— 后代/子代/兄弟,剥掉前缀即可
  const prefix = core.match(new RegExp(`^${escapeRegExp(container)}(?:\\s*[>+~]\\s*|\\s+)`));
  if (prefix) return lead + core.slice(prefix[0].length).trim() + trail;

  return selector;
}

/**
 * 改写逗号分隔的选择器列表。
 *
 * 块前面那段文本可能还粘着注释,注释里也可能写到容器名,所以先按最后一个
 * `*​/` 切开,只改后半段。at-rule 前奏(@media 等)整段跳过。
 */
function rescopeSelectorList(list, container) {
  const commentEnd = list.lastIndexOf('*/');
  const comments = commentEnd === -1 ? '' : list.slice(0, commentEnd + 2);
  const selectors = commentEnd === -1 ? list : list.slice(commentEnd + 2);

  if (selectors.trim().startsWith('@')) return list;

  return (
    comments +
    selectors
      .split(',')
      .map((s) => rescopeSelector(s, container))
      .join(',')
  );
}

/**
 * 把正文样式表改写成预览面板用的版本。
 *
 * @param {string} css 源样式表
 * @param {{ container?: string }} [options] container 默认 `.note__body`
 * @returns {string}
 */
export function toPreviewCss(css, { container = DEFAULT_CONTAINER } = {}) {
  // `[^{}]*\{` 抓的是每个块前面那段文本,也就是选择器列表或 at-rule 前奏;
  // 声明块以 `}` 收尾,不会被误当成选择器。
  const rescoped = css.replace(
    /([^{}]*)\{/g,
    (_, list) => `${rescopeSelectorList(list, container)}{`
  );

  // 改写不了的选择器(比如 `article .note__body p`)在预览里根本匹配不到东西,
  // 样式会悄无声息地失效 —— 那就不是"所见即所得"了。宁可构建时炸掉。
  // 注释和字符串字面量里出现容器名是正常的,只看真正的选择器
  const selectorsOnly = rescoped
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(["'])(?:\\.|(?!\1)[^\\])*\1/g, '');

  if (selectorsOnly.includes(container)) {
    throw new Error(
      `预览样式改写失败:还有选择器带着 ${container},预览面板里匹配不到。` +
        `请把它改成 \`${container} <后代>\` 的形式,或扩展 scripts/admin-theme.mjs 的改写规则。`
    );
  }

  return rescoped;
}

/**
 * 拼出喂给 CMS.registerPreviewStyle 的完整预览样式表。
 *
 * @param {string} tokensCss 设计 token(`src/styles/tokens.css`)
 * @param {string} proseCss 正文排版(`src/styles/prose.css`)
 * @returns {string}
 */
export function buildPreviewCss(tokensCss, proseCss) {
  return [
    '/* 自动生成,勿手改 —— 见 scripts/sync-admin-theme.mjs */',
    tokensCss,
    // 预览 iframe 自带一层 padding 会顶掉边距,这里把 body 拉回站点的排版宽度
    `body {
  margin: 0;
  padding: var(--sp-6) var(--sp-4);
  max-width: var(--content-w);
  background: var(--bg-0);
  color: var(--text-0);
  font-family: var(--font-sans);
}`,
    toPreviewCss(proseCss),
  ].join('\n\n');
}
