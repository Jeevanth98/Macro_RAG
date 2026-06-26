import { spawn } from 'child_process';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { langsmithService } from './observability/langsmith';

const prisma = new PrismaClient();

export interface RetrievedChunk {
  id: string;
  text: string;
  metadata: {
    source: string;
    filename: string;
    category: string;
    page: number;
    chunk_index: number;
  };
  rrf_score?: number;
  vector_score?: number | null;
  bm25_score?: number | null;
}

export interface RetrievalResult {
  vector_success: boolean;
  bm25_success: boolean;
  results: RetrievedChunk[];
  vector_results?: any[];
  bm25_results?: any[];
  error?: string;
}

export class RetrievalService {
  /**
   * Run the python hybrid retrieval script.
   */
  public static async retrieveHybrid(query: string, parentRunId?: string): Promise<RetrievalResult> {
    const runId = langsmithService.traceStart('Hybrid Retrieval Script Run', { query }, parentRunId as any);
    
    return new Promise((resolve) => {
      const scriptPath = path.resolve(__dirname, '../scripts/retrieve.py');
      const pythonProcess = spawn('python', [scriptPath, query]);
      
      pythonProcess.on('error', (err) => {
        console.error(`[RetrievalService] Failed to spawn python process:`, err);
        langsmithService.traceError(runId, err);
        resolve({
          vector_success: false,
          bm25_success: false,
          results: [],
          error: `Failed to spawn python process: ${err.message}`
        });
      });
      let stdoutData = '';
      let stderrData = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (stderrData) {
          console.warn(`[RetrievalService] Script stderr: ${stderrData}`);
        }
        
        if (code !== 0) {
          console.error(`[RetrievalService] Python process exited with code ${code}`);
          langsmithService.traceError(runId, new Error(`Python exited with code ${code}: ${stderrData}`));
          resolve({
            vector_success: false,
            bm25_success: false,
            results: [],
            error: stderrData || `Exited with code ${code}`
          });
          return;
        }
        
        try {
          const parsed = JSON.parse(stdoutData.trim());
          langsmithService.traceSuccess(runId, parsed);
          resolve(parsed);
        } catch (e: any) {
          console.error('[RetrievalService] Failed to parse script output:', e, 'Raw output was:', stdoutData);
          langsmithService.traceError(runId, e);
          resolve({
            vector_success: false,
            bm25_success: false,
            results: [],
            error: `JSON parse error: ${e.message}`
          });
        }
      });
    });
  }

  /**
   * Fetch current KPIs and Watchlist indicators from SQLite.
   */
  public static async getLiveDataSummary(): Promise<string> {
    try {
      const kpis = await prisma.kpi.findMany();
      const watchlist = await prisma.watchlist.findMany();
      
      let summary = 'Current Macroeconomic Data & KPIs (from FRED/SQLite Database):\n';
      
      if (kpis.length > 0) {
        summary += 'KPI Indicators:\n';
        for (const kpi of kpis) {
          summary += `- ${kpi.title}: ${kpi.value} (Period: ${kpi.period}, Previous/Detail: ${kpi.subtitle}, Source: ${kpi.source})\n`;
        }
      } else {
        summary += '- No KPI indicators currently stored in database.\n';
      }
      
      if (watchlist.length > 0) {
        summary += 'Watchlist Indicators:\n';
        for (const item of watchlist) {
          summary += `- [${item.country}] ${item.indicator}: Latest: ${item.latest}, Change: ${item.change} (Trend: ${item.changeType})\n`;
        }
      }
      
      return summary;
    } catch (e) {
      console.error('[RetrievalService] Failed to fetch live data from SQLite:', e);
      return 'Current macroeconomic data: Unavailable (database error).';
    }
  }

  /**
   * Question Router using Gemini to classify routing needs AFTER retrieval has run.
   */
  public static async routeQuestion(query: string, hasStrongRAG: boolean, parentRunId?: string): Promise<'USE_RAG' | 'USE_LIVE_API' | 'USE_GENERAL_KNOWLEDGE'> {
    const runId = langsmithService.traceStart('Question Router', { query, hasStrongRAG }, parentRunId as any);
    
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `You are an expert macroeconomic question router. Your job is to classify the user's question into one of three routing targets:
1. 'USE_LIVE_API': If the question asks for current, latest, today's, or real-time numbers, rates, or figures (e.g. GDP rate, US inflation, unemployment rate, federal funds rate, USD/INR rate, latest consumer sentiment).
2. 'USE_RAG': If the question asks for explanations of economic concepts, policies, definitions, historical papers, reports, or country-specific macroeconomic details that can be found in reference documents.
3. 'USE_GENERAL_KNOWLEDGE': If the question asks for general macroeconomic theory, definitions, or explanations that do not require specific reference documents or real-time data.

Analyze this query: "${query}"

Return ONLY one of the three strings: 'USE_LIVE_API', 'USE_RAG', or 'USE_GENERAL_KNOWLEDGE'. Do not include any other characters, punctuation, markdown formatting, or explanations.`;
      
      const response = await model.generateContent(prompt);
      const decision = response.response.text().trim().replace(/['"`]/g, '') as 'USE_LIVE_API' | 'USE_RAG' | 'USE_GENERAL_KNOWLEDGE';
      
      if (['USE_LIVE_API', 'USE_RAG', 'USE_GENERAL_KNOWLEDGE'].includes(decision)) {
        let finalDecision = decision;
        if (decision === 'USE_RAG' && !hasStrongRAG) {
          console.log(`[RetrievalService] RAG was selected but retrieval results are weak/empty. Falling back to USE_GENERAL_KNOWLEDGE.`);
          finalDecision = 'USE_GENERAL_KNOWLEDGE';
        }
        langsmithService.traceSuccess(runId, { decision: finalDecision, originalDecision: decision });
        return finalDecision;
      }
      
      console.warn(`[RetrievalService] Unexpected router response: ${decision}, defaulting to USE_GENERAL_KNOWLEDGE`);
      langsmithService.traceSuccess(runId, { decision: 'USE_GENERAL_KNOWLEDGE', fallback: true });
      return 'USE_GENERAL_KNOWLEDGE';
    } catch (e) {
      console.error('[RetrievalService] Question routing failed, defaulting to USE_GENERAL_KNOWLEDGE:', e);
      langsmithService.traceError(runId, e);
      return 'USE_GENERAL_KNOWLEDGE';
    }
  }
}
