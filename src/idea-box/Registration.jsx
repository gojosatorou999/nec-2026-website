import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CircleCheck, ShieldCheck } from 'lucide-react';
import { fieldVisible, steps, validateApplication } from '../../shared/schema.js';
import { api } from './api.js';
import { scrollToY } from '../smoothScroll.js';
import { Button, CopyAll, CopyField, ErrorBox, Field, Heading } from './ui.jsx';

function TeamReview({ members = [] }) {
  return members.map((member, index) => (
    <span className="ib-review-member" key={index}>
      <span>
        Member {index + 2}: {member.name}
      </span>
      <span>{[member.phone, member.email].filter(Boolean).join(' · ')}</span>
      <span>{[member.organization, member.role].filter(Boolean).join(' · ')}</span>
    </span>
  ));
}

function reviewValue(type, value) {
  if (type === 'members') return <TeamReview members={value} />;
  if (type === 'file') return value?.name || '—';
  if (['files', 'documents'].includes(type)) return value?.map((f) => f.name).join(', ') || '—';
  if (type === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ') || '—';
  return value || '—';
}

export default function Registration() {
  const [data, setData] = useState(() => ({ teamSize: '1', members: [] }));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const cardRef = useRef(null);

  const toTop = () => {
    const el = cardRef.current;
    if (el) scrollToY(Math.max(0, el.getBoundingClientRect().top + window.scrollY - 110));
  };

  const change = (k, v) => {
    setData((d) => {
      const updated = { ...d, [k]: v };
      if (k === 'teamSize' && /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 100)
        updated.members = Array.from({ length: Number(v) - 1 }, (_, i) => d.members?.[i] || {});
      if (k === 'display' && !v.includes('Other')) updated.displayOther = '';
      return updated;
    });
    setErrors((previous) => ({ ...previous, [k]: undefined, ...(k === 'teamSize' ? { members: undefined } : {}) }));
  };

  const goTo = (i) => {
    setStep(i);
    setErrors({});
    toTop();
  };

  const next = () => {
    const all = validateApplication(data);
    const keys = steps[step].fields.map((f) => f[0]);
    const current = Object.fromEntries(Object.entries(all).filter(([k]) => keys.includes(k)));
    setErrors(current);
    if (!Object.keys(current).length) {
      setStep((s) => s + 1);
      toTop();
    } else {
      // Bring the first problem into view — on a phone it may be off screen.
      requestAnimationFrame(() => cardRef.current?.querySelector('[aria-invalid="true"]')?.focus());
    }
  };

  const submit = async () => {
    const all = validateApplication(data);
    if (Object.keys(all).length) {
      setErrors(all);
      setStep(Math.max(0, steps.findIndex((s) => s.fields.some((f) => all[f[0]]))));
      setError('Please complete the highlighted fields.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      setResult(await api('/applications', { method: 'POST', body: data }));
      toTop();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (result)
    return (
      <div className="ib-card ib-panel ib-success" ref={cardRef}>
        <CircleCheck size={34} strokeWidth={1.5} className="ib-success-icon" />
        <Heading eyebrow="Application submitted" title="Your startup is in the queue" as="h2">
          The organizing team will review your application. Accepted startups are published in the showcase and
          assigned a stall.
        </Heading>
        <div className="ib-codes">
          <CopyField label="Application reference" value={result.id} />
          <CopyField label="Private access code" value={result.token} />
          <CopyAll
            items={[
              ['Application reference', result.id],
              ['Private access code', result.token],
            ]}
            filename={`${result.id}.txt`}
          />
        </div>
        <p className="ib-note">
          <ShieldCheck size={16} /> Save both now — they are the only way to check your status and read private
          feedback, and they can’t be recovered by email.
        </p>
        <a className="btn btn-primary ib-btn" href="#status">
          Track your application <ArrowUpRight size={16} />
        </a>
      </div>
    );

  const last = step === steps.length - 1;

  return (
    <div className="ib-reg" ref={cardRef}>
      <aside className="ib-steps" aria-label="Application steps">
        <ol>
          {steps.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                className={'ib-step' + (i === step ? ' is-current' : '') + (i < step ? ' is-done' : '')}
                onClick={() => i < step && goTo(i)}
                disabled={i > step}
                aria-current={i === step ? 'step' : undefined}
              >
                <span className="ib-step-num">{i < step ? <Check size={14} /> : String(i + 1).padStart(2, '0')}</span>
                <span className="ib-step-title">{s.title}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="ib-note">
          <ShieldCheck size={16} /> Nothing is saved until you submit, so keep this page open while you fill it in.
        </p>
      </aside>

      <section className="ib-card ib-panel ib-reg-card" aria-labelledby="reg-step-title">
        <div className="ib-reg-top">
          <span className="eyebrow">
            Step {step + 1} of {steps.length}
          </span>
          <span className="ib-req-hint">
            <em>*</em> required
          </span>
        </div>
        <div className="ib-progress" aria-hidden="true">
          <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
        <h2 id="reg-step-title" className="ib-panel-title">
          {steps[step].title}
        </h2>
        <p className="ib-lede">{steps[step].caption}</p>

        {last ? (
          <div className="ib-review">
            {steps.slice(0, -1).map((s, i) => (
              <section className="ib-review-section" key={s.title}>
                <div className="ib-review-head">
                  <h3>{s.title}</h3>
                  <button type="button" className="ib-text-btn" onClick={() => goTo(i)}>
                    Edit
                  </button>
                </div>
                <dl>
                  {s.fields
                    .filter(([key]) => fieldVisible(key, data))
                    .map(([k, l, t]) => (
                      <div className="ib-review-row" key={k}>
                        <dt>{l}</dt>
                        <dd>{reviewValue(t, data[k])}</dd>
                      </div>
                    ))}
                </dl>
              </section>
            ))}
            <p className="ib-note">
              <ShieldCheck size={16} /> Contact details, company emails and stall requirements stay private. If
              accepted, the showcase shows your logo, one-line idea, team names, college and what you’ll display.
            </p>
          </div>
        ) : (
          <div className="ib-form-grid">
            {steps[step].fields.map((f) => (
              <Field key={f[0]} field={f} data={data} onChange={change} error={errors[f[0]]} />
            ))}
          </div>
        )}

        <ErrorBox message={error} />

        <div className="ib-form-nav">
          <Button onClick={() => goTo(Math.max(0, step - 1))} disabled={step === 0 || busy}>
            <ArrowLeft size={15} /> Back
          </Button>
          {last ? (
            <Button primary disabled={busy} onClick={submit}>
              {busy ? 'Submitting…' : 'Submit application'} <ArrowUpRight size={16} />
            </Button>
          ) : (
            <Button primary onClick={next}>
              Continue <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
