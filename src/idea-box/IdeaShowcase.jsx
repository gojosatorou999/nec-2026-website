import { useState } from 'react';
import { LayoutGrid, Lightbulb, Mail, Search } from 'lucide-react';
import { categories } from '../../shared/schema.js';
import { Button, EmptyState, Heading, Loading } from './ui.jsx';

const classLine = (idea) => [idea.department, idea.year].filter(Boolean).join(', ');

/* A brief only: the full write-up stays with the organizers. Interested people
   reach the owner directly by email. */
function IdeaCard({ idea }) {
  const first = idea.name.split(/\s+/)[0] || 'the owner';
  return (
    <article className="ib-card ib-idea">
      <span className="ib-idea-icon" aria-hidden="true">
        <Lightbulb size={18} strokeWidth={1.7} />
      </span>
      <div className="ib-idea-meta">{idea.category || 'Student idea'}</div>
      <h3>{idea.title}</h3>
      <p className="ib-idea-line">{idea.brief}</p>
      <div className="ib-idea-owner">
        <strong>{idea.name}</strong>
        {classLine(idea) && <span>{classLine(idea)}</span>}
      </div>
      {idea.email && (
        <a
          className="btn btn-ghost ib-btn ib-idea-contact"
          href={`mailto:${idea.email}?subject=${encodeURIComponent('About your idea: ' + idea.title)}`}
        >
          <Mail size={15} aria-hidden="true" /> Contact {first}
          <span className="ib-idea-email">{idea.email}</span>
        </a>
      )}
    </article>
  );
}

export default function IdeaShowcase({ ideas, loading }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = ideas.filter(
    (i) =>
      (!category || i.category === category) &&
      (!q || [i.title, i.brief, i.name, i.department, i.category].join(' ').toLowerCase().includes(q))
  );
  const present = categories.filter((c) => ideas.some((i) => i.category === c));

  return (
    <section id="ideas-showcase" className="ib-section" aria-labelledby="ideas-showcase-title">
      <div className="ib-section-head">
        <Heading eyebrow="Showcase" title={<span id="ideas-showcase-title">Student ideas</span>}>
          A short brief of ideas the organizers have featured, shown with each student’s permission. Interested in one?
          Contact its owner directly.
        </Heading>
      </div>

      {ideas.length > 0 && (
        <>
          <div className="ib-toolbar">
            <label className="ib-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search student ideas"
                placeholder="Search by title, topic or name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
          {present.length > 1 && (
            <div className="ib-chips" role="group" aria-label="Idea category">
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
          <p className="ib-count eyebrow" aria-live="polite">
            {filtered.length} of {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
          </p>
        </>
      )}

      {loading && !ideas.length ? (
        <Loading label="Loading student ideas…" />
      ) : !ideas.length ? (
        <EmptyState
          icon={Lightbulb}
          title="Featured ideas appear here"
          action={
            <a className="btn btn-primary ib-btn" href="#ideas">
              Share an idea
            </a>
          }
        >
          The organizers feature standout ideas from the Idea Box. Yours could be the first.
        </EmptyState>
      ) : filtered.length ? (
        <div className="ib-grid">
          {filtered.map((i) => (
            <IdeaCard key={i.id} idea={i} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No ideas match"
          action={
            <Button
              onClick={() => {
                setQuery('');
                setCategory('');
              }}
            >
              Clear search and filters
            </Button>
          }
        >
          Try a different search term or category.
        </EmptyState>
      )}
    </section>
  );
}
