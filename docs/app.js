const state = {
  cases: [...window.DECISION_CASES],
  matches: [],
  selectedCase: null,
  memory: [
    { id: "DG-NEW-001", title: "Signalling interface change", owner: "Systems director", status: "Review due", detail: "Conditional approval drafted from 3 precedents. Outcome evidence due after integration test." },
    { id: "DG-NEW-002", title: "Supplier recovery action", owner: "Commercial lead", status: "Evidence due", detail: "Expedite decision approved. Dispatch and cost evidence not yet attached." },
    { id: "DG-024", title: "Late signalling interface change", owner: "Systems director", status: "Complete", detail: "Observed outcome recorded: 8 days against 24 days of baseline exposure." }
  ]
};

const STOP_WORDS = new Set("a an and are as at be before but by for from had has have in into is it of on or our the this to was were with after during requested required approve change project late".split(" "));
const EXAMPLES = [
  { problem: "Approve a late signalling interface change before system integration after a standards clarification.", sector: "Rail", phase: "Integration", type: "Scope change" },
  { problem: "Add a second construction shift to recover delay even though only two workfronts have confirmed access.", sector: "Energy", phase: "Construction", type: "Acceleration" },
  { problem: "Replace a long-lead equipment supplier without invalidating the approved technical interface.", sector: "Water", phase: "Procurement", type: "Supplier change" },
  { problem: "Accept a controls modification after an integrated commissioning test failed.", sector: "Digital", phase: "Testing", type: "Technical change" }
];
let exampleIndex = 0;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function tokens(text) {
  return [...new Set(String(text || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(token => token.length > 2 && !STOP_WORDS.has(token)))];
}

function overlapScore(queryTokens, caseTokens) {
  if (!queryTokens.length || !caseTokens.length) return 0;
  const intersection = queryTokens.filter(token => caseTokens.includes(token)).length;
  return intersection / Math.sqrt(queryTokens.length * caseTokens.length);
}

function retrieveCases(query) {
  const queryTokens = tokens(query.problem);
  return state.cases.map(item => {
    const caseTokens = tokens(`${item.problem} ${item.context} ${item.risks.join(" ")} ${item.intervention}`);
    const text = overlapScore(queryTokens, caseTokens);
    const sector = item.sector === query.sector ? 1 : 0;
    const phase = item.phase === query.phase ? 1 : 0;
    const type = item.type === query.type ? 1 : 0;
    const raw = text * .46 + sector * .18 + phase * .19 + type * .17;
    const score = Math.round(Math.min(.97, .36 + raw * .64) * 100);
    const shared = queryTokens.filter(token => caseTokens.includes(token)).slice(0, 4);
    const reasons = [sector && `Same sector · ${item.sector}`, phase && `Same phase · ${item.phase}`, type && `Same change · ${item.type}`, ...shared.map(token => `Shared signal · ${token}`)].filter(Boolean).slice(0, 4);
    return { ...item, score, reasons, textScore: text };
  }).sort((a, b) => b.score - a.score || b.confidence - a.confidence).slice(0, 3);
}

function currentQuery() {
  return {
    problem: document.getElementById("problemInput").value.trim(),
    sector: document.getElementById("sectorInput").value,
    phase: document.getElementById("phaseInput").value,
    type: document.getElementById("typeInput").value,
    pressure: document.getElementById("pressureInput").value
  };
}

function renderCaseCards() {
  document.getElementById("caseResults").innerHTML = state.matches.map((item, index) => `
    <article class="case-card" data-rank="0${index + 1}">
      <div class="case-meta"><span>${escapeHtml(item.id)} · ${item.year}</span><b class="match-score">${item.score}% MATCH</b></div>
      <h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.context)}</p>
      <div class="match-reasons">${item.reasons.map(reason => `<span>${escapeHtml(reason)}</span>`).join("")}</div>
      <div class="case-decision"><span>Decision taken</span><p>${escapeHtml(item.decision)}</p></div>
      <div class="case-outcome"><span>Observed outcome</span><p>${escapeHtml(item.outcome)}</p><strong>${item.scheduleOutcome > 0 ? "+" : ""}${item.scheduleOutcome} days · ${item.costOutcome > 0 ? "+" : ""}${item.costOutcome}% cost</strong></div>
    </article>`).join("");
}

function graphLabel(text, max = 18) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function renderGraph() {
  const positions = [
    { case: [300, 75], decision: [500, 55], outcome: [705, 75] },
    { case: [300, 195], decision: [500, 195], outcome: [705, 195] },
    { case: [300, 315], decision: [500, 335], outcome: [705, 315] }
  ];
  const query = [92, 195];
  const lines = [];
  const nodes = [`<g class="graph-node query"><circle cx="${query[0]}" cy="${query[1]}" r="29"></circle><text x="${query[0]}" y="${query[1] - 4}" text-anchor="middle">NEW</text><text class="sub" x="${query[0]}" y="${query[1] + 9}" text-anchor="middle">CHANGE</text></g>`];
  state.matches.forEach((item, index) => {
    const pos = positions[index];
    lines.push(`<line class="graph-line ${index === 0 ? "strong" : ""}" x1="${query[0] + 28}" y1="${query[1]}" x2="${pos.case[0] - 20}" y2="${pos.case[1]}"></line>`);
    lines.push(`<line class="graph-line" x1="${pos.case[0] + 20}" y1="${pos.case[1]}" x2="${pos.decision[0] - 20}" y2="${pos.decision[1]}"></line>`);
    lines.push(`<line class="graph-line" x1="${pos.decision[0] + 20}" y1="${pos.decision[1]}" x2="${pos.outcome[0] - 20}" y2="${pos.outcome[1]}"></line>`);
    nodes.push(`<g class="graph-node case"><circle cx="${pos.case[0]}" cy="${pos.case[1]}" r="20" style="animation-delay:${index * .12}s"></circle><text x="${pos.case[0]}" y="${pos.case[1] - 30}" text-anchor="middle">${escapeHtml(item.id)}</text><text class="sub" x="${pos.case[0]}" y="${pos.case[1] + 37}" text-anchor="middle">${item.score}% MATCH</text></g>`);
    nodes.push(`<g class="graph-node decision"><circle cx="${pos.decision[0]}" cy="${pos.decision[1]}" r="18" style="animation-delay:${.2 + index * .12}s"></circle><text x="${pos.decision[0]}" y="${pos.decision[1] - 28}" text-anchor="middle">${escapeHtml(graphLabel(item.intervention))}</text></g>`);
    nodes.push(`<g class="graph-node outcome"><circle cx="${pos.outcome[0]}" cy="${pos.outcome[1]}" r="18" style="animation-delay:${.35 + index * .12}s"></circle><text x="${pos.outcome[0]}" y="${pos.outcome[1] - 28}" text-anchor="middle">${item.scheduleOutcome > 0 ? "+" : ""}${item.scheduleOutcome} DAYS</text><text class="sub" x="${pos.outcome[0]}" y="${pos.outcome[1] + 34}" text-anchor="middle">OBSERVED</text></g>`);
  });
  document.getElementById("graphCanvas").innerHTML = `<svg viewBox="0 0 800 390" role="img" aria-label="Current decision connected to three historical cases, their interventions and observed outcomes">${lines.join("")}${nodes.join("")}</svg>`;
  document.getElementById("graphMeta").textContent = `${1 + state.matches.length * 3} nodes · ${state.matches.length * 3} evidence links`;
}

function renderInsights() {
  const positive = state.matches.filter(item => item.scheduleOutcome <= item.baselineExposure).length;
  const avgCost = state.matches.reduce((sum, item) => sum + item.costOutcome, 0) / state.matches.length;
  const protectedTesting = state.matches.filter(item => /test|rehearsal|rollback|staged/i.test(`${item.decision} ${item.intervention}`)).length;
  document.getElementById("insightPanel").innerHTML = `<span>Pattern detected</span><h3>${protectedTesting >= 2 ? "Protect validation before protecting the date." : "Gate the intervention before committing cost."}</h3><div class="insight-stat"><span>Contained exposure</span><b>${positive} / ${state.matches.length}</b><p>Comparable cases that finished within their original untreated exposure.</p></div><div class="insight-stat"><span>Average cost movement</span><b>+${avgCost.toFixed(1)}%</b><p>Observed cost change across the retrieved cases.</p></div><div class="insight-stat"><span>Validation controls</span><b>${protectedTesting}</b><p>Cases using protected tests, rehearsal, staging or rollback.</p></div>`;
}

function renderRecommendation() {
  const best = state.matches[0];
  const worst = [...state.matches].sort((a, b) => b.scheduleOutcome - a.scheduleOutcome)[0];
  const successful = state.matches.filter(item => item.scheduleOutcome <= item.baselineExposure).sort((a, b) => a.scheduleOutcome - b.scheduleOutcome);
  const lower = Math.min(...successful.map(item => item.scheduleOutcome));
  const upper = Math.max(...successful.map(item => item.scheduleOutcome));
  const action = /interface|test|software|signalling/i.test(currentQuery().problem)
    ? "Approve with an interface freeze and protected regression test."
    : best.decision.replace(/^Approve /i, "Approve ").replace(/\.$/, ".");
  document.getElementById("recommendationTitle").textContent = action;
  document.getElementById("evidenceStrength").textContent = `${state.matches.length} COMPARABLE CASES`;
  document.getElementById("outcomeRange").innerHTML = `${lower}–${upper}<small> DAYS</small>`;
  document.getElementById("outcomeRangeCopy").textContent = `versus ${Math.min(...state.matches.map(item => item.baselineExposure))}–${Math.max(...state.matches.map(item => item.baselineExposure))} days of untreated exposure`;
  document.getElementById("whyAction").textContent = `${best.id} is the closest precedent and contained the outcome to ${best.scheduleOutcome} days. ${worst.id} is the caution case: ${worst.intervention.toLowerCase()} produced ${worst.scheduleOutcome} days and ${worst.costOutcome}% cost movement.`;
  const conditions = /interface|test|software|signalling/i.test(currentQuery().problem)
    ? ["Name one interface owner", "Freeze the affected design for 10 days", "Protect the full regression-test window"]
    : [best.intervention, "Define a measurable stop or review gate", "Record schedule and cost outcome at the next control point"];
  document.getElementById("conditionsList").innerHTML = conditions.map(item => `<li>${escapeHtml(item)}</li>`).join("");
  document.getElementById("evidenceBoundary").textContent = `This is a proposal from ${state.matches.length} synthetic precedents, not an autonomous approval. Confirm local safety, commercial, access and contractual constraints.`;
}

function searchMemory(scroll = true) {
  const query = currentQuery();
  if (query.problem.length < 20) { showToast("Add enough context to describe the decision before searching."); return; }
  state.matches = retrieveCases(query);
  renderCaseCards(); renderGraph(); renderInsights(); renderRecommendation();
  document.getElementById("retrievalSummary").textContent = `${state.matches.length} of ${state.cases.length} cases · ${state.matches[0].score}% top match`;
  if (scroll) document.getElementById("resultsSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderVault() {
  const query = document.getElementById("vaultSearch").value.toLowerCase();
  const sector = document.getElementById("vaultSector").value;
  const outcome = document.getElementById("vaultOutcome").value;
  const filtered = state.cases.filter(item => {
    const searchable = `${item.project} ${item.title} ${item.problem} ${item.risks.join(" ")} ${item.intervention}`.toLowerCase();
    const outcomeMatch = outcome === "all" || (outcome === "positive" ? item.scheduleOutcome <= item.baselineExposure : item.scheduleOutcome > item.baselineExposure);
    return searchable.includes(query) && (sector === "all" || item.sector === sector) && outcomeMatch;
  });
  document.getElementById("vaultCount").textContent = `${filtered.length} cases`;
  if (!state.selectedCase || !filtered.some(item => item.id === state.selectedCase.id)) state.selectedCase = filtered[0] || null;
  document.getElementById("vaultList").innerHTML = filtered.map(item => `<button class="vault-row ${state.selectedCase?.id === item.id ? "active" : ""}" data-case-id="${item.id}" type="button"><span>${item.id}<small>${item.year} · ${escapeHtml(item.sector)}</small></span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.intervention)}</small></div><b>${item.scheduleOutcome > 0 ? "+" : ""}${item.scheduleOutcome}d</b></button>`).join("") || `<p class="empty-state">No cases match these filters.</p>`;
  document.querySelectorAll("[data-case-id]").forEach(button => button.addEventListener("click", () => { state.selectedCase = state.cases.find(item => item.id === button.dataset.caseId); renderVault(); }));
  renderDossier();
}

function renderDossier() {
  const item = state.selectedCase;
  if (!item) { document.getElementById("caseDossier").innerHTML = ""; return; }
  document.getElementById("caseDossier").innerHTML = `<div class="dossier-head"><span>${item.id} · ${item.project} · ${item.year}</span><h2>${escapeHtml(item.title)}</h2></div><div class="dossier-section"><span>Original problem</span><p>${escapeHtml(item.problem)}</p></div><div class="dossier-section"><span>Decision and intervention</span><p>${escapeHtml(item.decision)}</p></div><div class="dossier-section dossier-outcome"><div><span>Schedule</span><b>${item.scheduleOutcome > 0 ? "+" : ""}${item.scheduleOutcome} days</b></div><div><span>Cost</span><b>${item.costOutcome > 0 ? "+" : ""}${item.costOutcome}%</b></div></div><div class="dossier-section"><span>Observed outcome</span><p>${escapeHtml(item.outcome)}</p></div><div class="dossier-section"><span>Evidence trail</span><ul>${item.evidence.map(evidence => `<li>${escapeHtml(evidence)}</li>`).join("")}</ul></div>`;
}

function populateVaultFilters() {
  const sectors = [...new Set(state.cases.map(item => item.sector))].sort();
  const select = document.getElementById("vaultSector");
  const current = select.value;
  select.innerHTML = `<option value="all">All sectors</option>${sectors.map(sector => `<option>${escapeHtml(sector)}</option>`).join("")}`;
  if (sectors.includes(current)) select.value = current;
}

function renderMemory() {
  document.getElementById("memoryCount").textContent = `${state.memory.filter(item => item.status !== "Complete").length} open`;
  document.getElementById("memoryTimeline").innerHTML = state.memory.map(item => `<div class="timeline-item ${item.status === "Complete" ? "complete" : ""}"><i class="timeline-node"></i><div><span>${escapeHtml(item.id)} · ${escapeHtml(item.owner)}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p></div><b>${escapeHtml(item.status)}</b></div>`).join("");
}

function switchView(view) {
  document.querySelectorAll("[data-view-panel]").forEach(panel => { panel.hidden = panel.dataset.viewPanel !== view; panel.classList.toggle("active", panel.dataset.viewPanel === view); });
  document.querySelectorAll("[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  if (view === "vault") renderVault();
  if (view === "memory") renderMemory();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function parseCsv(text) {
  const rows = []; let row = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) { if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; } else if (char === '"') quoted = false; else field += char; }
    else if (char === '"') quoted = true; else if (char === ",") { row.push(field); field = ""; } else if (char === "\n") { row.push(field); if (row.some(cell => cell.trim())) rows.push(row); row = []; field = ""; } else if (char !== "\r") field += char;
  }
  row.push(field); if (row.some(cell => cell.trim())) rows.push(row);
  const headers = (rows.shift() || []).map(header => header.trim().replace(/^\uFEFF/, ""));
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function normaliseImported(item, index) {
  if (!item.project || !item.problem || !item.decision || !item.outcome) return null;
  return {
    id: item.id || `IMP-${String(index + 1).padStart(3, "0")}`, project: item.project, sector: item.sector || "Other", phase: item.phase || "Delivery", type: item.type || "Scope change", year: Number(item.year) || new Date().getFullYear(),
    title: item.title || String(item.problem).slice(0, 55), problem: item.problem, context: item.context || "Imported organisational case.", risks: Array.isArray(item.risks) ? item.risks : String(item.risks || "").split(/[;|]/).filter(Boolean),
    decision: item.decision, intervention: item.intervention || item.decision, scheduleOutcome: Number(item.scheduleOutcome) || 0, costOutcome: Number(item.costOutcome) || 0, baselineExposure: Number(item.baselineExposure) || 0,
    outcome: item.outcome, confidence: Number(item.confidence) || .7, evidence: Array.isArray(item.evidence) ? item.evidence : String(item.evidence || "Imported source").split(/[;|]/), owner: item.owner || "Not supplied"
  };
}

async function importHistory(files) {
  const imported = [];
  for (const file of Array.from(files)) {
    try {
      const text = await file.text();
      const parsed = file.name.toLowerCase().endsWith(".json") ? JSON.parse(text) : parseCsv(text);
      const items = Array.isArray(parsed) ? parsed : parsed.cases || [parsed];
      items.forEach((item, index) => { const normalised = normaliseImported(item, index); if (normalised) imported.push(normalised); });
    } catch (error) { showToast(`${file.name} could not be parsed: ${error.message}`); }
  }
  if (!imported.length) { showToast("No valid cases found. Four fields are required: project, problem, decision and outcome."); return; }
  state.cases = [...imported, ...state.cases];
  document.getElementById("caseCount").textContent = `${state.cases.length} available cases`;
  document.getElementById("importDialog").close();
  populateVaultFilters(); searchMemory(false);
  showToast(`${imported.length} case${imported.length === 1 ? "" : "s"} added locally. Nothing left your browser.`);
}

function downloadTemplate() {
  const csv = "id,project,sector,phase,type,year,title,problem,context,risks,decision,intervention,scheduleOutcome,costOutcome,baselineExposure,outcome,confidence,evidence,owner\nCASE-001,Example project,Rail,Integration,Scope change,2026,Example decision,Describe the original problem,Add relevant context,interface;testing,Describe the approved decision,Name the intervention,5,1.2,18,Describe the measured outcome,0.8,Decision log;close-out report,Decision owner";
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  Object.assign(document.createElement("a"), { href: url, download: "decisiongraph-case-template.csv" }).click(); URL.revokeObjectURL(url);
}

function showToast(message) {
  const toast = document.getElementById("toast"); toast.textContent = message; toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 4300);
}

document.getElementById("decisionForm").addEventListener("submit", event => { event.preventDefault(); searchMemory(); });
document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => switchView(button.dataset.view)));
document.getElementById("openImport").addEventListener("click", () => document.getElementById("importDialog").showModal());
document.getElementById("methodButton").addEventListener("click", () => document.getElementById("methodDialog").showModal());
document.getElementById("historyFiles").addEventListener("change", event => importHistory(event.target.files));
document.getElementById("downloadTemplate").addEventListener("click", downloadTemplate);
document.getElementById("replayGraph").addEventListener("click", renderGraph);
document.getElementById("loadExample").addEventListener("click", () => { exampleIndex = (exampleIndex + 1) % EXAMPLES.length; const example = EXAMPLES[exampleIndex]; document.getElementById("problemInput").value = example.problem; document.getElementById("sectorInput").value = example.sector; document.getElementById("phaseInput").value = example.phase; document.getElementById("typeInput").value = example.type; searchMemory(false); showToast("A different decision pattern has been loaded."); });
["vaultSearch", "vaultSector", "vaultOutcome"].forEach(id => document.getElementById(id).addEventListener(id === "vaultSearch" ? "input" : "change", renderVault));
document.getElementById("approveRecommendation").addEventListener("click", () => { state.memory.unshift({ id: `DG-NEW-${String(state.memory.length).padStart(3, "0")}`, title: currentQuery().problem.slice(0, 46), owner: "Human owner required", status: "Review due", detail: `Proposal drafted from ${state.matches.map(item => item.id).join(", ")}. Approval conditions and evidence boundary preserved.` }); renderMemory(); switchView("memory"); showToast("Proposal recorded for human review. It has not been auto-approved."); });
document.getElementById("rejectRecommendation").addEventListener("click", () => showToast("Recommendation held. Add more context or import a stronger precedent set."));
document.getElementById("saveOutcome").addEventListener("click", () => { const evidence = document.getElementById("memoryEvidence").value.trim(); if (evidence.length < 8) { showToast("Add an evidence reference before closing the loop."); return; } const item = state.memory.find(entry => entry.status !== "Complete"); if (item) { item.status = "Complete"; item.detail = `Observed outcome recorded: ${document.getElementById("memorySchedule").value} schedule days and ${document.getElementById("memoryCost").value}% cost. Evidence: ${evidence}`; } renderMemory(); showToast("Outcome validated and added to this browser session's organisational memory."); });
document.addEventListener("keydown", event => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); searchMemory(); } });

populateVaultFilters(); state.selectedCase = state.cases[0]; renderMemory(); searchMemory(false);
