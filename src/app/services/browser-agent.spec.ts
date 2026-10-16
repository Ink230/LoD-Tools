import { BrowserTool, registerBrowserTools, toolInput, toolString } from './browser-agent';

describe('experimental browser tool adapter', () => {
  const tool: BrowserTool = { name: 'read', description: 'Read data', inputSchema: { type: 'object' }, annotations: { readOnlyHint: true }, execute: async () => '{}' };

  it('does nothing when the browser has no native API', () => {
    expect(() => registerBrowserTools({} as Document, [tool])()).not.toThrow();
  });

  it('registers with an abortable lifecycle and removes tools on disposal', () => {
    let signal: AbortSignal | undefined;
    const registerTool = vi.fn((_tool: BrowserTool, options: { signal: AbortSignal }) => {
      signal = options.signal;
      return Promise.resolve();
    });
    const dispose = registerBrowserTools({ modelContext: { registerTool } } as unknown as Document, [tool]);
    expect(registerTool).toHaveBeenCalledOnce();
    expect(signal?.aborted).toBe(false);
    dispose();
    expect(signal?.aborted).toBe(true);
  });

  it('isolates synchronous policy errors and asynchronous registration rejection', async () => {
    const registerTool = vi.fn().mockImplementationOnce(() => { throw new Error('Blocked'); }).mockRejectedValueOnce(new Error('Unsupported'));
    const dispose = registerBrowserTools({ modelContext: { registerTool } } as unknown as Document, [tool, { ...tool, name: 'second' }]);
    await Promise.resolve();
    expect(registerTool).toHaveBeenCalledTimes(2);
    expect(() => dispose()).not.toThrow();
  });

  it('rejects unexpected input properties and oversized text', () => {
    expect(() => toolInput({ query: 'mods', script: 'bad' }, ['query'])).toThrow('Unknown input');
    expect(() => toolInput([], [])).toThrow();
    expect(() => toolString('x'.repeat(201))).toThrow();
    expect(() => toolString(12)).toThrow();
    expect(toolString(undefined, 'saved')).toBe('saved');
  });
});
