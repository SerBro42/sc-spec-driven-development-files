import type { DatabaseSync } from 'node:sqlite';

import {
  getDashboardSummary,
  listAgents,
  listAgentsForAilment,
  listAilments,
  listAilmentsForAgent,
  listAilmentsForTherapy,
  listBookings,
  listTherapies,
} from '../database';
import type { Booking, BookingStatus, DashboardSummary } from '../database';
import { Layout } from './Layout';

type BookingFormProps = {
  database: DatabaseSync;
  error?: string;
  agentId?: string;
  therapyId?: string;
  appointmentTime?: string;
};

const bookingStatuses: BookingStatus[] = ['scheduled', 'completed', 'cancelled'];

const SummaryCard = ({ label, value }: { label: string; value: number }) => (
  <article class="summary-card">
    <p>{label}</p>
    <strong>{value}</strong>
  </article>
);

export const Dashboard = ({ database }: { database: DatabaseSync }) => {
  const summary: DashboardSummary = getDashboardSummary(database);
  const agents = listAgents(database);
  const ailments = listAilments(database);
  const therapies = listTherapies(database);
  const bookings = listBookings(database);

  return (
    <Layout>
      <h1>AgentClinic dashboard</h1>
      <p>Clinic-wide caseload and appointment overview for staff.</p>
      <section class="summary-grid" aria-label="Clinic summary">
        <SummaryCard label="Agents" value={summary.agents} />
        <SummaryCard label="Open appointments" value={summary.openAppointments} />
        <SummaryCard label="Ailments in-flight" value={summary.ailmentsInFlight} />
      </section>

      <section aria-labelledby="dashboard-agents-heading">
        <h2 id="dashboard-agents-heading">Agents</h2>
        <p><a href="/agents">Create an agent</a></p>
        {agents.length ? (
          <div class="table-scroll">
            <table>
              <caption>Clinic agents and their linked ailments</caption>
              <thead>
                <tr><th scope="col">Agent</th><th scope="col">Ailments</th><th scope="col">Record</th></tr>
              </thead>
              <tbody>
                {agents.map((agent) => {
                  const agentAilments = listAilmentsForAgent(database, agent.id);
                  return (
                    <tr key={agent.id}>
                      <th scope="row">{agent.name}</th>
                      <td>{agentAilments.length ? agentAilments.map((ailment) => ailment.name).join(', ') : 'None linked'}</td>
                      <td><a href={`/agents/${agent.id}`}>View details</a></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No agents are available. <a href="/agents">Create the first agent</a>.</p>
        )}
      </section>

      <section aria-labelledby="dashboard-ailments-heading">
        <h2 id="dashboard-ailments-heading">Ailments</h2>
        {ailments.length ? (
          <div class="table-scroll">
            <table>
              <caption>Ailments in the clinic caseload</caption>
              <thead>
                <tr><th scope="col">Ailment</th><th scope="col">Description</th><th scope="col">Linked agents</th><th scope="col">Record</th></tr>
              </thead>
              <tbody>
                {ailments.map((ailment) => {
                  const linkedAgents = listAgentsForAilment(database, ailment.id);
                  return (
                    <tr key={ailment.id}>
                      <th scope="row">{ailment.name}</th>
                      <td>{ailment.description || 'No description provided.'}</td>
                      <td>{linkedAgents.length ? linkedAgents.map((agent) => agent.name).join(', ') : 'None linked'}</td>
                      <td><a href={`/ailments/${ailment.id}`}>View details</a></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No ailments are available yet.</p>
        )}
      </section>

      <section aria-labelledby="dashboard-therapies-heading">
        <h2 id="dashboard-therapies-heading">Therapies</h2>
        {therapies.length ? (
          <div class="table-scroll">
            <table>
              <caption>Available therapies and their supported ailments</caption>
              <thead>
                <tr><th scope="col">Therapy</th><th scope="col">Description</th><th scope="col">Ailments</th><th scope="col">Record</th></tr>
              </thead>
              <tbody>
                {therapies.map((therapy) => {
                  const supportedAilments = listAilmentsForTherapy(database, therapy.id);
                  return (
                    <tr key={therapy.id}>
                      <th scope="row">{therapy.name}</th>
                      <td>{therapy.description || 'No description provided.'}</td>
                      <td>{supportedAilments.length ? supportedAilments.map((ailment) => ailment.name).join(', ') : 'None linked'}</td>
                      <td><a href={`/therapies#therapy-${therapy.id}`}>View details</a></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No therapies are available yet. Add one from an ailment record.</p>
        )}
      </section>

      <section aria-labelledby="dashboard-appointments-heading">
        <h2 id="dashboard-appointments-heading">Appointments</h2>
        <p><a href="/bookings/new">Book an appointment</a></p>
        {bookings.length ? (
          <div class="table-scroll">
            <table>
              <caption>Scheduled, completed, and cancelled appointments</caption>
              <thead>
                <tr><th scope="col">Agent</th><th scope="col">Therapy</th><th scope="col">Appointment time</th><th scope="col">Status</th><th scope="col">Update</th></tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr id={`booking-${booking.id}`} key={booking.id}>
                    <th scope="row"><a href={`/agents/${booking.agentId}`}>{booking.agentName}</a></th>
                    <td><a href={`/therapies#therapy-${booking.therapyId}`}>{booking.therapyName}</a></td>
                    <td><time dateTime={booking.appointmentTime}>{booking.appointmentTime}</time></td>
                    <td>{booking.status}</td>
                    <td>
                      <form class="table-status-form" method="post" action={`/bookings/${booking.id}/status`}>
                        <label class="visually-hidden" for={`dashboard-booking-status-${booking.id}`}>Status for appointment {booking.id}</label>
                        <select id={`dashboard-booking-status-${booking.id}`} name="status" required>
                          {bookingStatuses.map((status) => (
                            <option value={status} selected={booking.status === status}>{status}</option>
                          ))}
                        </select>
                        <button type="submit">Save</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No appointments have been booked yet.</p>
        )}
      </section>
    </Layout>
  );
};

export const TherapyCatalog = ({ database }: { database: DatabaseSync }) => {
  const therapies = listTherapies(database);
  return (
    <Layout>
      <h1>Therapy catalog</h1>
      <p>Explore care options available across the clinic.</p>
      {therapies.length ? (
        <div class="grid">
          {therapies.map((therapy) => {
            const ailments = listAilmentsForTherapy(database, therapy.id);
            return (
              <article id={`therapy-${therapy.id}`} key={therapy.id}>
                <h2>{therapy.name}</h2>
                {therapy.description ? <p>{therapy.description}</p> : <p>No description provided.</p>}
                <h3>For ailments</h3>
                {ailments.length ? (
                  <ul>
                    {ailments.map((ailment) => (
                      <li key={ailment.id}>
                        <a href={`/ailments/${ailment.id}`}>{ailment.name}</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>This therapy is not linked to an ailment yet.</p>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <p>No therapies are available yet. Add a therapy from an ailment page.</p>
      )}
    </Layout>
  );
};

export const BookingForm = ({
  database,
  error,
  agentId = '',
  therapyId = '',
  appointmentTime = '',
}: BookingFormProps) => {
  const agents = listAgents(database);
  const therapies = listTherapies(database);
  return (
    <Layout>
      <h1>Book an appointment</h1>
      {error ? <p role="alert">{error}</p> : null}
      {!agents.length || !therapies.length ? (
        <p>
          Bookings need an agent and a therapy. Add an agent and make a therapy available before
          continuing.
        </p>
      ) : (
        <form method="post" action="/bookings">
          <label for="booking-agent">Agent</label>
          <select id="booking-agent" name="agentId" required>
            <option value="">Choose an agent</option>
            {agents.map((agent) => (
              <option value={agent.id} selected={agentId === String(agent.id)}>
                {agent.name}
              </option>
            ))}
          </select>
          <label for="booking-therapy">Therapy</label>
          <select id="booking-therapy" name="therapyId" required>
            <option value="">Choose a therapy</option>
            {therapies.map((therapy) => (
              <option value={therapy.id} selected={therapyId === String(therapy.id)}>
                {therapy.name}
              </option>
            ))}
          </select>
          <label for="appointment-time">Appointment time (ISO-8601)</label>
          <input
            id="appointment-time"
            name="appointmentTime"
            type="text"
            required
            placeholder="2026-10-12T10:00:00Z"
            pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]+)?(Z|[+][0-9]{2}:[0-9]{2}|-[0-9]{2}:[0-9]{2})"
            value={appointmentTime}
          />
          <p class="field-hint">Include seconds and a timezone, for example the Z suffix for UTC.</p>
          <button type="submit">Create booking</button>
        </form>
      )}
      <p>
        <a href="/bookings">View all bookings</a>
      </p>
    </Layout>
  );
};

const BookingRow = ({ booking }: { booking: Booking }) => (
  <article id={`booking-${booking.id}`}>
    <h2>{booking.therapyName}</h2>
    <p>
      Agent: <a href={`/agents/${booking.agentId}`}>{booking.agentName}</a>
    </p>
    <p>
      Appointment: <time dateTime={booking.appointmentTime}>{booking.appointmentTime}</time>
    </p>
    <p>Status: {booking.status}</p>
    <form method="post" action={`/bookings/${booking.id}/status`}>
      <label for={`booking-status-${booking.id}`}>Update status</label>
      <select id={`booking-status-${booking.id}`} name="status" required>
        {bookingStatuses.map((status) => (
          <option value={status} selected={booking.status === status}>
            {status}
          </option>
        ))}
      </select>
      <button type="submit">Save status</button>
    </form>
  </article>
);

export const BookingList = ({
  bookings,
  error,
}: {
  bookings: Booking[];
  error?: string;
}) => (
  <Layout>
    <h1>Appointments</h1>
    {error ? <p role="alert">{error}</p> : null}
    <p>
      <a href="/bookings/new" role="button">
        Book an appointment
      </a>
    </p>
    {bookings.length ? (
      <div class="grid">
        {bookings.map((booking) => <BookingRow booking={booking} key={booking.id} />)}
      </div>
    ) : (
      <p>No appointments have been booked yet.</p>
    )}
  </Layout>
);

export const BookingListPage = ({ database }: { database: DatabaseSync }) => (
  <BookingList bookings={listBookings(database)} />
);
