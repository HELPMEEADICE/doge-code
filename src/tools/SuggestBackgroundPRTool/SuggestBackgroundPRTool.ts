import { buildTool } from '../../Tool.js';

export const SuggestBackgroundPRTool = buildTool({
  name: 'suggest_background_pr',
  description: 'Suggest background PR tool (stub)',
  prompt: 'Suggest background PR tool stub',
  inputSchema: { type: 'object' as const, properties: {} },
  impl: async () => ({ output: '' }),
});
