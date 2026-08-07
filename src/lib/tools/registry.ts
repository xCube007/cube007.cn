/**
 * 开发小工具注册表 —— 全站唯一定义点。
 *
 * 工具页(/tools)和首页的工具区都从这里渲染,所以新增一个工具只改这个文件。
 * registry.test.ts 会扫 src/pages/tools/ 的目录,漏登记会直接测试失败。
 */

export interface Tool {
  /** 目录名,同时是 /tools/<slug>/ 的路径 */
  slug: string;
  /** 完整名称,用于工具页卡片 */
  name: string;
  /** 短名,用于首页胶囊和摘要句 */
  short: string;
  /** 一句话说明 */
  desc: string;
}

export const tools: Tool[] = [
  {
    slug: 'json-formatter',
    name: 'JSON 格式化',
    short: 'JSON',
    desc: '格式化 / 压缩 / 校验 JSON',
  },
  {
    slug: 'base64',
    name: 'Base64 编解码',
    short: 'Base64',
    desc: 'UTF-8 安全的 Base64 互转',
  },
  {
    slug: 'url-codec',
    name: 'URL 编解码',
    short: 'URL',
    desc: '处理中文、空格与特殊符号',
  },
  {
    slug: 'regex',
    name: '正则测试',
    short: '正则',
    desc: 'pattern + flags,查看匹配与捕获组',
  },
  {
    slug: 'text-diff',
    name: '文本对比',
    short: '文本对比',
    desc: '并排对比,行级 + 字符级 Diff',
  },
  {
    slug: 'timestamp',
    name: '时间戳转换',
    short: '时间戳',
    desc: 'Unix 时间戳 ↔ 日期',
  },
  {
    slug: 'uuid',
    name: 'UUID / 密码生成',
    short: 'UUID',
    desc: '生成 UUID v4 与随机密码',
  },
];

/** 首页那句「JSON、Base64、…」的描述,由注册表拼出来,不手写 */
export function toolsSummary(): string {
  return tools.map((t) => t.short).join('、');
}
