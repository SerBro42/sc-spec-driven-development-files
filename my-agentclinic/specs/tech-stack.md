# Tech Stack

AgentClinic will use a server-side TypeScript stack, with Node.js as the runtime. The server will render HTML for a modern, responsive browser experience.

## Recommended framework: Hono

Hono is the recommended server framework for AgentClinic. It is lightweight, TypeScript-first, and provides server-side JSX rendering without requiring a separate client-side UI framework. Its composable middleware and support for Node.js make it a good fit for the clinic's routes and demo-friendly deployment.

## Recommended stack

- TypeScript for application logic and type safety.
- Node.js to run the server-side application.
- Hono for routing, middleware, and server-rendered HTML using Hono JSX.
- SQLite for local, reliable persistence of agents, ailments, therapies, and appointments.
- Plain CSS for a polished, responsive browser experience.
- A simple app structure that supports fast iteration while staying easy to explain in demos and course materials.

## Why this stack

- TypeScript gives us a popular, familiar language for engineering teams and AI coding workflows.
- Hono keeps server-side routing and rendering lightweight while providing a clear TypeScript-first developer experience.
- Server-rendered HTML avoids the overhead of a separate client-side framework for the dashboard.
- SQLite fits the product needs for a simple, reliable data store without unnecessary operational complexity.
- The stack remains approachable for students and conference demos while still being production-ready enough for a real product foundation.
