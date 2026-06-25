import 'dotenv/config';
import { langsmithService } from './observability/langsmith';

// Define the interface for data to be validated
export interface IncomingData {
  source: string;
  dataType: string; // e.g., 'KPI', 'ChartData'
  payload: any;
}

export interface ValidationLayerResult {
  score: number; // 0 to 100
  weight: number; // Weight in the final calculation
  reason: string;
}

export interface ValidationResult {
  finalScore: number;
  isAutoApproved: boolean;
  breakdown: Record<string, ValidationLayerResult>;
  metadata: {
    source: string;
    extractedAt: Date;
  };
}

export class DataValidator {
  
  // Weights for different layers
  private static WEIGHTS = {
    source: 0.2,
    format: 0.3,
    quality: 0.25,
    range: 0.25,
  };

  public validate(data: IncomingData): ValidationResult {
    const runId = langsmithService.traceStart('Data Validation Layer', { source: data.source, dataType: data.dataType });

    try {
      const breakdown: Record<string, ValidationLayerResult> = {};
      
      // 1. Source Validation
      breakdown.source = this.validateSource(data.source);
      
      // 2. Data Format
      breakdown.format = this.validateFormat(data.payload);
      
      // 3. Data Quality
      breakdown.quality = this.validateQuality(data.payload);
      
      // 4. Range Validation
      breakdown.range = this.validateRange(data.dataType, data.payload);

      // Calculate final weighted score
      let totalScore = 0;
      let totalWeight = 0;

      for (const [layer, result] of Object.entries(breakdown)) {
        totalScore += result.score * result.weight;
        totalWeight += result.weight;
      }

      const finalScore = totalWeight > 0 ? (totalScore / totalWeight) : 0;
      const isAutoApproved = finalScore > 80;

      const resultPayload = {
        finalScore: parseFloat(finalScore.toFixed(2)),
        isAutoApproved,
        breakdown,
        metadata: {
          source: data.source,
          extractedAt: new Date(), // Capture exact extraction/validation time
        }
      };

      langsmithService.traceSuccess(runId, resultPayload);
      return resultPayload;
    } catch (error) {
      langsmithService.traceError(runId, error);
      // Fail-safe default payload if validation logic crashes to prevent app failures
      return {
        finalScore: 0,
        isAutoApproved: false,
        breakdown: {},
        metadata: { source: data.source, extractedAt: new Date() }
      };
    }
  }

  private validateSource(source: string): ValidationLayerResult {
    let score = 50;
    let reason = "Unknown source";

    const trustedSources = ['FRED', 'WorldBank', 'IMF'];
    
    if (trustedSources.includes(source)) {
      score = 100;
      reason = "Highly trusted official source";
    } else if (source.toLowerCase().includes('api')) {
      score = 70;
      reason = "Standard API source";
    }

    return { score, weight: DataValidator.WEIGHTS.source, reason };
  }

  private validateFormat(payload: any): ValidationLayerResult {
    let score = 100;
    const errors: string[] = [];

    // Basic format checks
    if (!payload || typeof payload !== 'object') {
      return { score: 0, weight: DataValidator.WEIGHTS.format, reason: 'Invalid payload format (not an object)' };
    }

    // Example checks for specific payload fields expected
    if ('value' in payload && typeof payload.value !== 'number' && typeof payload.value !== 'string') {
      score -= 50;
      errors.push('Value is not a standard type (number/string)');
    }

    if (Array.isArray(payload)) {
      if (payload.length === 0) {
        score -= 20;
        errors.push('Payload is an empty array');
      }
    }

    return { 
      score: Math.max(0, score), 
      weight: DataValidator.WEIGHTS.format, 
      reason: errors.length > 0 ? errors.join(', ') : 'Format looks correct' 
    };
  }

  private validateQuality(payload: any): ValidationLayerResult {
    let score = 100;
    let missingCount = 0;

    // Recursive function to check for nulls or NaNs
    const checkQuality = (obj: any) => {
      if (obj === null || obj === undefined) {
        missingCount++;
        return;
      }
      if (typeof obj === 'number' && isNaN(obj)) {
        missingCount++;
        return;
      }
      if (Array.isArray(obj)) {
        obj.forEach(checkQuality);
      } else if (typeof obj === 'object') {
        Object.values(obj).forEach(checkQuality);
      }
    };

    checkQuality(payload);

    if (missingCount > 0) {
      // Deduct 10 points for each missing/invalid piece of data, max 100
      score -= Math.min(100, missingCount * 10);
    }

    return { 
      score: Math.max(0, score), 
      weight: DataValidator.WEIGHTS.quality, 
      reason: missingCount > 0 ? `Found ${missingCount} null/NaN values` : 'No missing or invalid values detected' 
    };
  }

  private validateRange(dataType: string, payload: any): ValidationLayerResult {
    let score = 100;
    const warnings: string[] = [];

    // Example range checks depending on dataType
    if (dataType === 'KPI') {
      // If it's a rate, maybe it shouldn't be above 100% or below -100% usually
      if (payload.title && payload.title.toLowerCase().includes('rate')) {
        const valStr = String(payload.value).replace('%', '').trim();
        const numVal = parseFloat(valStr);
        if (!isNaN(numVal)) {
          if (numVal < -20 || numVal > 150) {
            score -= 50;
            warnings.push('Rate value seems highly unusual (out of -20 to 150 range)');
          }
        }
      }
    } else if (dataType === 'ChartData' && Array.isArray(payload)) {
      // Example: check for extreme jumps
      let extremeJumps = 0;
      for (let i = 1; i < payload.length; i++) {
        const prev = payload[i-1].value;
        const curr = payload[i].value;
        if (typeof prev === 'number' && typeof curr === 'number') {
           const percentChange = Math.abs((curr - prev) / prev);
           if (percentChange > 5) { // 500% jump
             extremeJumps++;
           }
        }
      }
      if (extremeJumps > 0) {
        score -= Math.min(100, extremeJumps * 20);
        warnings.push(`Detected ${extremeJumps} extreme value jumps between consecutive data points`);
      }
    }

    return { 
      score: Math.max(0, score), 
      weight: DataValidator.WEIGHTS.range, 
      reason: warnings.length > 0 ? warnings.join('; ') : 'Values within acceptable historical/logical ranges' 
    };
  }

  /**
   * Validates LLM generated response against retrieved evidence and LLM assessment diagnostics.
   * Returns a Validation Score between 0 and 100.
   */
  public validateAIResponse(
    text: string,
    sources: string[],
    retrievedChunks: any[],
    assessment: {
      context_sufficient: boolean;
      unsupported_claims: number;
      conflicting_sources: boolean;
      assumptions_made: number;
      answer_quality: number;
    }
  ): number {
    let score = 100;

    // Deduct for unsupported claims
    if (assessment.unsupported_claims > 0) {
      score -= Math.min(50, assessment.unsupported_claims * 15);
    }

    // Deduct for conflicting sources
    if (assessment.conflicting_sources) {
      score -= 20;
    }

    // Deduct if context was not sufficient but response generated claims
    if (!assessment.context_sufficient) {
      score -= 15;
    }

    // Deduct if too many assumptions were made
    if (assessment.assumptions_made > 0) {
      score -= Math.min(20, assessment.assumptions_made * 5);
    }

    // Check for missing citations if context chunks exist but no sources cited
    if (retrievedChunks.length > 0 && sources.length === 0) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }
}
