# TaskGuard — Research Positioning Brief

*A one-page summary of the project as a research artifact. Intended as a companion to a CV / résumé for a research-oriented application (e.g., Google Student Researcher).*

---

## Summary

**TaskGuard** is a Chrome Manifest V3 browser extension that performs *intent-aware*, *privacy-preserving*, *in-browser* relevance classification of every website a user visits during a self-declared focus session. The user pre-commits to a task (free-text title + optional description + category + duration); the system intercepts non-allowlisted navigations and displays a transparent 0–100 relevance score produced by a deterministic, four-signal hybrid classifier (topic-set Jaccard overlap, normalised term-frequency cosine similarity, direct domain-token matching, and a curated known-domain bonus, sigmoid-calibrated). The user issues an explicit allow/block decision; the decision is logged locally as a labelled tuple. No data leaves the device; no model is downloaded.

The project sits at the intersection of three research areas explicitly named in the Google Student Researcher call: **Human–Computer Interaction**, **applied Natural-Language Understanding**, and **on-device / privacy-preserving Machine Learning** (with a Data Science thread on the per-user labelled-dataset side).

## Research contributions

1. **System.** An end-to-end Chrome MV3 architecture combining (a) pre-committed task intent, (b) per-navigation in-process relevance scoring against that intent, and (c) per-decision local logging — to the author's knowledge, the first published browser extension to package all three together.
2. **Classifier.** A four-signal interpretable hybrid scorer (~400 LOC, single ES module, no dependencies) that runs synchronously in well under one millisecond, with weights chosen for editability and audit rather than for benchmark score-chasing.
3. **Dataset format.** A `(sessionId, intent, intentCategory, taskDescription, domain, url, decision, addedToAllowlist, userId, timestamp)` schema generated locally by every user. Compatible with strict privacy regimes; users may voluntarily contribute exports to a research corpus under informed consent.
4. **Reproducibility.** No opaque dependencies. The classifier and the 40-pair probe-set evaluation (§ 5.1.1 of the project report) can be replayed in any browser DevTools console; weights and sigmoid parameters are published in-tree.

## Research questions the artifact enables

- **RQ1.** How context-dependent is perceived relevance? *Same `(user, domain)` pair, different declared intent — how often does the decision flip?*
- **RQ2.** Where does a lightweight interpretable hybrid heuristic systematically disagree with a human relevance judgement?
- **RQ3.** Can a per-user model fine-tuned on locally-logged decisions outperform the global heuristic *without ever transmitting raw data* — i.e., is fully-local personalisation of relevance feasible on commodity hardware?
- **RQ4.** Does forcing a deliberate allow/block decision (vs. a passive block) reduce attention residue (Kim et al., 2014) measurable in subsequent session-completion rates?
- **RQ5.** What is the smallest interpretable feature set that gives competitive accuracy with a distilled-transformer head running via WebAssembly?

## Methodology already demonstrated

- Probe-set evaluation of the classifier on a hand-curated 40-pair `(intent, domain)` benchmark, with sigmoid-calibrated score buckets aligned to UI labels (§ 5.1.1).
- Signal-ablation sketch (zeroing each weight in turn) identifying topic Jaccard as the load-bearing signal and TF cosine as the smoothing signal.
- Latency benchmark: < 1 ms per classification on a commodity laptop.

## Limitations honestly stated

The classifier is a heuristic, not a learned model; weights are hand-tuned; the probe set is small and single-evaluator; English-only vocabulary; hostname-only features (no page title or DOM read, by design — to keep `host_permissions` and `scripting` out of the manifest). The labelled-data collection is subject to a Hawthorne effect for the first few sessions. See § 5.3 of the project report for the full threats-to-validity discussion.

## Why this aligns with the Google Student Researcher program

The role asks for *exploratory and direct research experiences* in one of NLU, HCI, ML, Data Science, or SWE. TaskGuard already touches four of those:

- **HCI:** the interception-with-choice design is a concrete instantiation of Lyngs et al.'s (2019) dual-systems prescription; the artifact is usable as the platform for a within-subjects user study.
- **NLU:** the intent-to-topic mapping and the TF-cosine subsignal are baselines against which a small fine-tuned encoder (e.g., MiniLM) could be benchmarked at deployment-realistic latencies.
- **ML / on-device:** the locally-collected labelled corpus is precisely the setting where federated or fully-local fine-tuning is most valuable; the artifact is ready to host that experiment.
- **Data Science:** the analytics dashboard already aggregates per-user session and decision logs; aggregating *across* consenting users (de-identified) would yield a first public dataset of intent-conditioned site-relevance judgements.

## Artifact

- **Code:** single-tree Chrome MV3 extension, ~13 source files, no build step, no external runtime dependencies.
- **Documentation:** [`PROJECT_REPORT.md`](PROJECT_REPORT.md) (full IOMP report — abstract, related work with 12 references, methodology, evaluation, limitations, ethics, appendices), [`README.md`](README.md) (developer overview), [`TaskGuard.md`](TaskGuard.md) (feature catalogue), [`PUBLISHING.md`](PUBLISHING.md) (distribution rationale and Load-Unpacked install guide).
- **Distribution.** Intentionally unpublished on the Chrome Web Store; distributed via GitHub and installed with Chrome's *Load Unpacked* developer flow. This avoids the informed-consent gap that would otherwise arise from anonymous end-user data collection and keeps the artifact fully auditable.

---

*Project author: P. Geetheswar Reddy — IOMP, Department of Computer Science. Open-source artifact; happy to extend, refactor, or open to external contribution under a permissive licence.*
