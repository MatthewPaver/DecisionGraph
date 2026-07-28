(function exposeDecisionRetrieval(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DecisionRetrieval = api;
})(typeof window === "undefined" ? globalThis : window, function createDecisionRetrieval() {
  const STOP_WORDS = new Set(
    "a an and are as at be before but by for from had has have in into is it of on or our the this to was were with after during requested required approve change project late".split(" ")
  );

  function tokens(text) {
    return [
      ...new Set(
        String(text || "")
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, " ")
          .split(/\s+/)
          .filter(token => token.length > 2 && !STOP_WORDS.has(token))
      ),
    ];
  }

  function overlapScore(queryTokens, caseTokens) {
    if (!queryTokens.length || !caseTokens.length) return 0;
    const intersection = queryTokens.filter(token => caseTokens.includes(token)).length;
    return intersection / Math.sqrt(queryTokens.length * caseTokens.length);
  }

  function rankCases(cases, query, limit = 3) {
    const queryTokens = tokens(query.problem);
    return cases
      .map(item => {
        const caseTokens = tokens(
          `${item.problem} ${item.context} ${(item.risks || []).join(" ")} ${item.intervention}`
        );
        const text = overlapScore(queryTokens, caseTokens);
        const sector = item.sector === query.sector ? 1 : 0;
        const phase = item.phase === query.phase ? 1 : 0;
        const type = item.type === query.type ? 1 : 0;
        const raw = text * 0.46 + sector * 0.18 + phase * 0.19 + type * 0.17;
        const score = Math.round(Math.min(0.97, 0.36 + raw * 0.64) * 100);
        const shared = queryTokens.filter(token => caseTokens.includes(token)).slice(0, 4);
        const reasons = [
          sector && `Same sector · ${item.sector}`,
          phase && `Same phase · ${item.phase}`,
          type && `Same change · ${item.type}`,
          ...shared.map(token => `Shared signal · ${token}`),
        ]
          .filter(Boolean)
          .slice(0, 4);
        return { ...item, score, reasons, textScore: text };
      })
      .sort((a, b) => b.score - a.score || b.confidence - a.confidence)
      .slice(0, limit);
  }

  return { overlapScore, rankCases, tokens };
});
