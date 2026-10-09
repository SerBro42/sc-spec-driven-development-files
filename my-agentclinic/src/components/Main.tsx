import type { FC, PropsWithChildren } from 'hono/jsx';

type MainProps = PropsWithChildren;

export const Main: FC<MainProps> = ({ children }) => (
  <main class="container site-main">{children}</main>
);
