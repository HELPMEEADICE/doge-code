import { buildTool } from '../../Tool.js';

export const REPLTool = buildTool({
  name: 'repl',
  description: 'REPL tool (stub)',
  prompt: 'REPL tool stub',
  inputSchema: { type: 'object' as const, properties: {} },
  impl: async () => ({ output: '' }),
});
