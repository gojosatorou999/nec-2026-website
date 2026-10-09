import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, ClipboardCheck, KeyRound, Lightbulb, MapPin, Store, Zap } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WaterLayer from './components/WaterLayer';
import { scrollToY } from './smoothScroll.js';
import { api } from './idea-box/api.js';
import Showcase from './idea-box/Showcase.jsx';
import Registration from './idea-box/Registration.jsx';
import IdeaForms from './idea-box/IdeaForms.jsx';
import Status from './idea-box/Status.jsx';
import Admin from './idea-box/Admin.jsx';
import './idea-box/idea-box.css';

/* ═══════════════════════════════════════════════════════════════════════════
   IDEA BOX
   The MGIT Startup & Innovation Expo, folded into the NEC site: startup
   registration, idea and rapid-fire submissions, application tracking and the
   organizer dashboard. Routing is by hash so every view is linkable
   (/idea-box.html#register, #ideas, #rapid, #status, #admin) and the page
   stays a single static entry; data comes from /api (server/app.js).
   ═══════════════════════════════════════════════════════════════════════════ */

const OVERVIEW = ['', 'home', 'explore', 'about'];
const VIEWS = {
  register: {
    tab: 'register',
    eyebrow: 'Startup expo · Application',
    title: 'Register your startup',
    lede: 'Apply for a stall at the MGIT Startup & Innovation Expo. It takes about five minutes — have your logo and your team’s contact details ready.',
  },
  ideas: {
    tab: 'ideas',
    eyebrow: 'Idea Box · Submission',
    title: 'Share an idea',
    lede: 'Send us a problem you’ve noticed and how you would solve it, or answer a rapid-fire challenge from the organizers.',
  },
  status: {
    tab: 'status',
    eyebrow: 'Startup expo · Tracking',
    title: 'Track your application',
    lede: 'Check your decision and stall number, and read private feedback left for your team.',
  },
  admin: {
    tab: null,
    eyebrow: 'Organizer workspace',
    title: 'Submissions dashboard',
    lede: 'Review applications, manage the showcase and read every submission.',
  },
};
VIEWS.rapid = VIEWS.ideas;
VIEWS.organizer = VIEWS.admin;

const TABS = [
  ['', 'Overview'],
  ['register', 'Register a startup'],
  ['ideas', 'Share an idea'],
  ['status', 'Track application'],
];

const routeFromHash = () => decodeURIComponent(window.location.hash.slice(1));

function SubNav({ route }) {
  const current = OVERVIEW.includes(route) ? '' : VIEWS[route]?.tab;
  return (
    <nav className="ib-subnav" aria-label="Idea Box sections" data-lenis-prevent-horizontal>
      {TABS.map(([hash, label]) => (
        <a
          key={label}
          href={'#' + (hash || 'home')}
          className={'ib-subnav-link' + (current === hash ? ' is-on' : '')}
          aria-current={current === hash ? 'page' : undefined}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

const WAYS = [
  {
    icon: Store,
    title: 'Exhibit a startup',
    body: 'Apply for a stall at the expo. Accepted teams are listed in the showcase with their logo, idea and team.',
    href: '#register',
    cta: 'Register a startup',
    meta: '4 steps · about 5 min',
  },
  {
    icon: Lightbulb,
    title: 'Share an idea',
    body: 'No startup yet? Describe a problem you’ve noticed and how you would approach it. No team needed.',
    href: '#ideas',
    cta: 'Submit an idea',
    meta: 'Individual · open all year',
  },
  {
    icon: Zap,
    title: 'Rapid-fire challenge',
    body: 'Respond to a problem statement published by the organizers with a short, focused solution.',
    href: '#rapid',
    cta: 'View challenges',
    meta: null, // filled with the live count
  },
];

const PROCESS = [
  ['Apply', 'Submit your startup, team and stall needs. You get a reference and a private access code.'],
  ['Review', 'The Idea Incubator team reviews every application.'],
  ['Stall assigned', 'Accepted startups are published in the showcase and given a stall number.'],
  ['Exhibit', 'Present at the expo. Visitors leave feedback that reaches your private inbox.'],
];

function Overview({ startups, loading, openChallenges }) {
  const listed = startups.filter((x) => x.status === 'Approved' && !x.isDemo).length;
  return (
    <>
      <section className="ib-hero" aria-labelledby="ib-hero-title">
        <div className="ib-hero-copy">
        <span className="chip">
          <span className="ib-dot is-mint" aria-hidden="true" /> Idea Incubator · MGIT
        </span>
        <h1 id="ib-hero-title" className="ib-hero-title">
          The <span className="gradient-text">Idea Box</span>
        </h1>
        <p className="ib-hero-lede">
          Exhibit your startup at the MGIT Startup &amp; Innovation Expo, share an idea, or take on a rapid-fire
          challenge. Every submission is read by the Idea Incubator team.
        </p>
        <div className="ib-hero-cta">
          <a href="#register" className="btn btn-primary ib-btn">
            Register a startup <ArrowUpRight size={16} />
          </a>
          <a href="#ideas" className="btn btn-ghost ib-btn">
            Share an idea
          </a>
        </div>
        <ul className="ib-hero-meta">
          <li>
            <CalendarDays size={15} aria-hidden="true" /> Expo date to be announced
          </li>
          <li>
            <MapPin size={15} aria-hidden="true" /> MGIT, Hyderabad
          </li>
        </ul>
        </div>

        <aside className="ib-card ib-glance" aria-label="At a glance">
          <p className="eyebrow">At a glance</p>
          <dl>
            <div>
              <dt>
                <span className="ib-glance-icon" aria-hidden="true">
                  <Store size={16} strokeWidth={1.8} />
                </span>
                Startup applications
              </dt>
              <dd>
                <span className="ib-live" aria-hidden="true" /> Open
              </dd>
            </div>
            <div>
              <dt>
                <span className="ib-glance-icon" aria-hidden="true">
                  <ClipboardCheck size={16} strokeWidth={1.8} />
                </span>
                Startups in the showcase
              </dt>
              <dd>{loading ? '—' : listed || 'Opens soon'}</dd>
            </div>
            <div>
              <dt>
                <span className="ib-glance-icon" aria-hidden="true">
                  <Zap size={16} strokeWidth={1.8} />
                </span>
                Rapid-fire challenges
              </dt>
              <dd>{openChallenges === null ? '—' : openChallenges ? `${openChallenges} open` : 'Opens soon'}</dd>
            </div>
            <div>
              <dt>
                <span className="ib-glance-icon" aria-hidden="true">
                  <CalendarDays size={16} strokeWidth={1.8} />
                </span>
                Expo date
              </dt>
              <dd>To be announced</dd>
            </div>
            <div>
              <dt>
                <span className="ib-glance-icon" aria-hidden="true">
                  <MapPin size={16} strokeWidth={1.8} />
                </span>
                Venue
              </dt>
              <dd>MGIT, Hyderabad</dd>
            </div>
          </dl>
          <a href="#status" className="ib-glance-link">
            Already applied? Track your application <ArrowRight size={15} />
          </a>
        </aside>
      </section>

      <section className="ib-section" aria-labelledby="ways-title">
        <div className="ib-section-head">
          <p className="eyebrow ib-eyebrow">Take part</p>
          <h2 id="ways-title" className="ib-title">
            Three ways in
          </h2>
        </div>
        <div className="ib-ways">
          {WAYS.map(({ icon: Icon, title, body, href, cta, meta }, i) => (
            <a key={title} href={href} className="ib-card ib-way">
              <div className="ib-way-top">
                <span className="ib-way-icon" aria-hidden="true">
                  <Icon size={19} strokeWidth={1.7} />
                </span>
                <span className="eyebrow">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
              <div className="ib-way-foot">
                <span className="eyebrow">
                  {meta ??
                    (openChallenges === null
                      ? 'Organizer challenges'
                      : openChallenges
                        ? `${openChallenges} open ${openChallenges === 1 ? 'challenge' : 'challenges'}`
                        : 'Opens soon')}
                </span>
                <span className="ib-way-cta">
                  {cta} <ArrowRight size={15} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <Showcase startups={startups} loading={loading} />

      <section className="ib-section" id="about" aria-labelledby="process-title">
        <div className="ib-section-head">
          <p className="eyebrow ib-eyebrow">For startups</p>
          <h2 id="process-title" className="ib-title">
            From application to stall
          </h2>
        </div>
        <ol className="ib-process">
          {PROCESS.map(([t, d], i) => (
            <li key={t} className="ib-card">
              <span className="ib-process-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </li>
          ))}
        </ol>
        <div className="ib-card ib-track">
          <span className="ib-way-icon" aria-hidden="true">
            <ClipboardCheck size={19} strokeWidth={1.7} />
          </span>
          <div>
            <h3>Already applied?</h3>
            <p>Check your status, stall number and private feedback with your reference and access code.</p>
          </div>
          <a href="#status" className="btn btn-ghost ib-btn">
            Track application <ArrowUpRight size={15} />
          </a>
        </div>
      </section>
    </>
  );
}

export default function IdeaBoxPage() {
  const [route, setRoute] = useState(routeFromHash);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openChallenges, setOpenChallenges] = useState(null);

  const refresh = useCallback(
    () =>
      api('/startups')
        .then(setStartups)
        // Keep the showcase quiet while the API is unavailable; previously
        // loaded profiles stay visible and the next poll retries.
        .catch(() => {})
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    refresh();
    api('/problems')
      .then((p) => setOpenChallenges(p.length))
      .catch(() => {});

    const onHash = () => {
      const r = routeFromHash();
      setRoute(r);
      if (OVERVIEW.includes(r) && r && r !== 'home') {
        // In-page section of the overview: glide to it once it has rendered.
        setTimeout(() => {
          const el = document.getElementById(r);
          if (el) scrollToY(Math.max(0, el.getBoundingClientRect().top + window.scrollY - 110));
        }, 60);
      } else {
        scrollToY(0, { immediate: true });
      }
    };
    const onFocus = () => {
      if (!document.hidden) refresh();
    };
    const poll = setInterval(onFocus, 30000);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('focus', onFocus);
    if (OVERVIEW.includes(routeFromHash()) && routeFromHash()) onHash();
    return () => {
      clearInterval(poll);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const view = VIEWS[route];
  const isOverview = !view;

  return (
    <>
      <WaterLayer />
      <div className="ib">
        <Navbar onHome={false} active="Idea Box" />

        <main id="top">
          {isOverview ? (
            <>
              <div className="ib-wrap ib-top">
                <SubNav route={route} />
              </div>
              <div className="ib-wrap">
                <Overview startups={startups} loading={loading} openChallenges={openChallenges} />
              </div>
            </>
          ) : (
            <div className="ib-wrap ib-top">
              <SubNav route={route} />
              <header className="ib-page-head">
                <p className="eyebrow ib-eyebrow">{view.eyebrow}</p>
                <h1 className="ib-page-title">{view.title}</h1>
                <p className="ib-lede">{view.lede}</p>
              </header>
              {route === 'register' ? (
                <Registration />
              ) : route === 'ideas' || route === 'rapid' ? (
                <IdeaForms initialMode={route === 'rapid' ? 'rapid' : 'idea'} />
              ) : route === 'status' ? (
                <Status />
              ) : (
                <Admin refreshPublic={refresh} />
              )}
            </div>
          )}
        </main>

        <div className="ib-wrap">
          <nav className="ib-footer-links" aria-label="Idea Box shortcuts">
            <a href="#status">
              <ClipboardCheck size={15} aria-hidden="true" /> Track an application
            </a>
            <span aria-hidden="true" />
            <a href="#admin">
              <KeyRound size={15} aria-hidden="true" /> Organizer sign-in
            </a>
          </nav>
        </div>
        <Footer onHome={false} />
      </div>
    </>
  );
}
