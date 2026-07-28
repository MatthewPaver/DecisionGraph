const assert = require("node:assert/strict");
const test = require("node:test");

const { rankCases, tokens } = require("../docs/retrieval.js");

const cases = [
  {
    id: "MATCH",
    problem: "Late signalling interface defect before integration testing",
    context: "Rail integration",
    risks: ["interface", "testing"],
    intervention: "Freeze interface and protect regression testing",
    sector: "Rail",
    phase: "Integration",
    type: "Scope change",
    confidence: 0.8,
  },
  {
    id: "WRONG-CONTEXT",
    problem: "Late signalling interface defect before integration testing",
    context: "Digital testing",
    risks: ["interface", "testing"],
    intervention: "Freeze interface",
    sector: "Digital",
    phase: "Testing",
    type: "Technical change",
    confidence: 0.99,
  },
  {
    id: "UNRELATED",
    problem: "Replace a long-lead pump supplier",
    context: "Water procurement",
    risks: ["supplier"],
    intervention: "Early factory test",
    sector: "Water",
    phase: "Procurement",
    type: "Supplier change",
    confidence: 0.99,
  },
];

const query = {
  problem: "Approve a late signalling interface change before integration testing",
  sector: "Rail",
  phase: "Integration",
  type: "Scope change",
};

test("context matches outrank text-only matches", () => {
  const ranked = rankCases(cases, query);
  assert.equal(ranked[0].id, "MATCH");
  assert.ok(ranked[0].score > ranked[1].score);
  assert.ok(ranked[0].reasons.includes("Same sector · Rail"));
});

test("ranking is deterministic and respects the result limit", () => {
  assert.deepEqual(rankCases(cases, query, 2), rankCases(cases, query, 2));
  assert.equal(rankCases(cases, query, 2).length, 2);
});

test("tokenisation removes generic change words", () => {
  assert.deepEqual(tokens("Approve the late project change for signalling"), ["signalling"]);
});
