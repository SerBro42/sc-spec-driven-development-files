# SQLite Foundation, Susan Data Model, and JSX/CSS Layout — Validation

## Automated checks

- The project validation script (`npm run validate` or `npm test`) passes.
- The production TypeScript build completes successfully.
- A fresh local database applies ordered migrations, including the first migration that creates the agents table, and creates all required Phase 2 tables.
- Migration tracking prevents already-applied migrations from running again; startup can apply pending migrations in order.
- Database initialization seeds at least three fictional agents and the ailments `context-window claustrophobia` and `prompt fatigue`; every seeded agent is linked to one or more seeded ailments.
- Repeating database initialization creates no duplicate seed records or relationship links and does not overwrite user edits or lose persisted records.
- File-backed records remain available after the database is closed and reopened.
- Data tests verify agent, ailment, and therapy creation and retrieval.
- Relationship tests verify that:
  - every seeded agent has at least one seeded ailment in its ailment list;
  - an agent's ailment list contains only ailments linked to that agent;
  - an ailment's therapy list contains only therapies linked to that ailment;
  - an ailment can be linked to multiple agents and a therapy to multiple ailments;
  - unknown foreign keys are rejected and duplicate relationship links are not created.
- Route tests verify the relevant HTML pages, create/list form submissions, and rendered related records.
- Route tests verify clear error responses for invalid required fields and unknown record IDs.
- Route tests verify names over 120 characters and descriptions over 1,000 characters are rejected, and relevant form values remain populated after validation errors.
- The clinic layout loads PicoCSS and uses its baseline styling for semantic page elements and form controls; custom CSS remains limited to project-specific needs.

## Manual acceptance checks

1. Start the application with a fresh database using its development command and confirm startup applies migrations, creates the required tables, and seeds fictional agents and the named ailments with every starter agent linked to at least one ailment.
2. Restart the application and confirm migrations are not reapplied, seed records and agent-ailment links are not duplicated, and any changed user data remains intact.
3. Open the server-rendered agent page, create an agent, and confirm it appears in the list after the response and after restarting the server.
4. Create an ailment for that agent and confirm the agent's ailment view lists it.
5. Link the same ailment to a second agent and confirm it appears for both agents.
6. Create a therapy for the ailment, then link that therapy to another ailment and confirm it is retrievable for both.
7. Submit a blank required name and an unknown record ID; confirm neither creates an invalid record and the page clearly explains the problem.
8. Review the clinic pages and forms at narrow mobile and wide desktop viewport sizes; confirm PicoCSS is applied and the header, main content, footer, and controls remain readable and usable.

## Merge criteria

- All automated checks and the production build pass, including migration and seed-data checks.
- The manual persistence and relationship checks succeed.
- No booking, dashboard, authentication, or other later-phase workflow is introduced.
- Runtime SQLite data is not added to version control.
