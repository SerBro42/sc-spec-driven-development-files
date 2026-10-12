import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import type { DatabaseSync } from 'node:sqlite';

import {
  createAgent,
  createAilmentForAgent,
  createBooking,
  createTherapyForAilment,
  getAgent,
  getAilment,
  getBooking,
  getTherapy,
  linkAilmentToAgent,
  linkTherapyToAilment,
  listAgents,
  listAilments,
  listAilmentsForAgent,
  listBookings,
  listBookingsForAgent,
  listTherapies,
  listTherapiesForAgent,
  listTherapiesForAilment,
  updateBookingStatus,
} from './database';
import type { BookingStatus } from './database';
import { Layout } from './components/Layout';
import {
  BookingForm,
  BookingList,
  BookingListPage,
  Dashboard,
  TherapyCatalog,
} from './components/MvpPages';

type FormData = Record<string, string | File | (string | File)[]>;

type AgentListProps = {
  database: DatabaseSync;
  error?: string;
  name?: string;
};

type AgentDetailsProps = {
  database: DatabaseSync;
  agentId: number;
  ailmentError?: string;
  ailmentName?: string;
  ailmentDescription?: string;
};

type AilmentDetailsProps = {
  database: DatabaseSync;
  ailmentId: number;
  therapyError?: string;
  therapyName?: string;
  therapyDescription?: string;
};

const MAX_NAME_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;

function formValue(form: FormData, key: string): string {
  const value = form[key];
  return typeof value === 'string' ? value.trim() : '';
}

function parseId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function parseAppointmentTime(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return null;
  }
  const datePart = value.slice(0, 10);
  const parsedDate = new Date(`${datePart}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== datePart) {
    return null;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

function isBookingStatus(value: string): value is BookingStatus {
  return value === 'scheduled' || value === 'completed' || value === 'cancelled';
}

function messagePage(title: string, message: string) {
  return (
    <Layout>
      <h1>{title}</h1>
      <p role="alert">{message}</p>
      <p>
        <a href="/agents">Return to agents</a>
      </p>
    </Layout>
  );
}

const AgentList = ({ database, error, name = '' }: AgentListProps) => {
  const agents = listAgents(database);
  return (
    <Layout>
      <h1>Agents</h1>
      <p>Choose an agent to review their ailments and explore care options.</p>
      {error ? <p role="alert">{error}</p> : null}
      <section aria-labelledby="agent-list-heading">
        <h2 id="agent-list-heading">Clinic agents</h2>
        {agents.length ? (
          <ul>
            {agents.map((agent) => (
              <li key={agent.id}>
                <a href={`/agents/${agent.id}`}>{agent.name}</a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No agents yet. Add the first agent to get started.</p>
        )}
      </section>
      <article>
        <h2>Add an agent</h2>
        <form method="post" action="/agents">
          <label for="agent-name">Name</label>
          <input id="agent-name" name="name" required maxlength={MAX_NAME_LENGTH} value={name} />
          <button type="submit">Create agent</button>
        </form>
      </article>
    </Layout>
  );
};

const AgentDetails = ({
  database,
  agentId,
  ailmentError,
  ailmentName = '',
  ailmentDescription = '',
}: AgentDetailsProps) => {
  const agent = getAgent(database, agentId);
  if (!agent) {
    return messagePage('Agent not found', 'This agent does not exist.');
  }

  const ailments = listAilmentsForAgent(database, agentId);
  const allAilments = listAilments(database);
  const therapies = listTherapiesForAgent(database, agentId);
  const bookings = listBookingsForAgent(database, agentId);
  return (
    <Layout>
      <p>
        <a href="/agents">← All agents</a>
      </p>
      <h1>{agent.name}</h1>
      {ailmentError ? <p role="alert">{ailmentError}</p> : null}
      <section aria-labelledby="ailment-list-heading">
        <h2 id="ailment-list-heading">Ailments</h2>
        {ailments.length ? (
          <ul>
            {ailments.map((ailment) => (
              <li key={ailment.id}>
                <a href={`/ailments/${ailment.id}`}>{ailment.name}</a>
                {ailment.description ? <p>{ailment.description}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No ailments are linked to this agent yet.</p>
        )}
      </section>
      <section aria-labelledby="agent-therapy-heading">
        <h2 id="agent-therapy-heading">Related therapies</h2>
        {therapies.length ? (
          <ul>
            {therapies.map((therapy) => (
              <li key={therapy.id}>
                <a href={`/therapies#therapy-${therapy.id}`}>{therapy.name}</a>
                {therapy.description ? <p>{therapy.description}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No therapies are available for this agent's ailments yet.</p>
        )}
        <p>
          <a href="/therapies">Browse the therapy catalog</a>
        </p>
      </section>
      <section aria-labelledby="agent-bookings-heading">
        <h2 id="agent-bookings-heading">Appointments</h2>
        {bookings.length ? (
          <ul>
            {bookings.map((booking) => (
              <li key={booking.id}>
                <strong>{booking.therapyName}</strong> —{' '}
                <time dateTime={booking.appointmentTime}>{booking.appointmentTime}</time> (
                {booking.status})
              </li>
            ))}
          </ul>
        ) : (
          <p>No appointments are booked for this agent yet.</p>
        )}
        <p>
          <a href="/bookings/new">Book an appointment</a>
        </p>
      </section>
      <section class="grid">
        <article>
          <h2>Add an ailment</h2>
          <form method="post" action={`/agents/${agentId}/ailments`}>
            <input type="hidden" name="mode" value="create" />
            <label for="ailment-name">Name</label>
            <input
              id="ailment-name"
              name="name"
              required
              maxlength={MAX_NAME_LENGTH}
              value={ailmentName}
            />
            <label for="ailment-description">Description (optional)</label>
            <textarea
              id="ailment-description"
              name="description"
              rows={3}
              maxlength={MAX_DESCRIPTION_LENGTH}
            >
              {ailmentDescription}
            </textarea>
            <button type="submit">Create and link ailment</button>
          </form>
        </article>
        <article>
          <h2>Link an existing ailment</h2>
          {allAilments.length ? (
            <form method="post" action={`/agents/${agentId}/ailments`}>
              <input type="hidden" name="mode" value="link" />
              <label for="existing-ailment">Ailment</label>
              <select id="existing-ailment" name="ailmentId" required>
                <option value="">Choose an ailment</option>
                {allAilments.map((ailment) => (
                  <option value={ailment.id}>{ailment.name}</option>
                ))}
              </select>
              <button type="submit">Link ailment</button>
            </form>
          ) : (
            <p>Create the first ailment above; it will be linked to this agent.</p>
          )}
        </article>
      </section>
    </Layout>
  );
};

const AilmentDetails = ({
  database,
  ailmentId,
  therapyError,
  therapyName = '',
  therapyDescription = '',
}: AilmentDetailsProps) => {
  const ailment = getAilment(database, ailmentId);
  if (!ailment) {
    return messagePage('Ailment not found', 'This ailment does not exist.');
  }

  const therapies = listTherapiesForAilment(database, ailmentId);
  const allTherapies = listTherapies(database);
  return (
    <Layout>
      <p>
        <a href="/agents">← All agents</a>
      </p>
      <h1>{ailment.name}</h1>
      {ailment.description ? <p>{ailment.description}</p> : <p>No description provided.</p>}
      {therapyError ? <p role="alert">{therapyError}</p> : null}
      <section aria-labelledby="therapy-list-heading">
        <h2 id="therapy-list-heading">Therapies</h2>
        {therapies.length ? (
          <ul>
            {therapies.map((therapy) => (
              <li key={therapy.id}>
                <strong>{therapy.name}</strong>
                {therapy.description ? <p>{therapy.description}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No therapies are linked to this ailment yet.</p>
        )}
      </section>
      <section class="grid">
        <article>
          <h2>Add a therapy</h2>
          <form method="post" action={`/ailments/${ailmentId}/therapies`}>
            <input type="hidden" name="mode" value="create" />
            <label for="therapy-name">Name</label>
            <input
              id="therapy-name"
              name="name"
              required
              maxlength={MAX_NAME_LENGTH}
              value={therapyName}
            />
            <label for="therapy-description">Description (optional)</label>
            <textarea
              id="therapy-description"
              name="description"
              rows={3}
              maxlength={MAX_DESCRIPTION_LENGTH}
            >
              {therapyDescription}
            </textarea>
            <button type="submit">Create and link therapy</button>
          </form>
        </article>
        <article>
          <h2>Link an existing therapy</h2>
          {allTherapies.length ? (
            <form method="post" action={`/ailments/${ailmentId}/therapies`}>
              <input type="hidden" name="mode" value="link" />
              <label for="existing-therapy">Therapy</label>
              <select id="existing-therapy" name="therapyId" required>
                <option value="">Choose a therapy</option>
                {allTherapies.map((therapy) => (
                  <option value={therapy.id}>{therapy.name}</option>
                ))}
              </select>
              <button type="submit">Link therapy</button>
            </form>
          ) : (
            <p>Create the first therapy above; it will be linked to this ailment.</p>
          )}
        </article>
      </section>
    </Layout>
  );
};

export function createApp(database: DatabaseSync): Hono {
  const app = new Hono();

  app.onError((error, c) => {
    console.error('AgentClinic request failed:', error);
    return c.html(
      messagePage('Clinic error', 'The clinic could not complete your request. Please try again.'),
      500,
    );
  });

  app.use('/styles.css', serveStatic({ root: './public' }));
  app.use('/pico.min.css', serveStatic({ root: './node_modules/@picocss/pico/css' }));

  app.get('/', (c) => c.html(<Layout />));
  app.get('/dashboard', (c) => c.html(<Dashboard database={database} />));
  app.get('/agents', (c) => c.html(<AgentList database={database} />));
  app.post('/agents', async (c) => {
    const form = await c.req.parseBody();
    const name = formValue(form, 'name');
    if (!name) {
      return c.html(
        <AgentList database={database} error="Enter a name before creating an agent." name={name} />,
        400,
      );
    }
    if (name.length > MAX_NAME_LENGTH) {
      return c.html(
        <AgentList
          database={database}
          error={`Agent names must be ${MAX_NAME_LENGTH} characters or fewer.`}
          name={name}
        />,
        400,
      );
    }
    const agentId = createAgent(database, name);
    return c.redirect(`/agents/${agentId}`, 303);
  });

  app.get('/agents/:agentId', (c) => {
    const agentId = parseId(c.req.param('agentId'));
    if (agentId === null) {
      return c.html(messagePage('Agent not found', 'This agent does not exist.'), 404);
    }
    const page = <AgentDetails database={database} agentId={agentId} />;
    return c.html(page, getAgent(database, agentId) ? 200 : 404);
  });

  app.post('/agents/:agentId/ailments', async (c) => {
    const agentId = parseId(c.req.param('agentId'));
    if (agentId === null || !getAgent(database, agentId)) {
      return c.html(messagePage('Agent not found', 'This agent does not exist.'), 404);
    }

    const form = await c.req.parseBody();
    const mode = formValue(form, 'mode');
    if (mode === 'create') {
      const name = formValue(form, 'name');
      const description = formValue(form, 'description');
      if (!name) {
        return c.html(
          <AgentDetails
            database={database}
            agentId={agentId}
            ailmentError="Enter a name for the ailment."
            ailmentName={name}
            ailmentDescription={description}
          />,
          400,
        );
      }
      if (name.length > MAX_NAME_LENGTH) {
        return c.html(
          <AgentDetails
            database={database}
            agentId={agentId}
            ailmentError={`Ailment names must be ${MAX_NAME_LENGTH} characters or fewer.`}
            ailmentName={name}
            ailmentDescription={description}
          />,
          400,
        );
      }
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        return c.html(
          <AgentDetails
            database={database}
            agentId={agentId}
            ailmentError={`Ailment descriptions must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`}
            ailmentName={name}
            ailmentDescription={description}
          />,
          400,
        );
      }
      const ailmentId = createAilmentForAgent(
        database,
        agentId,
        name,
        description,
      );
      return c.redirect(`/ailments/${ailmentId}`, 303);
    }
    if (mode === 'link') {
      const ailmentId = parseId(formValue(form, 'ailmentId'));
      if (ailmentId === null) {
        return c.html(messagePage('Invalid ailment', 'Choose an existing ailment.'), 400);
      }
      if (!getAilment(database, ailmentId)) {
        return c.html(messagePage('Ailment not found', 'This ailment does not exist.'), 404);
      }
      linkAilmentToAgent(database, agentId, ailmentId);
      return c.redirect(`/agents/${agentId}`, 303);
    }
    return c.html(messagePage('Invalid request', 'Choose whether to create or link an ailment.'), 400);
  });

  app.get('/ailments/:ailmentId', (c) => {
    const ailmentId = parseId(c.req.param('ailmentId'));
    if (ailmentId === null) {
      return c.html(messagePage('Ailment not found', 'This ailment does not exist.'), 404);
    }
    const page = <AilmentDetails database={database} ailmentId={ailmentId} />;
    return c.html(page, getAilment(database, ailmentId) ? 200 : 404);
  });

  app.post('/ailments/:ailmentId/therapies', async (c) => {
    const ailmentId = parseId(c.req.param('ailmentId'));
    if (ailmentId === null || !getAilment(database, ailmentId)) {
      return c.html(messagePage('Ailment not found', 'This ailment does not exist.'), 404);
    }

    const form = await c.req.parseBody();
    const mode = formValue(form, 'mode');
    if (mode === 'create') {
      const name = formValue(form, 'name');
      const description = formValue(form, 'description');
      if (!name) {
        return c.html(
          <AilmentDetails
            database={database}
            ailmentId={ailmentId}
            therapyError="Enter a name for the therapy."
            therapyName={name}
            therapyDescription={description}
          />,
          400,
        );
      }
      if (name.length > MAX_NAME_LENGTH) {
        return c.html(
          <AilmentDetails
            database={database}
            ailmentId={ailmentId}
            therapyError={`Therapy names must be ${MAX_NAME_LENGTH} characters or fewer.`}
            therapyName={name}
            therapyDescription={description}
          />,
          400,
        );
      }
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        return c.html(
          <AilmentDetails
            database={database}
            ailmentId={ailmentId}
            therapyError={`Therapy descriptions must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`}
            therapyName={name}
            therapyDescription={description}
          />,
          400,
        );
      }
      createTherapyForAilment(
        database,
        ailmentId,
        name,
        description,
      );
      return c.redirect(`/ailments/${ailmentId}`, 303);
    }
    if (mode === 'link') {
      const therapyId = parseId(formValue(form, 'therapyId'));
      if (therapyId === null) {
        return c.html(messagePage('Invalid therapy', 'Choose an existing therapy.'), 400);
      }
      if (!getTherapy(database, therapyId)) {
        return c.html(messagePage('Therapy not found', 'This therapy does not exist.'), 404);
      }
      linkTherapyToAilment(database, ailmentId, therapyId);
      return c.redirect(`/ailments/${ailmentId}`, 303);
    }
    return c.html(messagePage('Invalid request', 'Choose whether to create or link a therapy.'), 400);
  });

  app.get('/therapies', (c) => c.html(<TherapyCatalog database={database} />));

  app.get('/bookings', (c) =>
    c.html(<BookingListPage database={database} />),
  );

  app.get('/bookings/new', (c) => c.html(<BookingForm database={database} />));

  app.post('/bookings', async (c) => {
    const form = await c.req.parseBody();
    const agentIdValue = formValue(form, 'agentId');
    const therapyIdValue = formValue(form, 'therapyId');
    const appointmentTimeValue = formValue(form, 'appointmentTime');
    const agentId = parseId(agentIdValue);
    const therapyId = parseId(therapyIdValue);
    const appointmentTime = parseAppointmentTime(appointmentTimeValue);
    const values = {
      agentId: agentIdValue,
      therapyId: therapyIdValue,
      appointmentTime: appointmentTimeValue,
    };

    if (agentId === null || therapyId === null) {
      return c.html(
        <BookingForm
          database={database}
          error="Choose an existing agent and therapy."
          {...values}
        />,
        400,
      );
    }
    if (!getAgent(database, agentId)) {
      return c.html(
        <BookingForm database={database} error="The selected agent does not exist." {...values} />,
        404,
      );
    }
    if (!getTherapy(database, therapyId)) {
      return c.html(
        <BookingForm database={database} error="The selected therapy does not exist." {...values} />,
        404,
      );
    }
    if (appointmentTime === null) {
      return c.html(
        <BookingForm
          database={database}
          error="Enter a valid ISO-8601 appointment time with a timezone."
          {...values}
        />,
        400,
      );
    }

    const bookingId = createBooking(database, agentId, therapyId, appointmentTime);
    return c.redirect(`/bookings#booking-${bookingId}`, 303);
  });

  app.post('/bookings/:bookingId/status', async (c) => {
    const bookingId = parseId(c.req.param('bookingId'));
    if (bookingId === null || !getBooking(database, bookingId)) {
      return c.html(messagePage('Appointment not found', 'This appointment does not exist.'), 404);
    }

    const form = await c.req.parseBody();
    const status = formValue(form, 'status');
    if (!isBookingStatus(status)) {
      return c.html(
        <BookingList
          bookings={listBookings(database)}
          error="Choose a supported appointment status: scheduled, completed, or cancelled."
        />,
        400,
      );
    }

    updateBookingStatus(database, bookingId, status);
    return c.redirect(`/bookings#booking-${bookingId}`, 303);
  });

  return app;
}
