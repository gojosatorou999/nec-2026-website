import { useEffect, useId, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleCheck,
  Download,
  Layers,
  LogOut,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { categories, stages } from '../../shared/schema.js';
import { fieldLabel, isUpload, submissionSections } from '../../shared/submissions.js';
import { api } from './api.js';
import { Button, EmptyState, ErrorBox, Loading, Modal, Tag, TextField } from './ui.jsx';
import { formatDate, statusTone } from './format.js';

const STATUSES = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'];
const TABS = ['Applications', 'Startups', 'Stalls', 'Feedback', 'Idea Box'];

function SubmissionDownloads({ kind, id }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function download(format) {
    setError('');
    setBusy(true);
    try {
      const response = await fetch(
        '/api/admin/submissions/' + kind + '/' + encodeURIComponent(id) + '/export?format=' + format,
        { credentials: 'same-origin' }
      );
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Download failed.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = kind + '-' + id + '.' + format;
      document.body.appendChild(link); // Firefox needs the link in the document
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ib-downloads">
      <div className="ib-actions">
        <Button disabled={busy} onClick={() => download('md')}>
          <Download size={15} /> Markdown
        </Button>
        <Button primary disabled={busy} onClick={() => download('pdf')}>
          <Download size={15} /> PDF
        </Button>
      </div>
      <ErrorBox message={error} />
    </div>
  );
}

function SubmissionDetails({ record }) {
  const uploads = Object.entries(record).flatMap(([key, value]) =>
    (Array.isArray(value) ? value : [value]).filter(isUpload).map((file) => ({ ...file, label: fieldLabel(key) }))
  );
  return (
    <div className="ib-review">
      {submissionSections(record).map((section) => (
        <section className="ib-review-section" key={section.title}>
          <div className="ib-review-head">
            <h3>{section.title}</h3>
          </div>
          <dl>
            {section.fields.map((field) => (
              <div className="ib-review-row" key={field.key}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      {uploads.length > 0 && (
        <section className="ib-review-section">
          <div className="ib-review-head">
            <h3>Uploaded files</h3>
          </div>
          <div className="ib-files">
            {uploads.map((file, index) => (
              <a key={index} href={file.data} download={file.name} className="ib-file">
                {(file.data.startsWith('data:image/') || file.mimeType?.startsWith('image/')) && (
                  <img src={file.data} alt="" loading="lazy" />
                )}
                <span>
                  <small>{file.label}</small>
                  <strong>{file.name}</strong>
                </span>
                <Download size={16} />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ApplicationReview({ application: a, stall, onClose, onSaved }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const formId = useId();
  const accepted = a.status === 'Approved';
  return (
    <Modal title={'Application ' + a.id} onClose={onClose} wide>
      <div className="ib-review-top">
        {a.logo?.data && <img src={a.logo.data} alt={a.name + ' logo'} />}
        <div>
          <h2 className="ib-panel-title">{a.name}</h2>
          {a.tagline && <p className="ib-lede">{a.tagline}</p>}
        </div>
      </div>

      <section className={'ib-publish' + (accepted ? ' is-live' : '')}>
        <span className="ib-publish-icon">{accepted ? <CircleCheck size={20} /> : <ShieldCheck size={20} />}</span>
        <div>
          <h3>{accepted ? 'Accepted — live in the showcase' : 'Decision'}</h3>
          <p>
            {accepted
              ? 'Visitors can see this startup’s logo, idea, display and team details.'
              : 'Accepting publishes the startup profile in the showcase. Contact details and documents stay private.'}
          </p>
          <div className="ib-actions">
            {!accepted && (
              <Button primary type="submit" form={formId} name="decision" value="Approved" disabled={busy}>
                {busy ? 'Saving…' : 'Accept & publish'} <CircleCheck size={15} />
              </Button>
            )}
            {accepted && (
              <a href="#explore" className="btn btn-primary ib-btn" onClick={onClose}>
                View in showcase <ArrowUpRight size={15} />
              </a>
            )}
            {a.status !== 'Rejected' && (
              <Button type="submit" form={formId} name="decision" value="Rejected" disabled={busy}>
                {accepted ? 'Remove from showcase' : 'Reject'}
              </Button>
            )}
          </div>
        </div>
      </section>

      <ErrorBox message={error} />
      <SubmissionDownloads kind="applications" id={a.id} />
      <SubmissionDetails record={{ ...a, stall: stall || 'Not assigned' }} />

      <form
        id={formId}
        className="ib-form ib-review-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const fields = Object.fromEntries(new FormData(e.currentTarget));
          const decision = e.nativeEvent.submitter?.value || fields.status;
          setBusy(true);
          setError('');
          try {
            await api('/admin/applications/' + a.id, { method: 'PATCH', body: { ...fields, status: decision } });
            onSaved(decision);
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h3 className="ib-subtitle">Review & stall</h3>
        <div className="ib-form-grid">
          <div className="ib-field">
            <label className="ib-label" htmlFor={formId + '-status'}>
              Status
            </label>
            <select id={formId + '-status'} name="status" defaultValue={a.status}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === 'Approved' ? 'Accepted — in showcase' : status}
                </option>
              ))}
            </select>
          </div>
          <TextField label="Stall number" name="stall" defaultValue={stall} placeholder="e.g. A-01" maxLength={16} required={false} />
          <TextField label="Internal notes" name="notes" type="textarea" rows={4} defaultValue={a.notes} required={false} full />
        </div>
        <p className="ib-note">
          The showcase shows the logo, idea, team names, college and display details. Emails, phone numbers, documents,
          stall requirements and notes stay private.
        </p>
        <Button primary disabled={busy} type="submit">
          {busy ? 'Saving…' : 'Save review'} <Check size={15} />
        </Button>
      </form>
    </Modal>
  );
}

function Login({ onSignedIn }) {
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
          try {
            onSignedIn(await api('/login', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }));
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Tag>
          <ShieldCheck size={12} /> Organizers only
        </Tag>
        <h2 className="ib-panel-title">Sign in</h2>
        <div className="ib-form-grid is-single">
          <TextField label="Email address" name="email" type="email" autoComplete="username" />
          <TextField label="Password" name="password" type="password" autoComplete="current-password" maxLength={256} />
        </div>
        <ErrorBox message={error} />
        <Button primary disabled={busy} type="submit">
          {busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={16} />
        </Button>
      </form>
      <aside className="ib-card ib-panel ib-info">
        <h3 className="ib-subtitle">Organizer workspace</h3>
        <ul className="ib-info-list">
          {[
            [Layers, 'Applications', 'Review startups, accept or reject them and assign stalls.'],
            [MessageSquare, 'Submissions', 'Read visitor feedback, team introductions and Idea Box entries.'],
            [Download, 'Challenges & exports', 'Publish rapid-fire problems and export records as CSV, Markdown or PDF.'],
          ].map(([Icon, title, text]) => (
            <li key={title}>
              <span className="ib-way-icon" aria-hidden="true">
                <Icon size={17} strokeWidth={1.8} />
              </span>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export default function Admin({ refreshPublic }) {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(TABS[0]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [stage, setStage] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [notice, setNotice] = useState('');
  const [lastSynced, setLastSynced] = useState(null);

  const load = () =>
    api('/admin')
      .then((fresh) => {
        setData(fresh);
        setLastSynced(new Date());
        setError('');
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    api('/me')
      .then((u) => {
        setUser(u);
        load();
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    const refresh = () => {
      if (!document.hidden) load();
    };
    const timer = setInterval(refresh, 20000);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [user]);

  if (!checked) return <Loading />;
  if (!user)
    return (
      <Login
        onSignedIn={(u) => {
          setUser(u);
          load();
        }}
      />
    );

  const q = query.trim().toLowerCase();
  const applications =
    data?.applications.filter(
      (a) =>
        [a.name, a.founderName, a.email, a.organization, a.id].join(' ').toLowerCase().includes(q) &&
        (!category || a.category === category) &&
        (!stage || a.stage === stage) &&
        (!status || a.status === status)
    ) || [];
  const startupName = (id) => data?.startups.find((s) => s.id === id)?.name || id;

  return (
    <div className="ib-admin">
      <div className="ib-admin-bar">
        <span className="eyebrow">
          Signed in as {user.email}
          {lastSynced && ` · updated ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </span>
        <div className="ib-actions">
          <Button onClick={load}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button
            onClick={async () => {
              try {
                await api('/logout', { method: 'POST' });
                setUser(null);
                setData(null);
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            <LogOut size={14} /> Sign out
          </Button>
        </div>
      </div>

      {notice && (
        <div className="ib-notice" role="status">
          <CircleCheck size={18} />
          <span>{notice}</span>
          <a href="#explore">
            View showcase <ArrowUpRight size={14} />
          </a>
        </div>
      )}

      <div className="ib-stats">
        {[
          ['Applications', data?.applications.length || 0],
          ['Awaiting review', data?.applications.filter((a) => ['Submitted', 'Under Review'].includes(a.status)).length || 0],
          ['In showcase', data?.startups.filter((s) => s.status === 'Approved' && !s.isDemo).length || 0],
          ['Ideas received', (data?.ideas.length || 0) + (data?.rapid.length || 0)],
        ].map(([l, n]) => (
          <div className="ib-card ib-stat" key={l}>
            <span className="eyebrow">{l}</span>
            <strong>{n}</strong>
          </div>
        ))}
      </div>

      <div className="ib-admin-tabs">
        <div className="ib-chips" role="group" aria-label="Dashboard sections">
          {TABS.map((t) => (
            <button
              type="button"
              aria-pressed={tab === t}
              className={'ib-chip' + (tab === t ? ' is-on' : '')}
              onClick={() => setTab(t)}
              key={t}
            >
              {t}
            </button>
          ))}
        </div>
        <a className="btn btn-ghost ib-btn" href="/api/admin/export">
          <Download size={14} /> Export CSV
        </a>
      </div>

      <ErrorBox message={error} />

      {!data ? (
        <Loading />
      ) : tab === 'Applications' ? (
        <>
          <div className="ib-admin-filters">
            <label className="ib-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search name, email, reference"
                aria-label="Search applications"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select aria-label="Filter by stage" value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="">All stages</option>
              {stages.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          {applications.length ? (
            <div className="ib-table-wrap" data-lenis-prevent-horizontal>
              <table className="ib-table">
                <thead>
                  <tr>
                    <th scope="col">Startup</th>
                    <th scope="col">Team leader</th>
                    <th scope="col">Team</th>
                    <th scope="col">Status</th>
                    <th scope="col">Submitted</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.name}</strong>
                        <small>{a.id}</small>
                      </td>
                      <td>
                        {a.founderName}
                        <small>{a.email}</small>
                      </td>
                      <td>{a.teamSize || a.members?.length || '—'}</td>
                      <td>
                        <Tag tone={statusTone(a.status)}>{a.status}</Tag>
                      </td>
                      <td>{a.submittedAt ? formatDate(a.submittedAt) : '—'}</td>
                      <td>
                        <button type="button" className="ib-text-btn" onClick={() => setSelected(a)}>
                          Review <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Layers} title={data.applications.length ? 'No applications match' : 'No applications yet'}>
              {data.applications.length ? 'Change the search or filters.' : 'New startup applications will appear here.'}
            </EmptyState>
          )}
        </>
      ) : tab === 'Startups' ? (
        <>
          {data.startups.some((s) => s.isDemo) && (
            <div className="ib-admin-row-end">
              <button type="button" className="ib-text-btn" onClick={() => setConfirmDemo(true)}>
                Remove demo profiles <Trash2 size={13} />
              </button>
            </div>
          )}
          {data.startups.length ? (
            <div className="ib-list">
              {data.startups.map((s) => (
                <div className="ib-card ib-list-item" key={s.id}>
                  <div>
                    <h3>{s.name}</h3>
                    <p>
                      {[s.category, s.stage, s.isDemo && 'Demo'].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <Tag tone={statusTone(s.status)}>{s.status}</Tag>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Layers} title="No published startups">
              Accept an application to publish it in the showcase.
            </EmptyState>
          )}
        </>
      ) : tab === 'Stalls' ? (
        data.applications.some((a) => a.status === 'Approved') ? (
          <div className="ib-list">
            {data.applications
              .filter((a) => a.status === 'Approved')
              .map((a) => (
                <div className="ib-card ib-list-item" key={a.id}>
                  <div>
                    <h3>{a.name}</h3>
                    <p>{Array.isArray(a.display) ? a.display.join(', ') : a.display}</p>
                  </div>
                  <Tag tone="mint">Stall {data.startups.find((s) => s.id === a.id)?.stall || 'unassigned'}</Tag>
                  <Button onClick={() => setSelected(a)}>
                    Assign <ArrowUpRight size={14} />
                  </Button>
                </div>
              ))}
          </div>
        ) : (
          <EmptyState icon={MapPin} title="No accepted startups yet">
            Stalls are assigned from an accepted application’s review panel.
          </EmptyState>
        )
      ) : tab === 'Feedback' ? (
        data.feedback.length || data.interests.length ? (
          <div className="ib-list">
            {data.feedback.map((f) => (
              <article className="ib-card ib-entry" key={f.id}>
                <div className="ib-entry-head">
                  <Tag>{startupName(f.startupId)}</Tag>
                  <Button onClick={() => setSelectedSubmission({ kind: 'feedback', record: f })}>
                    Details <ArrowUpRight size={14} />
                  </Button>
                </div>
                <h3>
                  {f.name || 'Anonymous'} · {f.visitorType}
                </h3>
                <p>{f.overall}</p>
              </article>
            ))}
            {data.interests.map((i) => (
              <article className="ib-card ib-entry" key={i.id}>
                <div className="ib-entry-head">
                  <Tag tone="mint">Join request · {startupName(i.startupId)}</Tag>
                  <Button onClick={() => setSelectedSubmission({ kind: 'interests', record: i })}>
                    Details <ArrowUpRight size={14} />
                  </Button>
                </div>
                <h3>{i.name}</h3>
                <p>
                  {i.email} · {i.skills}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon={MessageSquare} title="No feedback yet">
            Visitor feedback and team introductions will appear here.
          </EmptyState>
        )
      ) : (
        <>
          <div className="ib-admin-ideas">
            <section className="ib-card ib-panel">
              <h3 className="ib-subtitle">Publish a rapid-fire challenge</h3>
              <form
                className="ib-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target;
                  try {
                    await api('/admin/problems', { method: 'POST', body: Object.fromEntries(new FormData(form)) });
                    form.reset();
                    load();
                  } catch (err) {
                    setError(err.message);
                  }
                }}
              >
                <div className="ib-form-grid is-single">
                  <TextField label="Title" name="title" />
                  <TextField label="Problem statement" name="description" type="textarea" rows={3} />
                </div>
                <Button primary type="submit">
                  Publish <Plus size={15} />
                </Button>
              </form>
            </section>
            <section className="ib-card ib-panel">
              <h3 className="ib-subtitle">Challenges</h3>
              {data.problems.length ? (
                <ul className="ib-challenges">
                  {data.problems.map((p) => (
                    <li key={p.id}>
                      <div>
                        <strong>{p.title}</strong>
                        <p>{p.description}</p>
                      </div>
                      <Tag tone={p.active ? 'mint' : ''}>{p.active ? 'Open' : 'Closed'}</Tag>
                      <button
                        type="button"
                        className="ib-text-btn"
                        onClick={async () => {
                          try {
                            await api('/admin/problems/' + p.id, { method: 'PATCH', body: { active: !p.active } });
                            load();
                          } catch (err) {
                            setError(err.message);
                          }
                        }}
                      >
                        {p.active ? 'Close' : 'Reopen'}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ib-lede">No challenges published yet.</p>
              )}
            </section>
          </div>
          <h3 className="ib-subtitle">Submissions</h3>
          {data.ideas.length || data.rapid.length ? (
            <div className="ib-list">
              {[...data.ideas, ...data.rapid].map((i) => (
                <article className="ib-card ib-entry" key={i.id}>
                  <div className="ib-entry-head">
                    <Tag tone={i.mode === 'rapid' ? 'amber' : ''}>
                      {i.mode === 'rapid' ? 'Rapid-fire' : 'Idea'} · {i.id}
                    </Tag>
                    <Button onClick={() => setSelectedSubmission({ kind: i.mode === 'rapid' ? 'rapid' : 'ideas', record: i })}>
                      Details <ArrowUpRight size={14} />
                    </Button>
                  </div>
                  <h3>
                    {i.name} · {[i.department, i.year].filter(Boolean).join(', ')}
                  </h3>
                  <p>{i.problem || i.solution}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon={MessageSquare} title="No submissions yet">
              Ideas and rapid-fire responses will appear here.
            </EmptyState>
          )}
        </>
      )}

      {selectedSubmission && (
        <Modal title="Submission" onClose={() => setSelectedSubmission(null)} wide>
          <h2 className="ib-panel-title">{selectedSubmission.record.name || 'Submission'}</h2>
          <SubmissionDownloads kind={selectedSubmission.kind} id={selectedSubmission.record.id} />
          <SubmissionDetails record={selectedSubmission.record} />
        </Modal>
      )}

      {selected && (
        <ApplicationReview
          application={selected}
          stall={data.startups.find((s) => s.id === selected.id)?.stall || ''}
          onClose={() => setSelected(null)}
          onSaved={(decision) => {
            setNotice(
              decision === 'Approved'
                ? 'Application accepted — the startup is now in the showcase.'
                : decision === 'Rejected'
                  ? 'Application rejected — it is not shown in the showcase.'
                  : 'Review saved.'
            );
            setSelected(null);
            load();
            refreshPublic();
          }}
        />
      )}

      {confirmDemo && (
        <Modal title="Remove demo profiles" onClose={() => setConfirmDemo(false)}>
          <h2 className="ib-panel-title">Remove demo profiles?</h2>
          <p className="ib-lede">
            This removes the illustrative demo startups from the showcase. Real applications and published startups are
            kept.
          </p>
          <div className="ib-actions">
            <Button onClick={() => setConfirmDemo(false)}>Cancel</Button>
            <Button
              primary
              onClick={async () => {
                try {
                  await api('/admin/demo', { method: 'DELETE' });
                  setConfirmDemo(false);
                  load();
                  refreshPublic();
                } catch (e) {
                  setError(e.message);
                }
              }}
            >
              Remove
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
