# AgentClinic MVP — Plan

1. **[x] Inspect and extend the therapy catalog**
   - Reuse the existing therapy model, SQLite schema, and ailment-therapy relationships.
   - Add or complete idempotent starter therapy data for supported ailments.
   - Provide a server-rendered catalog view alongside retrieval by ailment.
   - Add focused tests for catalog contents, ailment filtering, and repeat-safe initialization.

2. **[x] Implement persisted appointment bookings**
   - Add an ordered SQLite migration and typed data access for bookings, with foreign keys to agents and therapies.
   - Store an ISO-8601 appointment time and one of the supported statuses: `scheduled`, `completed`, or `cancelled`.
   - Add server-rendered booking creation, listing, and status-update routes/forms.
   - Validate required fields, appointment time, status, and referenced agent/therapy IDs; render clear errors without reporting failed writes as successful.
   - Add tests for persistence, associations, valid creation and status updates, and invalid or unknown references.

3. **[x] Build the agent dashboard**
   - Make `/dashboard` distinct from `/agents`, with summary counts for total agents, scheduled appointments, and distinct ailments linked to agents.
   - Add read-only staff tables for agents, ailments, therapies, and appointments, with links to existing record workflows and appointment status controls.
   - Keep an agent's ailments, related therapies, and bookings on the agent detail view; render useful empty states and a clear response for an unknown agent ID.
   - Add route tests for summary count definitions, populated tables, empty data, and unknown IDs.

4. **[x] Polish the clinic workflow**
   - Integrate catalog, booking, dashboard, and existing clinic navigation through the shared JSX layout.
   - Apply consistent styling to dashboard and booking pages using existing project patterns.
   - Adjust responsive layout and controls so the workflow remains usable at narrow and wide viewport sizes.

5. **[x] Harden and verify the end-to-end MVP**
   - Handle expected database and request failures with clear responses, preserving existing error-handling conventions.
   - Add or complete focused route and workflow tests from catalog access through booking status update.
   - Run the project validation script and production build.
   - Smoke-test the application with persisted data and review responsive behavior at mobile and desktop widths.
   - Confirm completed Nano Phase 1/2 behavior remains intact and runtime SQLite data is not tracked.
