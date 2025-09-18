import { recordLeadTool, addOrUpdateLeadFieldTool, finalizeLeadDraftTool, getMissingFieldsTool, getDraftSummaryTool, confirmFieldValueTool } from '@/lib/hume';

export interface HumeToolSpec { name: string; description: string; parameters: any }
export interface HumeToolPayload { type: 'function'; name: string; description: string; parameters: string }

export function getToolSpecs(incrementalEnabled: boolean): HumeToolSpec[] {
  const list: HumeToolSpec[] = [recordLeadTool];
  if (incrementalEnabled) {
    list.push(
      addOrUpdateLeadFieldTool,
      finalizeLeadDraftTool,
      getMissingFieldsTool,
      getDraftSummaryTool,
      confirmFieldValueTool
    );
  }
  return list;
}

export function buildHumeToolsPayload(incrementalEnabled: boolean): HumeToolPayload[] {
  return getToolSpecs(incrementalEnabled).map(t => ({
    type: 'function',
    name: t.name,
    description: t.description,
    parameters: JSON.stringify(t.parameters)
  }));
}

export interface ToolSuccessPayload { ok: true; tool: string; ts: number; meta?: Record<string, any> }
export function toolSuccess(tool: string, meta?: Record<string, any>): string {
  const payload: ToolSuccessPayload = { ok: true, tool, ts: Date.now(), meta };
  return JSON.stringify(payload);
}

export interface ToolErrorPayload { ok: false; tool: string; ts: number; error: string; code?: string }
export function toolError(tool: string, error: string, code?: string): string {
  return JSON.stringify({ ok: false, tool, ts: Date.now(), error, code });
}
