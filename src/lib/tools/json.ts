/**
 * JSON 工具的纯函数逻辑。与 UI 完全分离,可单测。
 *
 * 设计:所有函数返回结果对象,不抛异常 —— 让 UI 能统一处理成功/失败,
 * 而不是 try/catch 包一切。这个返回形状是 M3 所有工具要遵循的模式。
 */

/** 通用结果:成功带输出,失败带错误信息 */
export type ToolResult<T = string> =
  | { ok: true; output: T }
  | { ok: false; error: string };

/**
 * 校验 JSON。返回结构化结果,不抛。
 * 用于"校验"按钮,也被 format/minify 内部复用来定位错误位置。
 */
export function validateJson(input: string): ToolResult<unknown> {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { ok: false, error: '输入为空' };
  }
  try {
    const value = JSON.parse(trimmed);
    return { ok: true, output: value };
  } catch (e) {
    // JSON.parse 的错误信息已经够用,如 "Unexpected token } in JSON at position 12"
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * 格式化 JSON(美化缩进)。
 * @param indent 缩进空格数,默认 2
 */
export function formatJson(input: string, indent = 2): ToolResult {
  const parsed = validateJson(input);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }
  return { ok: true, output: JSON.stringify(parsed.output, null, indent) };
}

/** 压缩 JSON(去掉所有空白)。 */
export function minifyJson(input: string): ToolResult {
  const parsed = validateJson(input);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }
  return { ok: true, output: JSON.stringify(parsed.output) };
}
