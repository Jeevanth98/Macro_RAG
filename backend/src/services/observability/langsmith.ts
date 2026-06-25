import 'dotenv/config';
import { Client } from 'langsmith';
import { randomUUID } from 'crypto';

export class LangSmithService {
  private isEnabled: boolean = false;
  private projectName: string = 'default';
  private client: Client | null = null;

  constructor() {
    try {
      this.isEnabled = process.env.LANGSMITH_ENABLED === 'true' && !!process.env.LANGCHAIN_API_KEY;
      this.projectName = process.env.LANGCHAIN_PROJECT || 'Macro_RAG';
      
      if (this.isEnabled) {
        this.client = new Client({
          apiKey: process.env.LANGCHAIN_API_KEY
        });
        console.log(`[Observability] LangSmith Tracing is ENABLED for project: ${this.projectName}`);
      } else {
        console.log('[Observability] LangSmith Tracing is DISABLED or credentials missing. Bypassing trace.');
      }
    } catch (e) {
      console.warn('[Observability] Failed to initialize LangSmith wrapper:', e);
    }
  }

  /**
   * Start a tracing run. Returns a unique run ID.
   */
  public traceStart(runName: string, inputs: any, parentRunId?: string): string {
    const runId = randomUUID();
    try {
      if (!this.isEnabled || !this.client) return runId;

      console.log(`[Observability][Start] Run Name: ${runName} | Run ID: ${runId}`);
      
      const runPayload: any = {
        id: runId,
        name: runName,
        run_type: 'chain',
        inputs,
        project_name: this.projectName,
        start_time: Date.now()
      };

      if (parentRunId) {
        runPayload.parent_run_id = parentRunId;
      }
      
      // Async fire-and-forget execution to avoid blocking application main thread
      this.client.createRun(runPayload).catch(err => {
        console.warn(`[Observability] Failed to create run in LangSmith for ${runName}:`, err);
      });
    } catch (e) {
      console.warn(`[Observability] Error in traceStart for run ${runName}:`, e);
    }
    return runId;
  }

  /**
   * Complete a tracing run successfully.
   */
  public traceSuccess(runId: string, outputs: any): void {
    try {
      if (!this.isEnabled || !this.client) return;

      console.log(`[Observability][Success] Run ID: ${runId}`);

      // Async fire-and-forget execution
      this.client.updateRun(runId, {
        outputs,
        end_time: Date.now()
      }).catch(err => {
        console.warn(`[Observability] Failed to update run success in LangSmith for ${runId}:`, err);
      });
    } catch (e) {
      console.warn(`[Observability] Error in traceSuccess for run ${runId}:`, e);
    }
  }

  /**
   * Complete a tracing run with error details.
   */
  public traceError(runId: string, error: any): void {
    try {
      if (!this.isEnabled || !this.client) return;

      console.log(`[Observability][Error] Run ID: ${runId}`);

      // Async fire-and-forget execution
      this.client.updateRun(runId, {
        error: error?.message || String(error),
        end_time: Date.now()
      }).catch(err => {
        console.warn(`[Observability] Failed to update run error in LangSmith for ${runId}:`, err);
      });
    } catch (e) {
      console.warn(`[Observability] Error in traceError for run ${runId}:`, e);
    }
  }
}

export const langsmithService = new LangSmithService();
