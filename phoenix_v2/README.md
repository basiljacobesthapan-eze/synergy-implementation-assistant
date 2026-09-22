# PHOENIX v0.5

Working React/Vite prototype — Implementation Readiness Control Tower for Workday implementations.

Run:
1. `npm install`
2. `npm run dev`
3. Open the local URL shown by Vite.

## What's in this build

**1. Editable country selection (source of truth)**
- Searchable multi-select on Project Setup — add, remove, Select All / Clear All.
- Selected countries now drive: Master Data analysis, the Organization Designer, Business Process
  comparison, the Impact Analyzer and Test Design. Records/steps outside the selected scope are
  clearly called out (not silently hidden, not hard-coded).

**2. Organization Designer**
- Infers supervisory-org hierarchy from uploaded master data (manager-of-manager recursion).
- Visual expand/collapse chart *and* a flat List view (Sup Org / Manager / Parent / Workers / Status).
- Exceptions: missing manager, manager not found, multiple possible heads, circular hierarchy,
  unresolved parent.
- Consultant can override a node's manager and parent org; overrides are layered on top of the
  inferred structure and can be reset.

**3. Organization Visualizer** *(new)*
- A dedicated, printable/exportable org chart, separate from the Org Designer's editable tree —
  same inferred hierarchy (manager → employee → their manager's own sup org, recursively), drawn
  top-down with connector lines.
- Every proposed sup org that can be placed is drawn; zoom in/out, "fit to screen", and pan (scroll)
  around large structures.
- Click any box to see its manager, parent and worker population in a side panel, with a shortcut
  back into Org Designer to fix it.
- Search finds an org or manager and highlights matching boxes in place.
- **Data gaps, explained per-organization**: any sup org that can't be connected — no manager
  identified, manager not found as an employee, parent unresolved, or part of a circular reporting
  chain — is listed separately with the specific reason, including orgs stuck lower down because an
  *ancestor* org is the actual problem. Fix the underlying master data (or an Org Designer override)
  and the chart updates automatically.
- Export the chart as a standalone SVG or PNG image to share outside the tool.

**5. Implementation Impact Analyzer**
- What-if scenario (add country / add module / change population / mark a process changed) vs. the
  current baseline.
- Transparent, rule-based explanations — no invented AI scores.
- Shows which roadmap activities, test-coverage areas, config/data areas, and already-generated test
  cases may need review.

**6. AI Test Design**
- Structured test cases: ID, Business Process, Scenario, Country, Module, Preconditions, Test Data,
  Steps, Expected Result, Priority, Test Type, Test Phase.
- Select test types (Unit/SIT/E2E/UAT/Regression), phase, and which in-scope countries to generate for.
- Generates organization-aware scenarios (e.g. "Transfer employee from X to Y") straight from the
  inferred org hierarchy.
- Cases matching the current Impact Analyzer scenario are flagged "Impacted" for review/regeneration.

**7. Editable Gantt**
- Preserves the 12-week parallel-workstream baseline; scales with duration.
- Add/remove activities, milestones (diamond marker) and buffers (striped bar); edit start/end,
  owner, dependency and notes per row.
- Dependency validation: flags any activity that starts before the activity it depends on finishes
  (built-in: UAT after E2E, Final Readiness after UAT, Go-Live after Final Readiness) without
  silently accepting the conflict.

**8. Business Process Analyzer / Optimizer**
- Upload current-state process steps (Excel/CSV) across many processes and countries.
- Compare view: common/global steps vs. country-specific variations per process, with explained
  optimization suggestions (never auto-applied).
- Global Standardization View: a top-to-bottom flow of the common process plus a column of
  country-specific additions, to help decide what to standardize.

## Data handling

- Flexible column-name matching for uploads (aliases per field); missing/invalid data is reported,
  never invented.
- Transactional analysis only appears when transaction columns are actually present.
- Sample/demo data is clearly labeled as such.
