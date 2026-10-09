import { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  CircleCheck,
  ExternalLink,
  LayoutGrid,
  MessageSquare,
  Search,
  Send,
  SlidersHorizontal,
  Store,
  Users,
} from 'lucide-react';
import { categories, stages } from '../../shared/schema.js';
import { api } from './api.js';
import { Button, EmptyState, ErrorBox, Heading, Loading, Modal, Tag, TextField } from './ui.jsx';

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '·';

/** Logo on a quiet panel; falls back to a monogram if there is no logo. */
function LogoPanel({ startup: s, large = false }) {
  const [broken, setBroken] = useState(false);
  const logo = !broken && s.logo?.data;
  return (
    <div className={'ib-logo-panel' + (large ? ' is-large' : '')}>
      {logo ? (
        <img src={s.logo.data} alt={`${s.name} logo`} loading="lazy" decoding="async" onError={() => setBroken(true)} />
      ) : (
        <span className="ib-monogram" aria-hidden="true">
          {initials(s.name)}
        </span>
      )}
      <span className="ib-stall">Stall {s.stall || 'TBA'}</span>
    </div>
  );
}

function StartupCard({ startup: s, onOpen }) {
  const lead = s.founderName || s.members?.[0]?.name;
  return (
    <button type="button" className="ib-card ib-startup" onClick={() => onOpen(s)} aria-label={'View details for ' + s.name}>
      <LogoPanel startup={s} />
      <div className="ib-startup-body">
        <div className="ib-startup-meta">
          <span>{s.category || 'Expo startup'}</span>
          {s.stage && <span>{s.stage}</span>}
        </div>
        <h3>{s.name}</h3>
        {s.organization && <p className="ib-startup-org">{s.organization}</p>}
        <p className="ib-startup-line">{s.tagline}</p>
        <div className="ib-startup-foot">
          <span>{lead ? `Led by ${lead}` : 'Meet the team'}</span>
          <span className="ib-startup-more">
            Details <ArrowUpRight size={15} />
          </span>
        </div>
      </div>
    </button>
  );
}

function FeedbackForm({ startup, onDone }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="ib-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          await api('/feedback', {
            method: 'POST',
            body: { ...Object.fromEntries(new FormData(e.target)), startupId: startup.id },
          });
          onDone();
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Heading eyebrow="Feedback" title={`Feedback for ${startup.name}`}>
        Shared privately with the founders and the organizing team.
      </Heading>
      <div className="ib-form-grid">
        {[
          ['overall', 'Overall feedback'],
          ['problem', 'What problem does the startup solve?'],
          ['interesting', 'What stood out to you?'],
          ['suggestions', 'Suggestions for improvement'],
          ['questions', 'Questions for the founders'],
        ].map(([k, l]) => (
          <TextField key={k} label={l} name={k} type="textarea" full />
        ))}
        <TextField label="Your name" name="name" required={false} autoComplete="name" />
        <TextField label="Department / year" name="department" required={false} />
        <div className="ib-field is-full">
          <label className="ib-label" htmlFor="fb-visitor">
            You’re visiting as <em aria-hidden="true">*</em>
          </label>
          <select id="fb-visitor" name="visitorType" required>
            {['Student', 'Faculty', 'Industry', 'Other'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <ErrorBox message={error} />
      <Button primary disabled={busy} type="submit">
        {busy ? 'Sending…' : 'Send feedback'} <Send size={15} />
      </Button>
    </form>
  );
}

function JoinForm({ startup, onDone }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="ib-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          await api('/join', {
            method: 'POST',
            body: { ...Object.fromEntries(new FormData(e.target)), startupId: startup.id },
          });
          onDone();
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Heading eyebrow="Join the team" title={`Introduce yourself to ${startup.name}`}>
        Your details are shared privately with the team and the organizers.
      </Heading>
      <div className="ib-form-grid">
        <TextField label="Your name" name="name" full autoComplete="name" />
        <TextField label="Email address" name="email" type="email" full autoComplete="email" />
        <TextField label="Your skills" name="skills" full />
        <TextField label="Why would you like to join?" name="message" type="textarea" rows={4} full />
      </div>
      <ErrorBox message={error} />
      <Button primary disabled={busy} type="submit">
        {busy ? 'Sending…' : 'Send introduction'} <ArrowUpRight size={15} />
      </Button>
    </form>
  );
}

function StartupDetail({ startup: s, onClose }) {
  const [view, setView] = useState('overview');
  const back = (
    <button type="button" className="ib-back" onClick={() => setView('overview')}>
      <ArrowLeft size={15} /> Back to {s.name}
    </button>
  );
  const display = s.display ? (Array.isArray(s.display) ? s.display : [s.display]) : [];

  return (
    <Modal title={s.name} onClose={onClose}>
      {view === 'sent' ? (
        <div className="ib-done">
          <CircleCheck size={30} strokeWidth={1.6} />
          <h3>Thank you</h3>
          <p>Your response has been shared privately with the team and the organizers.</p>
          <Button onClick={() => setView('overview')}>Back to {s.name}</Button>
        </div>
      ) : view === 'feedback' ? (
        <>
          {back}
          <FeedbackForm startup={s} onDone={() => setView('sent')} />
        </>
      ) : view === 'join' ? (
        <>
          {back}
          <JoinForm startup={s} onDone={() => setView('sent')} />
        </>
      ) : (
        <div className="ib-detail">
          <LogoPanel startup={s} large />
          <div>
            <p className="eyebrow">{[s.category, s.stage].filter(Boolean).join(' · ') || 'Expo startup'}</p>
            <h2 className="ib-detail-name">{s.name}</h2>
            {s.tagline && <p className="ib-detail-line">{s.tagline}</p>}
          </div>

          <dl className="ib-facts">
            {s.organization && (
              <div>
                <dt>College / organization</dt>
                <dd>{s.organization}</dd>
              </div>
            )}
            {s.teamSize > 0 && (
              <div>
                <dt>Team</dt>
                <dd>
                  {s.teamSize} {Number(s.teamSize) === 1 ? 'member' : 'members'}
                </dd>
              </div>
            )}
            <div>
              <dt>Expo stall</dt>
              <dd>{s.stall || 'To be assigned'}</dd>
            </div>
          </dl>

          <div className="ib-actions">
            <Button primary onClick={() => setView('feedback')}>
              <MessageSquare size={15} /> Give feedback
            </Button>
            {s.hiring && (
              <Button onClick={() => setView('join')}>
                <Users size={15} /> Join the team
              </Button>
            )}
            {s.website && (
              <a className="btn btn-ghost ib-btn" href={s.website} target="_blank" rel="noreferrer noopener">
                Website <ExternalLink size={14} />
              </a>
            )}
          </div>

          {display.length > 0 && (
            <section className="ib-block">
              <h3>At the stall</h3>
              <div className="ib-tag-row">
                {display.map((item) => (
                  <Tag key={item}>{item}</Tag>
                ))}
              </div>
              {s.displayOther && <p>{s.displayOther}</p>}
            </section>
          )}

          {[
            ['The problem', s.problem],
            ['The solution', s.solution],
            ['The product', s.productDescription],
            ['Who it’s for', s.targetUsers],
            ['Business model', s.businessModel],
          ].map(
            ([t, v]) =>
              v && (
                <section className="ib-block" key={t}>
                  <h3>{t}</h3>
                  <p>{v}</p>
                </section>
              )
          )}

          {(s.demo || s.prototype || s.video || s.social || s.images?.length > 1) && (
            <section className="ib-block">
              <h3>Product</h3>
              {s.productStatus && <Tag>{s.productStatus}</Tag>}
              <div className="ib-link-row">
                {[
                  ['demo', 'Live product'],
                  ['prototype', 'Prototype'],
                  ['video', 'Demo video'],
                  ['social', 'Social'],
                ].map(
                  ([k, l]) =>
                    s[k] && (
                      <a key={k} href={s[k]} target="_blank" rel="noreferrer noopener">
                        {l} <ArrowUpRight size={13} />
                      </a>
                    )
                )}
              </div>
              {s.images?.slice(1).map((im, i) => (
                <img key={i} className="ib-detail-img" src={im.data} alt={`${s.name} — image ${i + 2}`} loading="lazy" />
              ))}
            </section>
          )}

          {s.members?.length > 0 && (
            <section className="ib-block">
              <h3>Team</h3>
              <ul className="ib-people">
                {s.members.map((m, i) => (
                  <li key={i}>
                    <span className="ib-avatar" aria-hidden="true">
                      {initials(m.name)}
                    </span>
                    <div>
                      <strong>{m.name}</strong>
                      <small>{[m.role, m.skills].filter(Boolean).join(' · ')}</small>
                    </div>
                    {m.profile && (
                      <a href={m.profile} target="_blank" rel="noreferrer noopener" aria-label={`${m.name}'s profile`}>
                        <ArrowUpRight size={16} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {s.hiring && (
            <section className="ib-block ib-hiring">
              <p className="eyebrow">Open roles</p>
              <div className="ib-tag-row">
                {s.requiredRoles?.map((r) => (
                  <Tag key={r}>{r}</Tag>
                ))}
              </div>
              {s.opportunity && <p>{s.opportunity}</p>}
              {s.requiredSkills && <p>{s.requiredSkills}</p>}
              <Button onClick={() => setView('join')}>
                Introduce yourself <ArrowUpRight size={15} />
              </Button>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}

const PRODUCT_STATES = ['Concept only', 'In development', 'Working prototype', 'Live product'];

export default function Showcase({ startups: supplied, loading }) {
  const startups = supplied.filter((s) => s.status === 'Approved' && !s.isDemo);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [filters, setFilters] = useState(false);
  const [stage, setStage] = useState('');
  const [product, setProduct] = useState('');
  const [hiring, setHiring] = useState(false);

  const reset = () => {
    setQuery('');
    setCategory('');
    setStage('');
    setProduct('');
    setHiring(false);
  };

  const q = query.trim().toLowerCase();
  const filtered = startups.filter(
    (s) =>
      (!category || s.category === category) &&
      (!stage || s.stage === stage) &&
      (!product || s.productStatus === product) &&
      (!hiring || s.hiring) &&
      (!q ||
        [s.name, s.tagline, s.founderName, s.organization, s.problem, s.productDescription, s.category, s.requiredSkills, ...(s.requiredRoles || [])]
          .join(' ')
          .toLowerCase()
          .includes(q))
  );
  // Only offer categories that actually have startups in them.
  const present = categories.filter((c) => startups.some((s) => s.category === c));

  return (
    <section id="explore" className="ib-section" aria-labelledby="showcase-title">
      <div className="ib-section-head">
        <Heading eyebrow="Showcase" title={<span id="showcase-title">Startups at the expo</span>}>
          Teams accepted by the organizers appear here with their stall number. Open a startup to read more, leave
          feedback or ask to join the team.
        </Heading>
      </div>

      {startups.length > 0 && (
        <>
          <div className="ib-toolbar">
            <label className="ib-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search startups"
                placeholder="Search by name, idea or skill"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button
              type="button"
              className={'ib-filter-btn' + (filters ? ' is-on' : '')}
              onClick={() => setFilters(!filters)}
              aria-expanded={filters}
            >
              <SlidersHorizontal size={15} /> Filters
              {(stage || product || hiring) && <span className="ib-dot" aria-label="active" />}
            </button>
          </div>

          {present.length > 1 && (
            <div className="ib-chips" role="group" aria-label="Category">
              {['', ...present].map((c) => (
                <button
                  type="button"
                  key={c || 'all'}
                  className={'ib-chip' + (category === c ? ' is-on' : '')}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {!c && <LayoutGrid size={12} />} {c || 'All'}
                </button>
              ))}
            </div>
          )}

          {filters && (
            <div className="ib-filter-panel">
              <div className="ib-field">
                <label className="ib-label" htmlFor="flt-stage">
                  Stage
                </label>
                <select id="flt-stage" value={stage} onChange={(e) => setStage(e.target.value)}>
                  <option value="">All stages</option>
                  {stages.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="ib-field">
                <label className="ib-label" htmlFor="flt-product">
                  Product
                </label>
                <select id="flt-product" value={product} onChange={(e) => setProduct(e.target.value)}>
                  <option value="">Any</option>
                  {PRODUCT_STATES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <label className="ib-check-row">
                <input type="checkbox" checked={hiring} onChange={(e) => setHiring(e.target.checked)} />
                <span>Looking for team members</span>
              </label>
              <button type="button" className="ib-text-btn" onClick={reset}>
                Reset
              </button>
            </div>
          )}

          <p className="ib-count eyebrow" aria-live="polite">
            {filtered.length} of {startups.length} {startups.length === 1 ? 'startup' : 'startups'}
          </p>
        </>
      )}

      {loading && !startups.length ? (
        <Loading label="Loading the showcase…" />
      ) : !startups.length ? (
        <EmptyState
          icon={Store}
          title="The showcase opens soon"
          action={
            <a className="btn btn-primary ib-btn" href="#register">
              Register your startup <ArrowUpRight size={16} />
            </a>
          }
        >
          Startups are listed here once the organizers accept their application. Applications are open now.
        </EmptyState>
      ) : filtered.length ? (
        <div className="ib-grid">
          {filtered.map((s) => (
            <StartupCard key={s.id} startup={s} onOpen={setSelected} />
          ))}
        </div>
      ) : (
        <EmptyState icon={Search} title="No startups match" action={<Button onClick={reset}>Clear search and filters</Button>}>
          Try a different search term or remove a filter.
        </EmptyState>
      )}

      {selected && <StartupDetail startup={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
