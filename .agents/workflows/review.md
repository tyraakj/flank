# Project Review Workflow

Review the implementation of one numbered unit without broadening scope.

## Review Sequence

1. **Inspect Full Diff**: Inspect every file modified, created, or deleted.
2. **Compare Against Spec**: Compare each change against the unit spec (`context/specs/<unit>-*.md`) and approved architecture.
3. **Audit Invariants & Code Standards**:
   - No hardcoded outputs or fake return values.
   - No unauthorized mocks of business logic.
   - No fake or skipped tests counted as passing.
   - No type/lint suppression (`@ts-ignore`, `any` casts).
   - No silent error swallowing.
   - Strict deployable boundaries (`apps/app` vs `apps/worker` via `@flank/shared`).
4. **Execute Verification Commands**: Run automated tests and workspace typechecks.
5. **Classify Findings**:
   - **Blocker**: Invented behavior, missing acceptance evidence, out-of-scope code, audit failure, unverified contracts, broken prerequisites.
   - **Warning**: Non-blocking observations or potential design considerations for the project owner.
   - **Pass**: Fully meets specification and verification gates.
6. **Report to Project Owner**: Present structured findings. Do not make autonomous completion or certification claims; the project owner decides acceptance and freezing.
