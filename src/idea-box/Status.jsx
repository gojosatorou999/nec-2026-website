import { useState } from 'react';
import { ArrowRight, Inbox } from 'lucide-react';
import { api } from './api.js';
import { Button, EmptyState, ErrorBox, Tag, TextField } from './ui.jsx';
import { statusTone } from './format.js';

const FEEDBACK_FIELDS = [
  ['overall', 'Overall'],
  ['problem', 'Problem it solves'],
  ['interesting', 'What stood out'],
  ['suggestions', 'Suggestions'],
  ['questions', 'Questions'],
];

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
          try {
            setResult(
              await api('/applications/' + encodeURIComponent(d.id.trim()) + '/status', {
                headers: { 'x-tracking-token': d.token.trim() },
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
        <p className="ib-lede">Use the reference and private access code you received when you applied.</p>
        <div className="ib-form-grid is-single">
          <TextField
            label="Application reference"
            name="id"
            placeholder="MGIT-…"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
          />
          <TextField label="Private access code" name="token" type="password" autoComplete="off" />
        </div>
        <ErrorBox message={error} />
        <Button primary disabled={busy} type="submit">
          {busy ? 'Checking…' : 'Check status'} <ArrowRight size={16} />
        </Button>
      </form>

      {result ? (
        <section className="ib-card ib-panel" aria-live="polite">
          <div className="ib-status-head">
            <h2 className="ib-panel-title">{result.name}</h2>
            <Tag tone={statusTone(result.status)}>{result.status}</Tag>
          </div>
          <p className="ib-lede">
            {result.stall ? (
              <>
                Your stall: <strong>{result.stall}</strong>
              </>
            ) : (
              'Your stall number will appear here once it is assigned.'
            )}
          </p>
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
        </section>
      ) : (
        <aside className="ib-guide">
          <h3 className="ib-subtitle">What you’ll see</h3>
          <ul className="ib-plain-list">
            <li>Your application status — submitted, under review, accepted or not selected.</li>
            <li>Your stall number once it is assigned.</li>
            <li>Private feedback left by visitors, and introductions from people who want to join your team.</li>
          </ul>
          <p className="ib-note">Lost your access code? It can’t be recovered — contact the Idea Incubator team.</p>
        </aside>
      )}
    </div>
  );
}
