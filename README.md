# fhir-seam

**Local-first patient intake form with a FHIR mock endpoint as the seam.**

Prototype 3 in the [Systems of Thought](https://systemsofthought.com) local-first prototype series, following the AI Governance Window Tracker and [checkout-seam](https://github.com/jediwright/checkout-seam).

**Live demo:** https://fhir-seam.vercel.app  
**Canonical repo:** https://github.com/jediwright/fhir-seam  
**Placeholder repo (search routing):** https://github.com/jediwright/local-first-healthcare  

---

## The Architectural Argument

checkout-seam proved that local-first architecture works for commerce — every operation ran offline from local IndexedDB except one: the single server-dependent operation at the seam boundary. fhir-seam proves the same argument in a higher-stakes domain and introduces a harder version of the seam problem.

```
client (Y.js/IndexedDB) ──FHIR Bundle POST──▶ mock EHR (stateless) ──▶ client (Y.js/IndexedDB)
```

The server is stateless. The client owns the record. If the POST fails, the intake bundle is preserved locally and the failure is surfaced legibly. The server is never consulted again after a successful submission.

**What's harder than checkout-seam:**

- **Write-before-POST:** The FHIR bundle is written to IndexedDB before the network request fires. The patient cannot lose their data to a failed or interrupted POST.
- **Format translation:** Local state must be translated into FHIR R4 (Patient + QuestionnaireResponse) before crossing the seam.
- **Richer failure taxonomy:** 200 (accepted) / 422 (validation error, retryable) / 503 (transient, retryable) / 500 (permanent failure, contact clinic) — each with appropriate UI and clinical language.
- **Higher stakes:** In commerce, failure means try again. In healthcare, failure means a clinical record was not received by the provider.

---

## Stack

- **Vite + React + Tailwind** — same scaffold as checkout-seam
- **Y.js + y-indexeddb** — all form state lives in IndexedDB, persists across browser restarts
- **FHIR R4** — Patient + QuestionnaireResponse bundle construction as a pure function
- **Vercel serverless** — stateless mock FHIR endpoint, no database writes

---

## Data Model

```
doc.getMap('intake')      → live form state, written on every field change (no save button)
doc.getMap('profile')     → patient identity + Y.Array submission_history
doc.getMap('submissions') → keyed by client UUID; full FHIR bundle + status + timestamps
```

---

## Build Phases

| Phase | What | Status |
|---|---|---|
| 1 | Scaffold + Data Model | ✓ Complete |
| 2 | Intake Form UI | ✓ Complete |
| 3 | FHIR Bundle Construction | ✓ Complete |
| 4 | Mock FHIR Endpoint | ✓ Complete |
| 5 | Submission State Machine | ✓ Complete |
| 6 | Deployment | ✓ Complete |

---

## Patterns

**The high-stakes seam** — Where the server-dependent operation writes into a system you don't control, failure has real consequences, and local-first architecture is the thing that guarantees data preservation when the seam fails.

**Write-before-POST** — Write the full payload to local state before firing the network request. The client can never lose data to a failed or interrupted POST.

**FHIR Bundle construction as a pure function** — Isolate data format translation (local state → external system format) into a pure function with no network calls or side effects. Makes the mapping auditable and testable.

**`attachArrayObserver()` pattern** — Applied from the start (learned from checkout-seam). Handles stale Y.Array references after y-indexeddb hydration.

---

## Known Limitations

- Mobile responsive layout not implemented
- Real EHR integration out of scope (requires OAuth credentialing)
- Provider-facing view out of scope (patient side only)
- PDF export of completed intake noted as a future feature

---

## License

MIT — Jedi Wright / Systems of Thought  
AI-assisted research and analysis: Claude Sonnet 4.6 / Anthropic
