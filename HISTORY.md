# Repository Change History

Running log of file and structure changes. Append-only; the past remains.

## 2026-04-05 — Cursor rules: flat `.cursor/rules/`

- **Moved:** All `*.mdc` files from `.cursor/rules/website-marketing/` and `.cursor/rules/general-formatting/` into `.cursor/rules/` (same names).
- **Added:** `.cursor/rules/README.md` — grouped index (dev, website & marketing, general formatting).
- **Updated:** `command-site.mdc`, `readme.md`, `WEBSITE-ONLY-PROJECT-EXPORT.md` — paths and references.
- **Removed:** Empty `website-marketing/` and `general-formatting/` subfolders.

## 2026-03-16 — Defer removed; Task Queue UX; backtest + PDFs

- **Backtest:** Central smoke 15/15 PASS (`Dev/central/tests/smoke/run-all-smoke.ps1`).
- **PDFs:** All project PDFs regenerated (`npm run build:all-pdfs`) — Product_Vision_Map, Dev_Workflow_Practices, Central_Architecture_Map, Central_Platform_Complete_Roadmap, Central_Complete_Map_Layman + Technical, Competitor_Shortcomings.
- **Updated:** `Dev/central/BACKEND-LOG.md` — Entry for 2026-03-16 (defer removal, Task Queue In progress button, remove assignee fix, due date in row middle).
- **Defer removal:** task-queue.js/css, tasks-api, log-activity.ts, nl-search-parse, activity-log.js/css; migration 055_remove_deferred_status.sql.
- **Task Queue:** In progress button, remove-assignee (type=button, stopPropagation, toasts), due date block in row middle (large text).

## 2026-03-09 — Browser verification + doc sync

- **Updated:** `Dev/central/PRIORITY-ORDERED-GUIDE.md` — Browser verification complete in Critical Path
- **Updated:** `Dev/central/CENTRAL-MAP.md` — Browser verification status in roadmap
- **Updated:** `Dev/central/CONFIGURABLE-DATA-PLAN.md` — Browser verification in phase table
- **Updated:** `Dev/central/OPTION-LISTS-SEQUENTIAL-PLAN.md` — Step 9 marked complete
- **Updated:** `Dev/central/BACKEND-LOG.md` — Entry for 2026-03-09 browser verification
- **Updated:** `Dev/central/DOCUMENTATION-INDEX.md` — Version history, Last Updated
- **Updated:** `.cursor/rules/terminal-flows.mdc` — Browser URL convention (full URLs only), verification flow (earlier session)

## 2026-03-03 — command-log

- **Added:** `prompts-main/commands/command-log.md` — command for `@command-log` that summarizes BACKEND-LOG, syncs FULL-STACK-MAP (PDF manual source), and regenerates PDF if applicable
- **Updated:** `.cursor/rules/commands.mdc` — Log & PDF sync section; `prompts-main/commands/README.md` — Files + History
- **Updated:** `Dev/central/BACKEND-LOG.md` — Session entry for deploy, env, test fixes, command-log
- **Updated:** `Dev/central/FULL-STACK-MAP.md` — central_* table names, Phase 1 done status, migration 005

## README updates

_(Run `npm run update-readmes` to log changes when files are added or removed.)_
- 2026-03-10 10:54:50: .cursor/rules — Added: natural-language-scheduling.mdc
- 2026-03-10 10:54:50: Dev/central — Added: ACTIVITY-LOG-AND-ROLES-VISION.md, C6-BACKEND-AUDIT.md
- 2026-03-10 10:54:50: Dev/central/Modules/applications/analytics/frontend/staff-facing — Added: config.js
- 2026-03-10 10:54:50: Dev/central/supabase/migrations — Added: 024_tasks.sql, 025_seed_task_rules.sql, 026_tasks_overdue_cron.sql, 027_tasks_completed_index.sql, 028_tasks_lifecycle.sql, 029_tasks_lifecycle_cron.sql, 030_fix_tasks_status_constraint.sql, 031_activity_log.sql, 032_roles.sql, 033_seed_roles.sql
- 2026-03-13 07:01:28: .cursor/rules — Added: master-test-runner.mdc, phase-backtest-gate.mdc, platform-independence.mdc, rollback-protocol.mdc
- 2026-03-13 07:01:28: Dev/central — Added: BILLING-IMPLEMENTATION-PLAN.md
- 2026-03-13 07:01:28: Dev/central/competition — Added: BILLING-ADVANTAGES.md, COMPETITOR-SHORTCOMINGS.md, Competitor_Shortcomings.pdf
- 2026-03-13 07:01:28: Dev/central/supabase/migrations — Added: 034_smart_search.sql
- 2026-03-13 09:18:43: .cursor/rules — Added: form-ux.mdc, smart-search-pattern.mdc
- 2026-03-13 09:18:43: Dev/central — Added: ACTIVITY-LOG-NATURAL-LANGUAGE-PROBLEMS.md, ACTIVITY-LOG-PARSER-IMPLEMENTATION-PLAN.md, C7-DASHBOARD-VISION.md, CENTRAL-REVISED-ROADMAP.md, FORMS-DOMAIN-MAP.md, HIERARCHY-AND-PERMISSIONS-PLAN.md, LIVE-TEST-STEPS.md, PROJECT-ROADMAP-AND-CONTEXT.md, PROMPT-REVISE-ROADMAP.md, RESERVATIONS-SCHEMA.md, SMART-SEARCH.md, TASK-QUEUE-LIVE-TEST.md
- 2026-03-13 09:18:43: Dev/central/docs — Added: ADR-001-SMART-SEARCH.md
- 2026-03-13 09:18:43: Dev/central/supabase/migrations — Added: 037_lookup_permission_and_staff.sql, 038_update_lookup_module_description.sql, 039_get_role_users.sql
- 2026-03-13 09:18:43: Dev/central/tests — Added: phone-utils-test.js, smart-search-test.js
- 2026-03-13 09:18:43: scripts/build — Added: build-central-platform-roadmap-pdf.js
- 2026-03-13 09:54:12: Dev/central — Added: Central_Platform_Complete_Roadmap.pdf
- 2026-03-14 10:00:07: .cursor/rules — Added: frontend-module-patterns.mdc, iframe-sandbox.mdc
- 2026-03-14 10:00:07: Dev/central/supabase/migrations — Added: 040_task_categories.sql
- 2026-03-14 10:00:07: Dev/central/tests — Added: nl-parser-test.js
- 2026-03-16 10:59:54: .cursor/rules — Added: archive-then-delete-permanent.mdc, category-editor-ux.mdc, compliance.mdc, context-aware-pages.mdc, date-range-inclusive.mdc, department-before-category.mdc, lead-member-column.mdc, machine-local-time-required.mdc, model-selection.mdc, test-samples-required.mdc
- 2026-03-16 10:59:54: Dev/central — Added: ACTIVITY-LOG-TWO-HUBS-PLAN.md, API-HARDENING.md, API-REFERENCE.md, COMPLIANCE-ARCHITECTURE.md, COMPLIANCE-CALIFORNIA.md, DEBUG-AUDIT-CONSISTENCY.md, MANUAL-FRONTEND-TEST.md, NEXT-COURSE-OF-ACTION.md, OBSERVABILITY.md, PLAN-MDC-ALIGNED.md, RUNBOOK.md
- 2026-03-16 10:59:54: Dev/central/scripts — Added: deploy-production.ps1, deploy-staging.ps1
- 2026-03-16 10:59:54: Dev/central/supabase/functions/parse-due-date — Added: index.ts
- 2026-03-16 10:59:54: Dev/central/supabase/functions/variables-admin — Added: index.ts
- 2026-03-16 10:59:54: Dev/central/supabase/functions/variables-read — Added: index.ts
- 2026-03-16 10:59:54: Dev/central/supabase/migrations — Added: 041_notifications.sql, 042_user_notifications.sql, 043_rename_notifications_to_system_alerts.sql, 044_fix_escalation_stacking.sql, 045_tasks_one_per_form_submission.sql, 046_schema_versions.sql, 047_rate_limit_guardrails.sql, 048_admin_variables.sql, 049_record_type_member_id.sql, 050_task_assignments_and_grants.sql, 051_category_department_link.sql, 052_departments_active.sql, 053_seed_departments_for_clubs_with_none.sql, 054_cleanup_orphan_categories.sql, 055_remove_deferred_status.sql
- 2026-03-17 10:22:57: .cursor/rules — Added: MDC-FRAMEWORK.md, archive-then-delete-permanent.mdc, category-editor-ux.mdc, central-priority-enforcement.mdc, central-row-actions.mdc, change-validation.mdc, claude-audit-feed.mdc, commands.mdc, compliance.mdc, context-aware-pages.mdc, context-discipline.mdc, crm-integration-patterns.mdc, date-range-inclusive.mdc, department-before-category.mdc, department-first-hierarchy.mdc, dev-laws.mdc, form-ux.mdc, frontend-module-patterns.mdc, human-only.mdc, iframe-sandbox.mdc, lead-member-column.mdc, live-update-static-screen.mdc, machine-local-time-required.mdc, master-test-runner.mdc, model-selection.mdc, modern-saas-ux-standards.mdc, natural-language-scheduling.mdc, no-inline-horizontal-scroll.mdc, other-option-tracking.mdc, phase-backtest-gate.mdc, platform-independence.mdc, product-vision.mdc, progress-summary.mdc, project-identity.mdc, project-style-guide.mdc, rls-enforcement.mdc, rollback-protocol.mdc, sams-rules.mdc, save-next-to-section.mdc, self-display-me.mdc, smart-search-pattern.mdc, staff-configurable-data.mdc, staff-display-full-name.mdc, supabase-project-ref.mdc, terminal-flows.mdc, test-samples-required.mdc, testing.mdc, ui-interaction-guards.mdc, universal-base.mdc
- 2026-03-17 10:22:57: .cursor/rules/website-marketing — Added: Creative-Mode.mdc, cta-formatting.mdc, dynamic-image-carousel.mdc, header-subheader-centering.mdc, pickleball-carousel-source-of-truth.mdc
- 2026-03-17 10:22:57: Dev/central — Added: ADMIN-SETTINGS-STRUCTURE-MAP.md, AI-CONTEXT.md, ASSIGNMENT-RULES-AND-ADMIN-SETTINGS-MAP.md, BACKEND-TO-FRONTEND-MAP.md, DEPARTMENT-FIRST-HIERARCHY.md, HORIZONTAL-SCROLL-AUDIT-FINAL.md, MDC-COMPLIANCE-AUDIT.md, MODERN-SAAS-UX-BACKTEST.md, PHASE-2-FRONTEND-AUDIT.md
- 2026-03-17 10:22:57: Dev/central/docs — Added: HOW-TO-APPLY-NODE-MAP.md, node-map-connectors.js, node-map-design.mdc, node-map.css
- 2026-03-17 10:22:57: Dev/central/shared/css — Added: node-map.css
- 2026-03-17 10:22:57: Dev/central/shared/js — Added: node-map-connectors.js, node-map-connectors.readme
- 2026-03-17 10:22:57: Dev/central/supabase/migrations — Added: 056_get_club_staff_full_name.sql, 057_add_assign_permission_to_roles.sql, 058_backfill_unassigned_tasks.sql, 059_tasks_department_index.sql, 060_option_lists_department.sql
- 2026-03-19 05:58:51: .cursor/rules/website-marketing — Added: command-site.mdc
- 2026-03-19 05:58:51: Dev/central — Added: P13-PHASE-COMPLETE.md, PHASE-PROMPT-TEMPLATE.md
- 2026-03-19 05:58:51: Dev/central/resources — Added: Dev_Concepts.pdf
- 2026-03-19 09:28:22: Dev/central — Added: P14-COMPLETE-STEPS.md, P14-DEPLOYMENT-STAGING-PLAN.md, P14-VERIFICATION-SUMMARY.md
- 2026-03-19 09:31:39: .cursor/rules — Added: central-pdfs.mdc
- 2026-03-19 09:31:39: Dev/central/pdfs — Added: BACKEND-LOG.pdf, BUILD-ORDER.pdf, CENTRAL-MAP.pdf, DOCUMENTATION-INDEX.pdf, OPTION-LISTS-SEQUENTIAL-PLAN.pdf, PRIORITY-ORDERED-GUIDE.pdf, START-HERE.pdf, TODO.pdf
- 2026-03-19 09:31:39: Dev/central/resources — Added: Dev_Concepts.pdf
- 2026-03-20 07:35:01: Dev/central/pdfs — Added: Central_Architecture_Map.pdf, Central_Complete_Map_Layman.pdf, Central_Complete_Map_Technical.pdf, Central_Platform_Complete_Roadmap.pdf, Competitor_Shortcomings.pdf, Dev_Concepts.pdf
- 2026-03-20 07:35:01: Dev/central/scripts — Added: lint-migrations.ps1, lint-migrations.sh
- 2026-03-20 08:28:01: Dev/central/scripts — Added: Update-DevConcepts.ps1, apply-009-manually.readme, apply-009-manually.sql, deploy-production.ps1, deploy-staging.ps1, lint-migrations.ps1, lint-migrations.sh, verify-no-forbidden-env-files.ps1, verify-no-forbidden-env-files.sh

