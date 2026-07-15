# DecisionGraph

**What happened last time?**

DecisionGraph is an interactive decision-support demonstrator for retrieving comparable project changes, explaining why they are relevant and connecting the intervention chosen to the schedule or cost outcome that followed.

It now acts as optional precedent evidence inside [ProjectLens Project Change Assurance](https://matthewpaver.github.io/ProjectLens/change-assurance.html). The primary workflow keeps comparable cases collapsed until a reviewer asks for supporting evidence.

![DecisionGraph knowledge graph and comparable project cases](docs/assets/decisiongraph-preview.png)

## Live workflow

1. Describe a new change or delivery problem.
2. Add sector, project phase, change type and schedule exposure.
3. Retrieve the three most comparable historical cases.
4. Inspect the match explanation and project knowledge graph.
5. Compare the intervention and measured outcome from each precedent.
6. Review an evidence-linked recommendation with explicit boundaries.
7. Record a human decision and add the eventual outcome back into memory.

The public demo includes 16 synthetic cases across rail, energy, buildings, water, aviation, infrastructure and digital delivery. JSON and CSV files can be imported locally in the browser. Imported data is not sent to a server.

## Retrieval design

This version deliberately separates deterministic retrieval from generative synthesis:

- token-overlap similarity over problem, context, risks and intervention
- exact weighted matches for sector, phase and change type
- visible match reasons for every retrieved case
- explicit graph edges from problem to decision to outcome
- recommendation language constrained to retrieved evidence
- mandatory human review before a proposal enters the memory log

A production implementation could replace token overlap with evaluated semantic embeddings and add a model-backed synthesis stage. It would also need access control, document-level permissions, source-quality checks, evaluation datasets and durable storage.

## Research basis

- PMI described lessons-learned knowledge bases as frequently populated but infrequently accessed, leaving critical knowledge underused: [Knowledge is power](https://www.pmi.org/learning/library/knowledge-power-implementing-lessons-learned-6663).
- A 2026 study evaluated semantic embeddings, vector similarity, local language models and context filtering against keyword search. It reported substantially improved retrieval relevance while noting source-document quality and processing-time trade-offs: [Improving Lessons Learned Retrieval in Project-based Organizations through Retrieval-Augmented Generation](https://doi.org/10.1016/j.procs.2026.03.192).

## Run locally

```bash
python3 -m http.server 4173 --directory docs
```

Then open `http://127.0.0.1:4173`.

## Verify

```bash
node --check docs/app.js
node --check docs/cases.js
python3 -m unittest discover tests
```

## Model boundary

This is a synthetic portfolio demonstrator, not an autonomous change-control system. Its output is a proposal for professional review. It does not replace contractual, safety, engineering, commercial or governance approval.

## License

MIT
