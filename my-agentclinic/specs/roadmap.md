# Roadmap

Deliver AgentClinic in a sequence of Nano phases. Each phase contains 1–3 focused feature slices, is independently testable, and should take no more than one day. Treat the checks below as acceptance criteria, not extra feature slices; split a phase if its scope grows beyond a day.

## Nano Phase 1: Hello Hono

**Status:** Complete

**Feature slices**
- Scaffold the TypeScript and Node.js project with Hono.
- Add a server-rendered `GET /` home page using a layout with separate header, main, and footer components.
- Link and serve the home page stylesheet with a responsive, mobile-friendly layout.

**Acceptance:** The app starts locally, `GET /` returns the expected AgentClinic HTML page, and its linked stylesheet is served successfully. The layout remains readable and usable on narrow and wide screens, the Vitest route tests pass via the project validation script, and the production build passes.

## Nano Phase 2: SQLite foundation, Susan data model, and JSX/CSS layout

**Feature slices**
- Configure local SQLite access.
- Initialize the database from an application schema setup.
- Define the agent data model and SQLite table.
- Add routes to create and list agents.
- Define ailments and their relationship to agents.
- Add routes to create and list an agent’s ailments.
- Define therapy options and associate them with ailments.
- Add routes to create and retrieve therapies for an ailment.
- Build a reusable JSX layout for the clinic pages with clear header, main, and footer sections.
- Add consistent CSS styling for the dashboard and clinic pages, including responsive spacing and layout behavior.

**Acceptance:** The app opens the configured database and initializes its schema successfully; agent, ailment, and therapy records can be created and retrieved from SQLite with the correct relationships and filtering; the page layout renders cleanly via JSX and the CSS keeps the clinic interface readable and usable across mobile and desktop widths.

## Nano Phase 3: Susan — Booking records

**Feature slices**
- Define the booking data model, including its agent, therapy, time, and status.
- Persist bookings in SQLite with the required relationships.

**Acceptance:** A booking can be saved and retrieved with its associated agent and therapy.

## Nano Phase 4: Susan — Booking workflow

**Feature slices**
- Add a route to create a booking with input validation.
- Add routes to list bookings and update their supported status.

**Acceptance:** Valid bookings and status changes persist; invalid submissions receive clear errors.

## Nano Phase 5: Mary — Dashboard

**Feature slices**
- Add a dashboard page that lists agents and links to their details.
- Show an agent’s ailments, related therapies, and bookings.

**Acceptance:** The dashboard presents the persisted clinic data and handles empty lists and unknown agent IDs.

## Nano Phase 6: Steve — Polish

**Feature slices**
- Apply consistent visual styling to dashboard and booking pages.
- Make the main clinic workflow responsive for narrow and wide screens, with layout adjustments that keep forms, content, and actions usable on phones and desktops.

**Acceptance:** The core workflow remains readable and usable at both small and large viewport sizes, and the layout adapts without breaking the user experience.

## Nano Phase 7: Hardening

**Feature slices**
- Add focused tests for the main routes and booking workflow.
- Handle expected database and request errors with clear responses.
- Verify the complete clinic workflow from local startup through booking status update.

**Acceptance:** Tests pass and the end-to-end workflow completes without unhandled errors.
