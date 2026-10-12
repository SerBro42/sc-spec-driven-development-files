# SQLite Foundation, Susan Data Model, and JSX/CSS Layout — Plan

1. **Set up SQLite persistence**
   - Configure Node.js's built-in `node:sqlite` module for the existing TypeScript project (Node.js 22.5 or newer).
   - Open a local SQLite database and apply ordered, versioned migrations from the application.
   - Add the first migration to create the agents table; add the migrations required for the remaining Phase 2 schema.
   - Enable foreign-key enforcement and define tables for agents, ailments, therapies, and their many-to-many relationships.
   - Seed at least three fictional agents and the starter ailments `context-window claustrophobia` and `prompt fatigue`; link each seeded agent to one or more ailments.
   - Make migration and seed execution safe to repeat without duplicate seed records or relationship links, or overwriting existing user data.
   - Keep runtime database files out of version control.

2. **Implement clinic data operations and routes**
   - Add typed data access for creating and listing agents.
   - Add typed data access for creating and listing an agent's associated ailments.
   - Add typed data access for creating and retrieving therapies associated with an ailment.
   - Provide server-rendered `GET` pages and HTML `POST` forms for these operations using Hono JSX.
   - Allow existing ailments and therapies to be associated with additional parent records so both relationships work as many-to-many.
   - Validate required inputs and referenced IDs; render clear responses for invalid submissions or unknown records.

3. **Build the reusable clinic page layout**
   - Extend the shared JSX layout so clinic pages use distinct header, main, and footer sections.
   - Add navigation between agent, ailment, and therapy views where the relationships allow it.
   - Use PicoCSS to style the pages and forms consistently, adding minimal project-specific CSS as needed to preserve readability and usability on narrow and wide screens.

4. **Verify Nano Phase 2 acceptance**
   - Add focused automated coverage for migration ordering and repeat application, idempotent seed data and agent-ailment links, data operations, relationship filtering, and route responses.
   - Run the project validation script and production build.
   - Smoke-test fresh database initialization, seeded records, the server-rendered create/list flows, and the layout at mobile and desktop widths.
   - Confirm the implementation remains limited to Nano Phase 2; do not add booking or dashboard workflows.
