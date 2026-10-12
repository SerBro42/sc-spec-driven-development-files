import type { FC, PropsWithChildren } from 'hono/jsx';

import { Footer } from './Footer';
import { Header } from './Header';
import { Main } from './Main';

type LayoutProps = PropsWithChildren;

export const Layout: FC<LayoutProps> = ({ children }) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>AgentClinic</title>
      <link rel="stylesheet" href="/pico.min.css" />
      <link rel="stylesheet" href="/styles.css" />
    </head>
    <body>
      <Header />
      <Main>{children ?? <HomeContent />}</Main>
      <Footer />
    </body>
  </html>
);

const HomeContent = () => (
  <>
    <h1>AgentClinic</h1>
    <p>
      A calm place to review agent care, explore therapies, and manage appointments.
    </p>
    <p>
      <a href="/dashboard" role="button">
        Open the dashboard
      </a>
    </p>
  </>
);
