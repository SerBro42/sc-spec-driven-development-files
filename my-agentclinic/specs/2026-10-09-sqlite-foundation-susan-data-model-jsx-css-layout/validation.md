# SQLite Foundation, Susan Data Model, and JSX/CSS Layout — Validation

## Automated checks

- The project validation script (`npm run validate` or `npm test`) passes.
- The production TypeScript build completes successfully.
- Database initialization creates the required tables on a fresh local database and is safe to repeat without losing persisted records.
- Data tests verify agent, ailment, and therapy creation and retrieval.
- Relationship tests verify that:
  - an agent's ailment list contains only ailments linked to that agent;
  - an ailment's therapy list contains only therapies linked to that ailment;
  - an ailment can be linked to multiple agents and a therapy to multiple ailments;
  - unknown foreign keys are rejected and duplicate relationship links are not created.
- Route tests verify the relevant HTML pages, create/list form submissions, and rendered related records.
- Route tests verify clear error responses for invalid required fields and unknown record IDs.
- The clinic layout loads PicoCSS and uses its baseline styling for semantic page elements and form controls; custom CSS remains limited to project-specific needs.

## Manual acceptance checks

1. Start the application using its development command and confirm startup initializes the local database.
2. Open the server-rendered agent page, create an agent, and confirm it appears in the list after the response and after restarting the server.
3. Create an ailment for that agent and confirm the agent's ailment view lists it.
4. Link the same ailment to a second agent and confirm it appears for both agents.
5. Create a therapy for the ailment, then link that therapy to another ailment and confirm it is retrievable for both.
6. Submit a blank required name and an unknown record ID; confirm neither creates an invalid record and the page clearly explains the problem.
7. Review the clinic pages and forms at narrow mobile and wide desktop viewport sizes; confirm PicoCSS is applied and the header, main content, footer, and controls remain readable and usable.

## Merge criteria

- All automated checks and the production build pass.
- The manual persistence and relationship checks succeed.
- No booking, dashboard, authentication, or other later-phase workflow is introduced.
- Runtime SQLite data is not added to version control.
