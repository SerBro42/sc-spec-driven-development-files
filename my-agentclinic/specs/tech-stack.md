# Tech Stack

AgentClinic will use a server-side TypeScript stack, with Node.js as the runtime. The server will render HTML for a modern, responsive browser experience.

## Recommended framework: Hono

Hono is the recommended server framework for AgentClinic. It is lightweight, TypeScript-first, and provides server-side JSX rendering without requiring a separate client-side UI framework. Its composable middleware and support for Node.js make it a good fit for the clinic's routes and demo-friendly deployment.

## Recommended stack

- TypeScript for application logic and type safety.
- Node.js to run the server-side application.
- Hono for routing, middleware, and server-rendered HTML using Hono JSX.
- SQLite for local, reliable persistence of agents, ailments, therapies, and appointments.
- Vitest for automated validation and fast test execution during development.
- Plain CSS with responsive, mobile-friendly layouts for a polished browser experience.
- A simple app structure that supports fast iteration while staying easy to explain in demos and course materials.

## Validation approach

- Use Vitest as the standard test runner for validation across application logic and route behavior.
- Keep validation lightweight and fast so the team can run automated checks regularly during development.
- Verify the UI remains readable and usable across typical mobile and desktop viewport sizes.
- Use the package script to execute the suite in a consistent, repeatable way.

## Why this stack

- TypeScript gives us a popular, familiar language for engineering teams and AI coding workflows.
- Hono keeps server-side routing and rendering lightweight while providing a clear TypeScript-first developer experience.
- Server-rendered HTML avoids the overhead of a separate client-side framework for the dashboard.
- SQLite fits the product needs for a simple, reliable data store without unnecessary operational complexity.
- The stack remains approachable for students and conference demos while still being production-ready enough for a real product foundation.
