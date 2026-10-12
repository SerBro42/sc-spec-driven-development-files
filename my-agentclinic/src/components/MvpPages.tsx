import type { DatabaseSync } from 'node:sqlite';

import {
  listAilmentsForTherapy,
  listAgents,
  listBookings,
  listTherapies,
} from '../database';
import type { Booking, BookingStatus } from '../database';
import { Layout } from './Layout';

type BookingFormProps = {
  database: DatabaseSync;
  error?: string;
  agentId?: string;
  therapyId?: string;
  appointmentTime?: string;
};

const bookingStatuses: BookingStatus[] = ['scheduled', 'completed', 'cancelled'];

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
