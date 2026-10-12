# AgentClinic MVP — Validation

## Automated checks

- The repository's standard validation script (for example, `npm run validate` or `npm test`) passes.
- The production build completes successfully with TypeScript strict checking intact.
- Therapy catalog tests verify catalog-wide retrieval, retrieval by ailment, and idempotent starter data/relationships.
- Booking data and route tests verify:
  - a booking references an existing agent and therapy and persists its ISO-8601 appointment time and status;
  - bookings can be listed with their associated agent and therapy;
  - valid status updates persist for `scheduled`, `completed`, and `cancelled`;
  - invalid input, unsupported statuses, and unknown agent or therapy IDs produce clear errors and do not create or corrupt records.
- Dashboard route tests verify the agent list and detail view, including linked ailments, related therapies, bookings, empty states, and an unknown agent ID.
- Tests cover expected request and database errors without success-shaped responses or unhandled errors.
- Existing Nano Phase 1 and 2 tests continue to pass.

## Manual acceptance checks

1. Start the application using its documented development command and confirm the existing clinic pages continue to load.
2. Open the therapies catalog and confirm the seeded catalog is available; open an ailment's therapy view and confirm it shows only therapies associated with that ailment.
3. Open the dashboard and confirm agents link to detail views containing their ailments, related therapies, and bookings.
4. Create a booking for an existing agent and therapy with an ISO-8601 appointment time and `scheduled` status; confirm the booking appears in the booking list and the agent's dashboard detail.
5. Update the booking to `completed` and `cancelled` in turn and confirm each supported status is displayed and persisted after restarting the application.
6. Submit invalid booking values and unknown agent/therapy IDs; confirm no invalid booking is saved and a clear error is shown.
7. Review the catalog, dashboard, booking forms, lists, and actions at narrow mobile and wide desktop viewport sizes; confirm content and controls remain readable and usable.

## Merge criteria

- All automated checks and the production build pass.
- The manual catalog, dashboard, booking, status-update, and responsive checks succeed.
- The end-to-end clinic workflow completes without unhandled errors.
- No regressions are introduced to completed Nano Phase 1/2 behavior.
- Runtime SQLite data is not added to version control.
