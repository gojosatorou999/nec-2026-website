import { useState } from 'react';
import { ArrowRight, Check, Inbox, KeyRound, MapPin, MessageSquare, Users } from 'lucide-react';
import { api } from './api.js';
import { Button, EmptyState, ErrorBox, Tag, TextField } from './ui.jsx';

const FEEDBACK_FIELDS = [
  ['overall', 'Overall'],
  ['problem', 'Problem it solves'],
  ['interesting', 'What stood out'],
  ['suggestions', 'Suggestions'],
  ['questions', 'Questions'],
];

/* Applicant-facing wording for each internal status. */
const STAGES = {
  Draft: { label: 'Draft', tone: '', step: 0, text: 'This application hasn’t been submitted yet.' },
  Submitted: {
    label: 'Under review',
    tone: 'amber',
    step: 1,
    text: 'We’ve received your application and it’s in the queue for the organizing team.',
  },
  'Under Review': {
    label: 'Under review',
    tone: 'amber',
    step: 1,
    text: 'The organizing team is reviewing your application now.',
  },
  Approved: {
    label: 'Accepted',
    tone: 'mint',
    step: 2,
    text: 'Your startup has been accepted and is listed in the expo showcase.',
  },
  Rejected: {
    label: 'Not selected',
    tone: 'red',
    step: 2,
    text: 'Your application wasn’t selected this time. Thank you for applying.',
  },
};
const stageOf = (status) => STAGES[status] || STAGES.Submitted;

function Progress({ status }) {
  const stage = stageOf(status);
  const steps = ['Submitted', 'Under review', status === 'Rejected' ? 'Not selected' : 'Accepted'];
  return (
    <ol className="ib-track-steps" aria-label="Application progress">
      {steps.map((label, i) => {
        const done = i < stage.step || (i === 2 && stage.step === 2);
        const current = i === stage.step && stage.step < 2;
        return (
          <li key={label} className={(done ? 'is-done' : '') + (current ? ' is-current' : '')}>
            <span className="ib-track-dot" aria-hidden="true">
              {done ? <Check size={12} strokeWidth={3} /> : null}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Result({ result }) {
  const stage = stageOf(result.status);
  return (
    <section className="ib-card ib-panel ib-status" aria-live="polite">
      <div className="ib-status-head">
        <div>
          <p className="eyebrow">{result.id}</p>
          <h2 className="ib-panel-title">{result.verified ? result.name : 'Your application'}</h2>
        </div>
        <Tag tone={stage.tone}>{stage.label}</Tag>
      </div>
      <Progress status={result.status} />
      <p className="ib-lede">{stage.text}</p>

      {!result.verified ? (
        <div className="ib-locked">
          <KeyRound size={18} aria-hidden="true" />
          <p>
            {result.codeProvided
              ? 'That access code doesn’t match this application, so your stall number and private feedback are hidden. Check the code you saved when you applied — it is 48 characters long.'
              : 'Add your private access code to see your stall number and the feedback left for your team.'}
          </p>
        </div>
      ) : (
        <>
          <div className="ib-status-facts">
            <div>
              <MapPin size={16} aria-hidden="true" />
              <span>{result.stall ? `Stall ${result.stall}` : 'Stall not assigned yet'}</span>
            </div>
            <div>
              <MessageSquare size={16} aria-hidden="true" />
              <span>
                {result.feedback.length} feedback {result.feedback.length === 1 ? 'note' : 'notes'}
              </span>
            </div>
            <div>
              <Users size={16} aria-hidden="true" />
              <span>
                {result.interests.length} join {result.interests.length === 1 ? 'request' : 'requests'}
              </span>
            </div>
          </div>
          <h3 className="ib-subtitle">Founder inbox</h3>
          {!result.feedback.length && !result.interests.length ? (
            <EmptyState icon={Inbox} title="No messages yet">
              Feedback from visitors and requests to join your team will appear here.
            </EmptyState>
          ) : (
            <div className="ib-inbox">
              {result.feedback.map((f) => (
                <article className="ib-inbox-item" key={f.id}>
                  <Tag>{f.visitorType} feedback</Tag>
                  <dl>
                    {FEEDBACK_FIELDS.map(([k, l]) =>
                      f[k] ? (
                        <div key={k}>
                          <dt>{l}</dt>
                          <dd>{f[k]}</dd>
                        </div>
                      ) : null
                    )}
                  </dl>
                </article>
              ))}
              {result.interests.map((i) => (
                <article className="ib-inbox-item" key={i.id}>
                  <Tag tone="mint">Wants to join</Tag>
                  <h4>{i.name}</h4>
                  {i.skills && <p>{i.skills}</p>}
                  {i.message && <p>{i.message}</p>}
                  <a href={'mailto:' + i.email}>{i.email}</a>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default function Status() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <div className="ib-split is-narrow">
      <form
        className="ib-card ib-panel ib-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          const d = Object.fromEntries(new FormData(e.target));
          const id = d.id.trim().toUpperCase();
          const token = d.token.trim().toLowerCase();
          try {
            setResult(
              await api('/applications/' + encodeURIComponent(id) + '/status', {
                headers: token ? { 'x-tracking-token': token } : {},
              })
            );
          } catch (err) {
            setResult(null);
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="ib-panel-title">Check your application</h2>
        <p className="ib-lede">Your reference shows where your application is. Add the access code to see your stall and private feedback.</p>
        <div className="ib-form-grid is-single">
          <TextField
            label="Application reference"
            name="id"
            placeholder="MGIT-…"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {/* Plain text, not a password field: browsers (iOS Safari especially)
              autofill saved passwords into password inputs, which silently
              replaced the code and made the lookup fail. */}
          <TextField
            label="Private access code"
            name="token"
            required={false}
            className="is-mono"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            hint="Paste the 48-character code from your confirmation."
          />
        </div>
        <ErrorBox message={error} />
        <Button primary disabled={busy} type="submit">
          {busy ? 'Checking…' : 'Check status'} <ArrowRight size={16} />
        </Button>
      </form>

      {result ? (
        <Result result={result} />
      ) : (
        <aside className="ib-card ib-panel ib-info">
          <h3 className="ib-subtitle">What you’ll see</h3>
          <ul className="ib-info-list">
            <li>
              <span className="ib-way-icon" aria-hidden="true">
                <Check size={17} strokeWidth={1.8} />
              </span>
              <div>
                <strong>Your stage</strong>
                <p>Under review, accepted or not selected.</p>
              </div>
            </li>
            <li>
              <span className="ib-way-icon" aria-hidden="true">
                <MapPin size={17} strokeWidth={1.8} />
              </span>
              <div>
                <strong>Your stall</strong>
                <p>The stall number once it’s assigned.</p>
              </div>
            </li>
            <li>
              <span className="ib-way-icon" aria-hidden="true">
                <Inbox size={17} strokeWidth={1.8} />
              </span>
              <div>
                <strong>Your inbox</strong>
                <p>Private feedback from visitors and requests to join your team.</p>
              </div>
            </li>
          </ul>
          <p className="ib-note">Lost your access code? It can’t be recovered online — contact the Idea Incubator team.</p>
        </aside>
      )}
    </div>
  );
}
