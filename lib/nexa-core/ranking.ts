export type ScoreSignals = {
  meaningfulReactions: number;
  comments: number;
  saves: number;
  shares: number;
  followerGrowth: number;
  originalPosts: number;
  communityContribution: number;
  spamReports: number;
  suspiciousActivity: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Deterministic first-pass score calculation.
 * Production weights belong on the server and can later move to configuration.
 * Client input must never be accepted as a score.
 */
export function calculateNexaScore(s: ScoreSignals): number {
  const positive =
    s.meaningfulReactions * 1.2 +
    s.comments * 2.0 +
    s.saves * 3.0 +
    s.shares * 3.5 +
    Math.max(0, s.followerGrowth) * 1.5 +
    s.originalPosts * 2.0 +
    s.communityContribution * 1.8;

  const penalties = s.spamReports * 8 + s.suspiciousActivity * 12;
  return Number(clamp(positive - penalties, 0, 1_000_000_000).toFixed(4));
}
