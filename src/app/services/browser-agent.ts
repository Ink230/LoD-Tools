/** Isolated adapter for the experimental document.modelContext API. */
export interface BrowserTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint?: boolean };
  execute: (input: unknown, options?: { signal?: AbortSignal }) => Promise<string>;
}

interface ModelContext {
  registerTool(tool: BrowserTool, options: { signal: AbortSignal }): Promise<void> | void;
}

export function registerBrowserTools(document: Document, tools: BrowserTool[]): () => void {
  const context = (document as Document & { modelContext?: ModelContext }).modelContext;
  if (!context || typeof context.registerTool !== 'function') return () => undefined;
  const controller = new AbortController();
  for (const tool of tools) {
    try {
      // Experimental support can be disabled by browser policy. It must never
      // prevent the ordinary UI from loading or create unhandled rejections.
      void Promise.resolve(context.registerTool(tool, { signal: controller.signal })).catch((): void => undefined);
    } catch { /* Unsupported browser policy: keep the normal controls. */ }
  }
  return () => controller.abort();
}

export function toolInput(input: unknown, allowed: string[]): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected an input object');
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new Error('Unknown input property');
  return value;
}

export function toolString(value: unknown, fallback = ''): string {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || value.length > 200) throw new Error('Expected text of at most 200 characters');
  return value;
}

export function toolInteger(value: unknown, fallback: number, min: number, max: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) throw new Error(`Expected an integer from ${min} to ${max}`);
  return value;
}
