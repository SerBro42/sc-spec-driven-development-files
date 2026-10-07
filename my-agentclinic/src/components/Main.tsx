import type { FC, PropsWithChildren } from 'hono/jsx';

export const Main: FC<PropsWithChildren> = ({ children }) => (
  <main class="site-main">{children}</main>
);
