# AgentClinic MVP — Requirements

## Goal

Complete a demonstrable AgentClinic MVP that lets staff review the existing agent and ailment data, explore a reusable therapy catalog, book appointments, and track the clinic workflow from a responsive dashboard.

## Scope

This feature work completes the unfinished roadmap features after Nano Phase 2:

- **Nano Phase 3 — Therapies Catalog**
  - Provide a catalog view of persisted therapies as well as retrieval by ailment.
  - Seed reusable starter therapies for supported ailments without duplicating existing records or links.
- **Nano Phase 4 — Appointment Booking**
  - Persist bookings associated with an agent and a therapy, with an appointment time and status.
  - Provide server-rendered flows to create bookings, list them, and update their status.
  - Validate input and referenced records and return clear errors for invalid submissions.
- **Nano Phase 5 — Dashboard**
  - Give `/dashboard` a clinic-wide summary distinct from the `/agents` list, with counts for agents, open appointments, and ailments in-flight.
  - Count open appointments as bookings with `scheduled` status; count ailments in-flight as distinct ailments linked to one or more agents.
  - Present read-only staff tables for agents, ailments, therapies, and appointments, with links to existing create/detail workflows and appointment status controls.
  - Keep each agent's ailments, related therapies, and bookings on the agent detail page; handle empty data and unknown agent IDs clearly.
- **Nano Phase 6 — Polish**
  - Style dashboard and booking pages consistently with the existing clinic interface.
  - Keep forms, content, navigation, and actions readable and usable on narrow and wide screens.
- **Nano Phase 7 — Hardening**
  - Add focused route and booking-workflow tests.
  - Handle expected request and database errors with clear responses.
  - Verify the end-to-end workflow through a booking status update.

## Out of scope

- Authentication, authorization, user accounts, or role management.
- Remote database services, deployment, or production hosting configuration.
- Replacing the existing server-rendered Hono JSX application or adding a client-side framework.
- New agent, ailment, or therapy authoring capabilities beyond what Nano Phase 2 already provides.
- Features not listed in the roadmap MVP scope.

## Decisions

- **MVP feature boundary:** Include the remaining roadmap functionality for the therapies catalog, appointment booking, dashboard, responsive polish, and hardening. Existing Nano Phase 1 and 2 functionality is the foundation, not work to recreate.
- **Existing therapy capability:** Nano Phase 2 already defines and persists therapies and supports retrieval for an ailment. The catalog work should build on this implementation and add the roadmap's catalog-wide view and starter catalog data as needed, avoiding duplicate data models or routes.
- **Booking data:** A booking has an identifier and references an existing agent and therapy; it also stores an ISO-8601 appointment time and a status.
- **Booking statuses:** Support `scheduled`, `completed`, and `cancelled`. Provide the roadmap's status-update workflow for these values. Do not impose additional status-transition rules unless required by existing repository conventions.
- **Dashboard counts:** "Open appointments" means bookings whose current status is `scheduled`. "Ailments in-flight" means the distinct ailments currently linked to at least one agent, independent of booking status.
- **Dashboard tables:** The dashboard tables are read-only for agent, ailment, therapy, and appointment details. Use links to the existing record views and create flows rather than adding inline edit/delete capabilities; retain appointment status updates in the appointments table.
- **Persistence:** Use the existing SQLite setup, schema migration conventions, data-access patterns, and foreign-key relationships. Booking records must survive application restart.
- **Web experience:** Keep the existing Hono server-rendered HTML/JSX patterns and shared clinic layout. Use the existing styling approach and add only the CSS needed for consistent responsive dashboard and booking pages.
- **Errors and empty states:** Invalid booking input and references to unknown agents or therapies must produce clear user-facing errors and must not create a booking. Empty catalog, booking, and agent views, and unknown dashboard agent IDs, must be handled clearly.
- **Validation:** Use the existing Vitest and project validation/build scripts. Add tests focused on the new routes, relationships, status updates, error behavior, and complete clinic workflow.

## Context

The [roadmap](../roadmap.md) marks Nano Phases 1 and 2 complete. Phase 2 already establishes the Hono/TypeScript application, SQLite persistence, migrations, agent/ailment/therapy relationships, related create/list routes, and a shared JSX/CSS layout. This MVP spec covers the remaining roadmap slices, Phases 3–7, without repeating completed foundation work.

The [mission](../mission.md) calls for a dependable, approachable clinic experience for agents and staff, with a dashboard for ailments, therapies, and scheduling. The [tech-stack guidance](../tech-stack.md) recommends Node.js, TypeScript, Hono server-rendered JSX, SQLite, Vitest, and responsive CSS. The completed [Hello Hono requirements](../2026-10-07-hello-hono/requirements.md) and [Nano Phase 2 requirements](../2026-10-09-sqlite-foundation-susan-data-model-jsx-css-layout/requirements.md) establish implementation and validation conventions for this work.
