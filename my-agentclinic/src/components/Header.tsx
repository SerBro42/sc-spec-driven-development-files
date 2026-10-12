export const Header = () => (
  <header class="site-header">
    <nav class="container" aria-label="Main navigation">
      <ul>
        <li>
          <a class="site-name" href="/" aria-label="AgentClinic home">
            AgentClinic
          </a>
        </li>
      </ul>
      <ul>
        <li>
          <a href="/dashboard">Dashboard</a>
        </li>
        <li>
          <a href="/agents">Agents</a>
        </li>
        <li>
          <a href="/therapies">Therapies</a>
        </li>
        <li>
          <a href="/bookings">Appointments</a>
        </li>
      </ul>
    </nav>
  </header>
);
