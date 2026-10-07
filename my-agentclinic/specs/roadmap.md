# Roadmap

Deliver AgentClinic in exactly 10 Nano phases. Each phase contains 1–3 focused feature slices, is independently testable, and should take no more than one day. Treat the checks below as acceptance criteria, not extra feature slices; split a phase if its scope grows beyond a day.

## Nano Phase 1: Hello Hono

**Status:** Complete

**Feature slices**
- Scaffold the TypeScript and Node.js project with Hono.
- Add a server-rendered `GET /` home page using a layout with separate header, main, and footer components.
- Link and serve the home page stylesheet.

**Acceptance:** The app starts locally, `GET /` returns the expected AgentClinic HTML page, and its linked stylesheet is served successfully. Focused route tests and the production build pass.

## Nano Phase 2: SQLite foundation

**Feature slices**
- Configure local SQLite access.
- Initialize the database from an application schema setup.

**Acceptance:** The app opens the configured database and initializes its schema successfully.

## Nano Phase 3: Susan — Agents

**Feature slices**
- Define the agent data model and SQLite table.
- Add routes to create and list agents.

**Acceptance:** Agent records can be created and retrieved from SQLite.

## Nano Phase 4: Susan — Ailments

**Feature slices**
- Define ailments and their relationship to agents.
- Add routes to create and list an agent’s ailments.

**Acceptance:** Ailments persist and are returned only for their associated agent.

## Nano Phase 5: Susan — Therapies

**Feature slices**
- Define therapy options and associate them with ailments.
- Add routes to create and retrieve therapies for an ailment.

**Acceptance:** An ailment returns only its associated therapy options.

## Nano Phase 6: Susan — Booking records

**Feature slices**
- Define the booking data model, including its agent, therapy, time, and status.
- Persist bookings in SQLite with the required relationships.

**Acceptance:** A booking can be saved and retrieved with its associated agent and therapy.

## Nano Phase 7: Susan — Booking workflow

**Feature slices**
- Add a route to create a booking with input validation.
- Add routes to list bookings and update their supported status.

**Acceptance:** Valid bookings and status changes persist; invalid submissions receive clear errors.

## Nano Phase 8: Mary — Dashboard

**Feature slices**
- Add a dashboard page that lists agents and links to their details.
- Show an agent’s ailments, related therapies, and bookings.

**Acceptance:** The dashboard presents the persisted clinic data and handles empty lists and unknown agent IDs.

## Nano Phase 9: Steve — Polish

**Feature slices**
- Apply consistent visual styling to dashboard and booking pages.
- Make the main clinic workflow responsive for narrow and wide screens.

**Acceptance:** The core workflow remains readable and usable at both viewport sizes.

## Nano Phase 10: Hardening

**Feature slices**
- Add focused tests for the main routes and booking workflow.
- Handle expected database and request errors with clear responses.
- Verify the complete clinic workflow from local startup through booking status update.

**Acceptance:** Tests pass and the end-to-end workflow completes without unhandled errors.
