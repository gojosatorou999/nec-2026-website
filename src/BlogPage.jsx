import { useState } from 'react';
import { BrandLockup, IconArrow } from './components/BrandLogo';
import WaterLayer from './components/WaterLayer';
import POSTS_FROM_FILE from './data/blogs.json';

/* ═══════════════════════════════════════════════════════════════════════════
   BLOG PAGE — public read-only
   Posts are maintained in src/data/blogs.json and pushed to Git.
   ═══════════════════════════════════════════════════════════════════════════ */

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-3)' }}>
      <div style={{ fontSize: '3rem', marginBottom: 18 }}>✍️</div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--text-2)', marginBottom: 8 }}>
        No posts yet
      </p>
      <p style={{ fontSize: '0.9rem' }}>Check back soon — the team is writing.</p>
    </div>
  );
}

/* ─── Blog Card ───────────────────────────────────────────────────────────── */
function BlogCard({ post, onClick }) {
  return (
    <article
      className="blog-card"
      onClick={() => onClick(post)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(post)}
      aria-label={`Read: ${post.title}`}
    >
      {post.coverUrl && (
        <div className="blog-card-cover">
          <img src={post.coverUrl} alt={`Cover for ${post.title}`} loading="lazy" />
        </div>
      )}
      <div className="blog-card-body">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {post.tags?.map((tag) => (
            <span key={tag} className="chip" style={{ fontSize: '0.58rem' }}>{tag}</span>
          ))}
        </div>
        <h2 className="blog-card-title">{post.title}</h2>
        <p className="blog-card-excerpt">{post.excerpt}</p>
        <div className="blog-card-meta">
          <span className="eyebrow">{post.author}</span>
          <span className="eyebrow" style={{ color: 'var(--text-3)' }}>·</span>
          <span className="eyebrow">{formatDate(post.createdAt)}</span>
        </div>
        <span className="btn btn-ghost blog-card-cta" style={{ marginTop: 18, padding: '9px 20px', fontSize: '0.82rem' }}>
          Read more <IconArrow />
        </span>
      </div>
    </article>
  );
}

/* ─── Full Post Modal ─────────────────────────────────────────────────────── */
function PostModal({ post, onClose }) {
  return (
    <>
      <div className="panel-scrim" data-open="true" onClick={onClose} />
      <div className="post-modal" role="dialog" aria-modal="true" aria-labelledby="post-modal-title">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close post">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {post.coverUrl && (
          <img src={post.coverUrl} alt={`Cover for ${post.title}`} className="post-modal-cover" />
        )}

        <div className="post-modal-inner">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {post.tags?.map((tag) => <span key={tag} className="chip">{tag}</span>)}
          </div>
          <h1 id="post-modal-title" className="post-modal-title">{post.title}</h1>
          <div className="post-modal-meta">
            <span className="eyebrow">{post.author}</span>
            <span className="eyebrow" style={{ color: 'var(--text-3)' }}>·</span>
            <span className="eyebrow">{formatDate(post.createdAt)}</span>
          </div>
          <div className="hairline" style={{ margin: '24px 0' }} />
          <div className="post-modal-content">
            {post.content.split('\n').map((para, i) =>
              para.trim() ? <p key={i}>{para}</p> : <br key={i} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function BlogPage() {
  const posts = [...POSTS_FROM_FILE].reverse(); // newest first
  const [activePost, setActivePost] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = posts.filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <WaterLayer />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
        {/* ── Navbar ── */}
        <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60, padding: '16px clamp(14px, 4vw, 34px)' }}>
          <nav
            className="glass glass-sheen"
            style={{
              maxWidth: 1240, margin: '0 auto',
              padding: '10px 12px 10px 16px',
              borderRadius: 'var(--r-pill)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}
          >
            <a href="/" style={{ textDecoration: 'none' }} aria-label="NEC 2026 — home">
              <BrandLockup size={34} />
            </a>
            <a href="/" className="btn btn-ghost" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>← Home</a>
          </nav>
        </header>

        {/* ── Hero ── */}
        <section style={{
          paddingTop: 'clamp(110px, 18vh, 160px)',
          paddingBottom: 'clamp(40px, 6vh, 72px)',
          paddingLeft: 'clamp(20px, 6vw, 80px)',
          paddingRight: 'clamp(20px, 6vw, 80px)',
          textAlign: 'center',
          maxWidth: 860,
          margin: '0 auto',
        }}>
          <p className="eyebrow" style={{ color: 'var(--peri)', marginBottom: 16 }}>Idea Incubator · Blog</p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.4rem, 7vw, 5rem)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            marginBottom: 22,
          }}>
            Stories from the <span className="gradient-text">NEC 2026</span> journey
          </h1>
          <p style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.12rem)', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
            Insights, updates, and lessons from the Idea Incubator team on the road to IIT Bombay.
          </p>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 480, margin: '32px auto 0' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>🔍</span>
            <input
              id="blog-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts…"
              className="blog-search-input"
              style={{ paddingLeft: 44, width: '100%' }}
              aria-label="Search blog posts"
            />
          </div>
        </section>

        <div className="hairline" style={{ maxWidth: 900, margin: '0 auto', opacity: 0.4 }} />

        {/* ── Post grid ── */}
        <main style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(40px, 6vh, 80px) clamp(20px, 6vw, 80px)' }}>
          {filtered.length === 0 ? <EmptyState /> : (
            <div className="blog-grid">
              {filtered.map((post) => (
                <BlogCard key={post.id} post={post} onClick={setActivePost} />
              ))}
            </div>
          )}
        </main>

        <footer style={{
          textAlign: 'center',
          padding: 'clamp(30px,5vh,60px) 20px',
          color: 'var(--text-3)',
          fontSize: '0.82rem',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.1em',
        }}>
          © 2026 Idea Incubator, MGIT · All rights reserved
        </footer>
      </div>

      {activePost && (
        <PostModal post={activePost} onClose={() => setActivePost(null)} />
      )}

      <style>{`
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
          gap: clamp(20px, 3vw, 32px);
        }

        .blog-card {
          position: relative;
          display: flex; flex-direction: column;
          border-radius: var(--r-xl);
          background: linear-gradient(180deg, rgba(24,32,52,0.98), rgba(13,18,31,0.98));
          border: 1px solid rgba(255,255,255,0.12);
          overflow: hidden; cursor: pointer;
          transition: transform 0.45s var(--ease-expo), border-color 0.35s var(--ease-soft), box-shadow 0.45s var(--ease-expo);
          box-shadow: 0 20px 60px -24px rgba(0,0,0,0.9);
        }
        .blog-card::before {
          content: ''; position: absolute; inset: 0 0 auto 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--peri), transparent);
          opacity: 0.6;
        }
        .blog-card:hover {
          transform: translateY(-6px);
          border-color: rgba(163,178,255,0.3);
          box-shadow: 0 32px 80px -24px rgba(0,0,0,0.95);
        }
        .blog-card-cover { width:100%; aspect-ratio:16/9; overflow:hidden; }
        .blog-card-cover img { width:100%; height:100%; object-fit:cover; transition: transform 0.6s var(--ease-expo); }
        .blog-card:hover .blog-card-cover img { transform: scale(1.04); }
        .blog-card-body { padding: clamp(20px,3vw,28px); display:flex; flex-direction:column; flex:1; }
        .blog-card-title {
          font-family: var(--font-display);
          font-size: clamp(1.15rem, 2.2vw, 1.4rem);
          font-weight: 600; letter-spacing: -0.025em; line-height: 1.2;
          margin-top: 12px; color: var(--text);
        }
        .blog-card-excerpt {
          margin-top: 10px; font-size: 0.9rem; color: var(--text-2); line-height: 1.7;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
        }
        .blog-card-meta { margin-top:16px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .blog-card-cta { align-self: flex-start; }

        .post-modal {
          position: fixed; top:0; right:0; z-index:90;
          height:100dvh; width: min(680px,100vw);
          display:flex; flex-direction:column;
          overflow-y:auto; overscroll-behavior:contain;
          background: rgba(10,14,24,0.94);
          border-left: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
        }
        .post-modal-cover { width:100%; aspect-ratio:16/9; object-fit:cover; flex-shrink:0; }
        .post-modal-inner { padding: clamp(28px,5vw,52px); padding-top: clamp(64px,8vw,80px); flex:1; }
        .post-modal-title {
          font-family: var(--font-display);
          font-size: clamp(1.7rem,4vw,2.5rem);
          font-weight:700; letter-spacing:-0.04em; line-height:1.1; margin-bottom:14px;
        }
        .post-modal-meta { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .post-modal-content { font-size:1.02rem; line-height:1.85; color: var(--text-2); }
        .post-modal-content p { margin-bottom: 1.2em; }

        .modal-close-btn {
          position:absolute; top:16px; right:16px; z-index:2;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
          border-radius: var(--r-pill); width:34px; height:34px;
          display:grid; place-items:center; cursor:pointer;
          transition: background 0.3s; color: var(--text-2);
        }
        .modal-close-btn:hover { background: rgba(255,255,255,0.14); }

        .blog-search-input {
          width:100%; padding: 12px 16px; border-radius: var(--r-sm);
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.13);
          color: var(--text); font-family: var(--font-body); font-size:0.95rem;
          transition: border-color 0.3s; outline:none;
        }
        .blog-search-input::placeholder { color: var(--text-3); }
        .blog-search-input:focus { border-color: rgba(163,178,255,0.5); }
      `}</style>
    </>
  );
}
