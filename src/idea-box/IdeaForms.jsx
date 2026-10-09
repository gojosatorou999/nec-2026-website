import { useEffect, useState } from 'react';
import { ArrowUpRight, CircleCheck, Lightbulb, ShieldCheck, Zap } from 'lucide-react';
import { api } from './api.js';
import { Button, CopyField, EmptyState, ErrorBox, Heading, TextField } from './ui.jsx';

const GUIDE = {
  idea: [
    ['Start with the problem', 'Something you have seen people struggle with — on campus or beyond.'],
    ['Describe your approach', 'How you would solve it. It doesn’t need to be complete.'],
    ['We review every entry', 'The Idea Incubator team reads each submission and may reach out by email.'],
  ],
  rapid: [
    ['Pick a challenge', 'Problem statements are published by the organizers and open for a limited time.'],
    ['Answer briefly', 'A clear solution and a short explanation of your reasoning.'],
    ['We review every entry', 'Responses are reviewed by the organizing team.'],
  ],
};

export default function IdeaForms({ initialMode = 'idea' }) {
  const [mode, setMode] = useState(initialMode);
  const [problems, setProblems] = useState([]);
  const [problemsLoaded, setProblemsLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => setMode(initialMode), [initialMode]);
  useEffect(() => {
    api('/problems')
      .then(setProblems)
      .catch(() => {})
      .finally(() => setProblemsLoaded(true));
  }, []);

  if (result)
    return (
      <div className="ib-card ib-panel ib-success">
        <CircleCheck size={34} strokeWidth={1.5} className="ib-success-icon" />
        <Heading eyebrow="Submission received" title="Thank you for sharing your idea" as="h2">
          It has been saved for the organizing team to review.
        </Heading>
        <div className="ib-codes">
          <CopyField label="Submission reference" value={result.id} />
        </div>
        <Button onClick={() => setResult(null)}>Submit another</Button>
      </div>
    );

  const rapid = mode === 'rapid';

  return (
    <div className="ib-split">
      <aside className="ib-guide">
        <h2 className="ib-panel-title">{rapid ? 'Rapid-fire challenge' : 'Submit an idea'}</h2>
        <p className="ib-lede">
          {rapid
            ? 'Respond to a problem statement set by the organizers.'
            : 'You don’t need a team or a startup — just a problem worth solving and a way to approach it.'}
        </p>
        <ol className="ib-guide-list">
          {GUIDE[mode].map(([t, d], i) => (
            <li key={t}>
              <span className="ib-guide-num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <strong>{t}</strong>
                <p>{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </aside>

      <section className="ib-card ib-panel" aria-label={rapid ? 'Rapid-fire response' : 'Idea submission'}>
        <div className="ib-segmented" role="group" aria-label="Submission type">
          <button type="button" aria-pressed={!rapid} className={!rapid ? 'is-on' : ''} onClick={() => setMode('idea')}>
            <Lightbulb size={15} /> Original idea
          </button>
          <button type="button" aria-pressed={rapid} className={rapid ? 'is-on' : ''} onClick={() => setMode('rapid')}>
            <Zap size={15} /> Rapid-fire
          </button>
        </div>

        {rapid && problemsLoaded && !problems.length ? (
          <EmptyState
            icon={Zap}
            title="No open challenges right now"
            action={<Button onClick={() => setMode('idea')}>Submit an original idea</Button>}
          >
            Problem statements will appear here when the organizers publish them.
          </EmptyState>
        ) : (
          <form
            key={mode}
            className="ib-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError('');
              try {
                setResult(await api('/ideas', { method: 'POST', body: { ...Object.fromEntries(new FormData(e.target)), mode } }));
              } catch (err) {
                setError(err.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="ib-form-grid">
              <TextField label="Your name" name="name" autoComplete="name" />
              <TextField label="Email address" name="email" type="email" autoComplete="email" />
              <TextField label="Department" name="department" />
              <TextField label="Year" name="year" placeholder="e.g. 3rd year" />
              {rapid ? (
                <div className="ib-field is-full">
                  <label className="ib-label" htmlFor="rf-problem">
                    Problem statement <em aria-hidden="true">*</em>
                  </label>
                  <select id="rf-problem" name="problemId" required defaultValue="">
                    <option value="">Select a challenge</option>
                    {problems.map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                  {problems.length > 0 && (
                    <ul className="ib-problems">
                      {problems.map((p) => (
                        <li key={p.id}>
                          <strong>{p.title}</strong>
                          <span>{p.description}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <TextField label="What problem have you noticed?" name="problem" type="textarea" full />
              )}
              <TextField label="Your proposed solution" name="solution" type="textarea" rows={4} full />
              {(rapid
                ? [['explanation', 'A short explanation of your reasoning', true]]
                : [
                    ['targetUsers', 'Who is it for?', true],
                    ['why', 'Why does it matter?', true],
                    ['skills', 'What skills would it need?', true],
                    ['members', 'Team members', false],
                  ]
              ).map(([k, l, req]) => (
                <TextField key={k} label={l} name={k} type="textarea" rows={2} required={req} full />
              ))}
            </div>
            <p className="ib-note">
              <ShieldCheck size={16} /> Submissions are shared only with the organizing team.
            </p>
            <ErrorBox message={error} />
            <Button primary disabled={busy} type="submit">
              {busy ? 'Submitting…' : rapid ? 'Submit response' : 'Submit idea'} <ArrowUpRight size={16} />
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
