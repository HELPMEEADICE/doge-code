import { buildTool } from '../../Tool.js';

export const VerifyPlanExecutionTool = buildTool({
  name: 'verify_plan_execution',
  description: 'Verify plan execution tool (stub)',
  prompt: 'Verify plan execution tool stub',
  inputSchema: { type: 'object' as const, properties: {} },
  impl: async () => ({ output: '' }),
});
