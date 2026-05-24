export interface TemplateRenderContext {
  [key: string]: string | number | boolean | null | undefined;
}

export function renderTemplate(input: string, ctx: TemplateRenderContext): string {
  return input.replace(/\{([^}]+)\}/g, (_, rawKey) => {
    const key = String(rawKey).trim();
    const value = ctx[key];
    return value === undefined || value === null ? '' : String(value);
  });
}
