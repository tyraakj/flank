import { OpportunityItem } from "@flank/shared";

export interface RankedOpportunity extends OpportunityItem {
  score: number;
  rank: number;
}

export class OpportunityRankingService {
  /**
   * Deterministically calculates a strategic priority score for an opportunity.
   */
  static calculateScore(item: OpportunityItem): number {
    // 1. Base Score: High Impact (weight 2.5), Low Effort / High Ease (weight 1.5), High Defensibility (weight 1.0)
    const impactScore = Math.max(1, Math.min(5, item.impact)) * 2.5;
    const easeScore = (6 - Math.max(1, Math.min(5, item.effort))) * 1.5;
    const defensibilityScore = Math.max(1, Math.min(5, item.defensibility)) * 1.0;

    const baseScore = impactScore + easeScore + defensibilityScore; // max = 12.5 + 7.5 + 5.0 = 25.0

    // 2. Evidence Breadth & Density Bonus (up to +4.0)
    const competitorSignals = item.supportingCompetitorIds.length + item.absentCompetitorIds.length;
    const competitorBonus = Math.min(2.0, competitorSignals * 0.5);
    const excerptsBonus = Math.min(2.0, item.evidenceExcerpts.length * 0.67);
    const evidenceBonus = competitorBonus + excerptsBonus;

    // 3. Confidence Factor (0.0 to 1.0)
    const confidenceMultiplier = Math.max(0.4, Math.min(1.0, item.confidence / 100));

    // Composite Final Score
    const compositeScore = (baseScore + evidenceBonus) * confidenceMultiplier;
    return Math.round(compositeScore * 100) / 100;
  }

  /**
   * Normalizes a text string into a set of significant keyword tokens.
   */
  static tokenize(text: string): Set<string> {
    const stopWords = new Set([
      "a",
      "an",
      "the",
      "and",
      "or",
      "in",
      "on",
      "at",
      "to",
      "for",
      "with",
      "by",
      "of",
      "is",
      "are",
      "vs",
      "versus",
      "our",
      "their",
      "we",
      "they",
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    return new Set(words);
  }

  /**
   * Calculates Jaccard similarity between two token sets.
   */
  static jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersection = 0;
    for (const token of setA) {
      if (setB.has(token)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Calculates Szymkiewicz-Simpson overlap coefficient between two token sets.
   */
  static calculateOverlap(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersection = 0;
    for (const token of setA) {
      if (setB.has(token)) intersection++;
    }
    const minSize = Math.min(setA.size, setB.size);
    return minSize > 0 ? intersection / minSize : 0;
  }

  /**
   * Merges and deduplicates overlapping strategic opportunities.
   */
  static deduplicateOpportunities(items: OpportunityItem[]): OpportunityItem[] {
    const deduplicated: OpportunityItem[] = [];

    for (const candidate of items) {
      const candidateGapTokens = this.tokenize(candidate.gap);
      const candidateFullTokens = this.tokenize(`${candidate.gap} ${candidate.suggestedMove}`);

      let matchedIndex = -1;
      for (let i = 0; i < deduplicated.length; i++) {
        const existing = deduplicated[i];
        if (existing.kind !== candidate.kind) continue;

        const existingGapTokens = this.tokenize(existing.gap);
        const existingFullTokens = this.tokenize(`${existing.gap} ${existing.suggestedMove}`);

        const gapOverlap = this.calculateOverlap(candidateGapTokens, existingGapTokens);
        const fullSimilarity = this.jaccardSimilarity(candidateFullTokens, existingFullTokens);

        if (gapOverlap >= 0.4 || fullSimilarity >= 0.35) {
          matchedIndex = i;
          break;
        }
      }

      if (matchedIndex !== -1) {
        // Merge candidate into existing opportunity
        const existing = deduplicated[matchedIndex];
        const mergedSupporting = Array.from(
          new Set([...existing.supportingCompetitorIds, ...candidate.supportingCompetitorIds]),
        );
        const mergedAbsent = Array.from(
          new Set([...existing.absentCompetitorIds, ...candidate.absentCompetitorIds]),
        );
        const mergedExcerpts = Array.from(
          new Set([...existing.evidenceExcerpts, ...candidate.evidenceExcerpts]),
        );
        const mergedUrls = Array.from(new Set([...existing.sourceUrls, ...candidate.sourceUrls]));

        deduplicated[matchedIndex] = {
          ...existing,
          impact: Math.max(existing.impact, candidate.impact),
          effort: Math.min(existing.effort, candidate.effort), // favor more achievable path
          defensibility: Math.max(existing.defensibility, candidate.defensibility),
          confidence: Math.max(existing.confidence, candidate.confidence),
          supportingCompetitorIds: mergedSupporting,
          absentCompetitorIds: mergedAbsent,
          evidenceExcerpts: mergedExcerpts,
          sourceUrls: mergedUrls,
        };
      } else {
        deduplicated.push({ ...candidate });
      }
    }

    return deduplicated;
  }

  /**
   * Deduplicates, scores, and sequentially ranks opportunities.
   */
  static rankOpportunities(
    items: OpportunityItem[],
    maxOpportunities: number = 8,
  ): RankedOpportunity[] {
    const deduplicated = this.deduplicateOpportunities(items);

    const scored = deduplicated.map((item) => ({
      ...item,
      score: this.calculateScore(item),
      rank: 0,
    }));

    // Sort by score descending (highest priority first)
    scored.sort((a, b) => b.score - a.score);

    // Limit to configured cap and assign sequential 1-based ranks
    const capped = scored.slice(0, maxOpportunities);
    return capped.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }
}
