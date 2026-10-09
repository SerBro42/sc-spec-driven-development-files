# SQLite Foundation, Susan Data Model, and JSX/CSS Layout — Requirements

## Goal

Complete Nano Phase 2 of the AgentClinic roadmap by adding local SQLite persistence and server-rendered create/list workflows for agents, ailments, and therapies, within a reusable, responsive clinic page layout.

## Scope

- Configure local SQLite access in the existing TypeScript, Node.js, and Hono application.
- Initialize the database schema from the application in an idempotent way and enforce foreign-key constraints.
- Persist agents with a generated identifier and a name.
- Persist ailments with a generated identifier, name, and description.
- Persist therapies with a generated identifier, name, and description.
- Model agent-to-ailment and ailment-to-therapy relationships as many-to-many relationships.
- Provide server-rendered HTML pages and forms using Hono JSX to create and list agents, create and list an agent's ailments, and create and retrieve therapies for an ailment.
- Support associating an existing ailment with another agent and an existing therapy with another ailment, in addition to creating new related records.
- Render the clinic pages through a shared layout with separate header, main, and footer sections.
- Use PicoCSS for consistent styling of clinic pages and forms, with minimal project-specific CSS where needed to keep the interface usable on narrow and wide screens.
- Give users clear feedback for invalid input and references to unknown agents, ailments, or therapies.
- Add focused tests for database initialization, persistence, relationship behavior, and the relevant routes.

## Out of scope

- Booking records, appointment scheduling, or booking status workflows.
- The full agent dashboard and booking details described in later roadmap phases.
- Authentication, authorization, deployment, or a remote database service.
- A client-side application framework or JSON API.
- Seed data, bulk import, or unrelated visual redesign of the home page.

## Decisions

- **Database:** Use SQLite with a Node.js-compatible library. Persist data locally; keep runtime database files out of version control.
- **Schema setup:** Initialize the application's schema safely on startup so a fresh database is ready and a restart does not destroy existing data.
- **Relationships:** Use join tables for agents and ailments, and for ailments and therapies. Enforce references with SQLite foreign keys and avoid duplicate links.
- **Baseline fields:** Agents have a name; ailments and therapies each have a name and description. Generate stable identifiers for records. Names are required; descriptions may be empty.
- **Routes and UX:** Use server-rendered HTML `GET` pages and form `POST` submissions, not JSON endpoints. Forms must allow both creating a related record and linking an existing one where applicable.
- **Errors:** Preserve entered form values when practical and show a clear, user-readable error for invalid submissions or unknown referenced records; do not report failed writes as successful.
- **Presentation:** Reuse the shared Hono JSX layout and use PicoCSS for the clinic interface, supplemented by minimal project-specific CSS as needed. Maintain a clear header, main content, and footer with responsive behavior.
- **Feature boundary:** Implement only Nano Phase 2 from the roadmap. The next booking phase remains out of scope.

## Context

The [roadmap](../roadmap.md) defines Nano Phase 2 as the SQLite foundation, agent/ailment/therapy data model and routes, and a reusable JSX/CSS layout. Its acceptance criteria require persisted records with correct relationships and a readable interface across mobile and desktop widths.

The [mission](../mission.md) calls for a dependable, approachable clinic experience for agents and staff. The [tech-stack guidance](../tech-stack.md) recommends TypeScript, Node.js, Hono with server-rendered JSX, SQLite, Vitest, and responsive CSS. This phase uses PicoCSS to provide the clinic interface's baseline styling, with minimal custom CSS for product-specific needs. It builds on the completed Nano Phase 1 home page and leaves booking and dashboard workflows for later phases.
