# SQLite Foundation, Susan Data Model, and JSX/CSS Layout — Plan

1. **Set up SQLite persistence**
   - Select and configure a Node.js-compatible SQLite library that fits the existing TypeScript project.
   - Open a local SQLite database and initialize its schema idempotently from the application.
   - Enable foreign-key enforcement and define tables for agents, ailments, therapies, and their many-to-many relationships.
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
   - Add focused automated coverage for schema initialization, data operations, relationship filtering, and route responses.
   - Run the project validation script and production build.
   - Smoke-test the server-rendered create/list flows and review the layout at mobile and desktop widths.
   - Confirm the implementation remains limited to Nano Phase 2; do not add booking or dashboard workflows.
