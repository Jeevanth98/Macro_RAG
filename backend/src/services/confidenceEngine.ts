import { RetrievedChunk, RetrievalResult } from './retrievalService';

export interface ConfidenceBreakdown {
  rag: number | null;
  citationCoverage: number | null;
  validation: number | null;
  llmAssessment: number | null;
}

export interface ConfidenceDetails {
  score: number;
  level: 'High' | 'Medium' | 'Low';
  breakdown: ConfidenceBreakdown;
  reason: string;
}

export interface LLMAssessment {
  context_sufficient: boolean;
  unsupported_claims: number;
  conflicting_sources: boolean;
  assumptions_made: number;
  answer_quality: number; // 1 to 5
}

export class ConfidenceEngine {
  /**
   * Calculates RAG Confidence score (0 to 100) based on formula:
   * 0.40 * Vector Similarity + 0.20 * BM25 Relevance + 0.15 * RRF Agreement + 0.10 * Source Diversity + 0.15 * Retrieval Coverage
   */
  public static calculateRAGConfidence(retrieval: RetrievalResult): number {
    const { results = [], vector_results = [], bm25_results = [] } = retrieval;
    if (results.length === 0) return 0;

    // 1. Vector Similarity (0.40)
    let vectorSim = 0;
    const validVectorScores = vector_results
      .map(r => r.score)
      .filter(s => typeof s === 'number');
    if (validVectorScores.length > 0) {
      const avgDistance = validVectorScores.reduce((a, b) => a + b, 0) / validVectorScores.length;
      vectorSim = Math.max(0, Math.min(100, (1 - avgDistance) * 100));
    }

    // 2. BM25 Relevance (0.20)
    let bm25Rel = 0;
    const validBM25Scores = bm25_results
      .map(r => r.score)
      .filter(s => typeof s === 'number');
    if (validBM25Scores.length > 0) {
      const avgBM25 = validBM25Scores.reduce((a, b) => a + b, 0) / validBM25Scores.length;
      bm25Rel = (avgBM25 / (avgBM25 + 15)) * 100;
    }

    // 3. RRF Agreement (0.15)
    let rrfAgreement = 0;
    if (vector_results.length > 0 && bm25_results.length > 0) {
      const vectorIds = new Set(vector_results.map(r => r.id));
      const overlap = bm25_results.filter(r => vectorIds.has(r.id)).length;
      rrfAgreement = (overlap / 5) * 100;
    }

    // 4. Source Diversity (0.10)
    let sourceDiversity = 0;
    if (results.length > 0) {
      const uniqueSources = new Set(results.map(r => r.metadata.filename || r.metadata.source));
      sourceDiversity = (uniqueSources.size / results.length) * 100;
    }

    // 5. Retrieval Coverage (0.15)
    let coverage = 0;
    if (results.length > 0) {
      const relevantCount = results.filter(r => {
        const vSim = typeof r.vector_score === 'number' ? (1 - r.vector_score) : 0;
        const bScore = r.bm25_score || 0;
        return vSim >= 0.5 || bScore >= 1.5;
      }).length;
      coverage = (relevantCount / results.length) * 100;
    }

    const ragScore = (0.40 * vectorSim) + (0.20 * bm25Rel) + (0.15 * rrfAgreement) + (0.10 * sourceDiversity) + (0.15 * coverage);
    return Math.max(0, Math.min(100, parseFloat(ragScore.toFixed(1))));
  }

  /**
   * Calculates API Confidence score (0 to 100) based on formula:
   * 0.40 * RAG Confidence + 0.20 * Citation Coverage + 0.20 * Validation Score + 0.20 * LLM Structured Assessment
   *
   * Dynamically filters out N/A (null) metrics and re-normalizes the weights.
   */
  public static calculateAPIConfidence(
    ragConfidence: number | null,
    citationCoverage: number | null,
    validationScore: number | null,
    llmAssessmentScore: number | null
  ): ConfidenceDetails {
    let weightedSum = 0;
    let totalWeight = 0;

    if (ragConfidence !== null) {
      weightedSum += 0.40 * ragConfidence;
      totalWeight += 0.40;
    }
    if (citationCoverage !== null) {
      weightedSum += 0.20 * citationCoverage;
      totalWeight += 0.20;
    }
    if (validationScore !== null) {
      weightedSum += 0.20 * validationScore;
      totalWeight += 0.20;
    }
    if (llmAssessmentScore !== null) {
      weightedSum += 0.20 * llmAssessmentScore;
      totalWeight += 0.20;
    }

    const finalScore = totalWeight > 0 ? (weightedSum / totalWeight) : 0;
    const score = Math.max(0, Math.min(100, Math.round(finalScore)));

    let level: 'High' | 'Medium' | 'Low' = 'Medium';
    let reason = 'Moderate confidence in active sources and answer quality.';
    if (score >= 80) {
      level = 'High';
      reason = 'High-quality response from active sources with no validation issues.';
    } else if (score < 50) {
      level = 'Low';
      reason = 'Low confidence due to potential validation or assessment anomalies.';
    }

    return {
      score,
      level,
      breakdown: {
        rag: ragConfidence !== null ? Math.round(ragConfidence) : null,
        citationCoverage: citationCoverage !== null ? Math.round(citationCoverage) : null,
        validation: validationScore !== null ? Math.round(validationScore) : null,
        llmAssessment: llmAssessmentScore !== null ? Math.round(llmAssessmentScore) : null
      },
      reason
    };
  }

  /**
   * Helper to convert structured assessment response to a 0-100 score
   */
  public static scoreLLMAssessment(assessment: LLMAssessment): number {
    let score = 0;
    
    // 1. Context Sufficient
    score += assessment.context_sufficient ? 20 : 6;
    
    // 2. Unsupported Claims
    if (assessment.unsupported_claims === 0) score += 20;
    else if (assessment.unsupported_claims === 1) score += 14;
    else if (assessment.unsupported_claims === 2) score += 8;
    else score += 2;

    // 3. Conflicting Sources
    score += assessment.conflicting_sources ? 10 : 20;

    // 4. Assumptions Made
    if (assessment.assumptions_made === 0) score += 20;
    else if (assessment.assumptions_made === 1) score += 16;
    else if (assessment.assumptions_made === 2) score += 12;
    else score += 6;

    // 5. Answer Quality (1 to 5)
    score += (assessment.answer_quality / 5) * 20;

    return Math.max(0, Math.min(100, score));
  }
}
