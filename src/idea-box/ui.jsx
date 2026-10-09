import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Download, LoaderCircle, Upload, X } from 'lucide-react';
import { fieldVisible, memberFields } from '../../shared/schema.js';
import { prepareImage, readFile } from './image.js';

/* ═══════════════════════════════════════════════════════════════════════════
   IDEA BOX — UI PRIMITIVES
   Built on the site's own tokens (index.css): glass, pill buttons, mono
   eyebrows, the peri → mint → violet accent. Everything here is styled by
   idea-box.css under the `ib-` prefix so nothing leaks into other pages.
   ═══════════════════════════════════════════════════════════════════════════ */

export function Button({ children, primary = false, className = '', type = 'button', ...props }) {
  return (
    <button type={type} className={`btn ${primary ? 'btn-primary' : 'btn-ghost'} ib-btn ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Tag({ children, tone = '', className = '' }) {
  return <span className={`ib-tag ${tone ? 'is-' + tone : ''} ${className}`}>{children}</span>;
}

export function ErrorBox({ message }) {
  return message ? (
    <div role="alert" className="ib-error">
      {message}
    </div>
  ) : null;
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="ib-loading" role="status">
      <LoaderCircle className="ib-spin" size={18} /> {label}
    </div>
  );
}

/** Section / page heading in the site's voice: mono eyebrow, display title. */
export function Heading({ eyebrow, title, children, as: H = 'h2', className = '' }) {
  return (
    <div className={`ib-heading ${className}`}>
      {eyebrow && <p className="eyebrow ib-eyebrow">{eyebrow}</p>}
      <H className="ib-title">{title}</H>
      {children && <p className="ib-lede">{children}</p>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="ib-empty">
      {Icon && (
        <span className="ib-empty-icon" aria-hidden="true">
          <Icon size={22} strokeWidth={1.6} />
        </span>
      )}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

async function copyText(text, inputEl) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older iOS / insecure contexts: fall back to selecting + the legacy command.
    try {
      const el = inputEl || Object.assign(document.createElement('textarea'), { value: text });
      if (!inputEl) document.body.appendChild(el);
      el.select();
      el.setSelectionRange?.(0, text.length);
      const ok = document.execCommand?.('copy');
      if (!inputEl) el.remove();
      return !!ok;
    } catch {
      return false;
    }
  }
}

/** Read-only value with a labelled Copy button — used for reference and access codes. */
export function CopyField({ label, value }) {
  const [state, setState] = useState('idle'); // idle | copied | failed
  const inputRef = useRef(null);
  const id = 'copy-' + label.replace(/\s+/g, '-').toLowerCase();
  const copy = async () => {
    setState((await copyText(value, inputRef.current)) ? 'copied' : 'failed');
    setTimeout(() => setState('idle'), 2000);
  };
  return (
    <div className="ib-copy">
      <label className="ib-label" htmlFor={id}>
        {label}
      </label>
      <div className="ib-copy-row">
        <input id={id} ref={inputRef} readOnly value={value} className="is-mono" onFocus={(e) => e.target.select()} />
        <button
          type="button"
          className={'ib-copy-btn' + (state === 'copied' ? ' is-done' : '')}
          onClick={copy}
          aria-label={`Copy ${label}`}
        >
          {state === 'copied' ? <Check size={15} /> : <Copy size={15} />}
          {state === 'copied' ? 'Copied' : state === 'failed' ? 'Press Ctrl+C' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

/** Copies several labelled values at once, or saves them as a text file. */
export function CopyAll({ items, filename = 'application-details.txt' }) {
  const [state, setState] = useState('idle');
  const text = items.map(([label, value]) => `${label}: ${value}`).join('\n');
  const copy = async () => {
    setState((await copyText(text)) ? 'copied' : 'failed');
    setTimeout(() => setState('idle'), 2000);
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([text + '\n'], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="ib-actions">
      <button type="button" className="btn btn-ghost ib-btn" onClick={copy}>
        {state === 'copied' ? <Check size={15} /> : <Copy size={15} />}
        {state === 'copied' ? 'Copied both' : state === 'failed' ? 'Select and copy manually' : 'Copy both'}
      </button>
      <button type="button" className="btn btn-ghost ib-btn" onClick={download}>
        <Download size={15} /> Save as .txt
      </button>
    </div>
  );
}

/* ─── Slide-in panel ─────────────────────────────────────────────────────────
   Right-hand drawer on desktop, full-height sheet on phones. Locks page scroll
   (smoothScroll.js honours body overflow:hidden), traps focus, closes on Esc
   or a backdrop tap, and returns focus to whatever opened it.            */
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const prev = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const key = (e) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key !== 'Tab' || !ref.current) return;
      const items = [...ref.current.querySelectorAll('button,a[href],input,select,textarea')].filter(
        (x) => !x.disabled && x.offsetParent !== null
      );
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1);
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', key);
      prev?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="ib-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section
        className={'ib-drawer' + (wide ? ' is-wide' : '')}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        tabIndex={-1}
      >
        <header className="ib-drawer-bar">
          <span className="eyebrow">{title}</span>
          <button type="button" className="ib-icon-btn" aria-label="Close" onClick={onClose}>
            <X size={17} />
          </button>
        </header>
        <div className="ib-drawer-body" data-lenis-prevent>
          {children}
        </div>
      </section>
    </div>,
    document.body
  );
}

/** Simple labelled control for the hand-written forms (ideas, feedback…). */
export function TextField({ label, name, type = 'text', required = true, rows, full = false, hint, ...rest }) {
  const id = useId();
  return (
    <div className={'ib-field' + (full ? ' is-full' : '')}>
      <label htmlFor={id} className="ib-label">
        {label} {required ? <em aria-hidden="true">*</em> : <small>optional</small>}
      </label>
      {type === 'textarea' ? (
        <textarea id={id} name={name} required={required} rows={rows || 3} maxLength={6000} {...rest} />
      ) : (
        <input id={id} name={name} type={type} required={required} maxLength={500} {...rest} />
      )}
      {hint && <small className="ib-hint">{hint}</small>}
    </div>
  );
}

/* ─── Schema-driven field (registration form) ────────────────────────────────
   Field definitions live in shared/schema.js and are validated identically on
   the server, so this only renders and reads files — validation stays shared. */
export function Field({ field, data, onChange, error }) {
  const [key, label, type, required, options] = field;
  const fieldId = useId();
  const [fileError, setFileError] = useState('');
  const [preparing, setPreparing] = useState(false);
  const isDocument = type === 'documents';
  const multiple = type === 'files' || isDocument;

  const upload = async (e) => {
    setFileError('');
    const files = [...e.target.files];
    e.target.value = ''; // allow re-picking the same file after removing it
    if (!files.length) return;
    if (files.length > (multiple ? 3 : 1)) {
      setFileError(multiple ? 'Choose up to 3 files.' : 'Choose one logo.');
      return;
    }
    const allowed = ['image/png', 'image/jpeg', 'image/webp', ...(isDocument ? ['application/pdf'] : [])];
    // Photos are shrunk in the browser before upload, so originals up to 12 MB
    // are fine; PDFs can't be shrunk and keep the 2 MB limit.
    const tooBig = (f) => f.size > (f.type === 'application/pdf' ? 2 : 12) * 1024 * 1024;
    if (files.some((f) => !allowed.includes(f.type) || tooBig(f))) {
      setFileError(
        isDocument
          ? 'Use PDF, PNG, JPEG or WebP files (PDFs under 2 MB, images under 12 MB).'
          : 'Use a PNG, JPEG or WebP image under 12 MB.'
      );
      return;
    }
    setPreparing(true);
    const values = await Promise.all(
      files.map((f) =>
        f.type === 'application/pdf' ? readFile(f) : prepareImage(f, { maxDim: type === 'file' ? 800 : 1600 })
      )
    )
      .catch((err) => {
        setFileError(err.message);
        return null;
      })
      .finally(() => setPreparing(false));
    if (values) onChange(key, type === 'file' ? values[0] : values);
  };

  if (!fieldVisible(key, data)) return null;

  const describedBy = error || fileError ? fieldId + '-error' : undefined;
  const errorText = (error || fileError) && (
    <small id={fieldId + '-error'} className="ib-field-error" role="alert">
      {error || fileError}
    </small>
  );

  if (type === 'members') {
    const count = Math.min(99, Math.max(0, Number(data.teamSize) - 1)) || 0;
    return (
      <div className="ib-field is-full">
        <span className="ib-label">{label}</span>
        <div className="ib-members">
          {Array.from({ length: count }, (_, index) => (
            <fieldset className="ib-member" key={index}>
              <legend className="eyebrow">Member {index + 2}</legend>
              <div className="ib-form-grid">
                {memberFields.map((memberField) => (
                  <Field
                    key={memberField[0]}
                    field={memberField}
                    data={data.members?.[index] || {}}
                    onChange={(memberKey, value) =>
                      onChange(
                        'members',
                        Array.from({ length: count }, (_, i) =>
                          i === index ? { ...data.members?.[i], [memberKey]: value } : data.members?.[i] || {}
                        )
                      )
                    }
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        {errorText}
      </div>
    );
  }

  if (type === 'boolean')
    return (
      <div className="ib-field is-full">
        <label className="ib-check-row" htmlFor={fieldId}>
          <input
            id={fieldId}
            type="checkbox"
            checked={!!data[key]}
            aria-required={!!required}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            onChange={(e) => onChange(key, e.target.checked)}
          />
          <span>
            {label} {required && <em aria-hidden="true">*</em>}
          </span>
        </label>
        {errorText}
      </div>
    );

  const common = {
    id: fieldId,
    name: key,
    value: data[key] || '',
    onChange: (e) => onChange(key, e.target.value),
    'aria-required': !!required,
    'aria-invalid': !!error,
    'aria-describedby': describedBy,
  };
  const full = ['textarea', 'file', 'files', 'documents', 'checks'].includes(type);
  const isFile = ['file', 'files', 'documents'].includes(type);

  return (
    <div className={'ib-field' + (full ? ' is-full' : '')}>
      {type === 'checks' ? (
        <span className="ib-label" id={fieldId + '-label'}>
          {label} {required ? <em aria-hidden="true">*</em> : <small>optional</small>}
        </span>
      ) : (
        <label htmlFor={fieldId} className="ib-label">
          {label} {required ? <em aria-hidden="true">*</em> : <small>optional</small>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea {...common} rows={4} maxLength={6000} />
      ) : type === 'select' ? (
        <select {...common}>
          <option value="">Select an option</option>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : type === 'checks' ? (
        <div className="ib-checks" role="group" aria-labelledby={fieldId + '-label'} aria-describedby={describedBy}>
          {options.map((o) => (
            <label key={o} className="ib-check-pill">
              <input
                type="checkbox"
                checked={data[key]?.includes(o) || false}
                onChange={(e) =>
                  onChange(
                    key,
                    e.target.checked ? [...(data[key] || []), o] : (data[key] || []).filter((v) => v !== o)
                  )
                }
              />
              <span>{o}</span>
            </label>
          ))}
        </div>
      ) : isFile ? (
        <>
          <div className={'ib-drop' + (error || fileError ? ' is-invalid' : '')}>
            <Upload size={20} strokeWidth={1.7} aria-hidden="true" />
            <strong>
              {preparing
                ? 'Preparing image…'
                : isDocument
                  ? 'Choose supporting documents'
                  : data[key]
                    ? 'Replace logo'
                    : 'Choose your startup logo'}
            </strong>
            <small>
              {isDocument ? 'PDF, PNG, JPG or WebP · max 3 files' : 'PNG, JPG or WebP · large photos are shrunk automatically'}
            </small>
            <input
              id={fieldId}
              type="file"
              aria-required={!!required}
              aria-invalid={!!error}
              aria-describedby={describedBy}
              accept={isDocument ? 'application/pdf,image/png,image/jpeg,image/webp' : 'image/png,image/jpeg,image/webp'}
              multiple={multiple}
              onChange={upload}
            />
          </div>
          {data[key] && (
            <div className="ib-previews">
              {(multiple ? data[key] : [data[key]]).map((f, i) => (
                <div key={i} className="ib-preview">
                  {!isDocument && <img src={f.data} alt="" />}
                  <span>{f.name}</span>
                  <button
                    type="button"
                    className="ib-text-btn"
                    aria-label={'Remove ' + f.name}
                    onClick={() => {
                      onChange(key, multiple ? data[key].filter((_, j) => i !== j) : null);
                      setFileError('');
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <input
          {...common}
          type={type}
          inputMode={key === 'teamSize' ? 'numeric' : type === 'tel' ? 'tel' : undefined}
          autoComplete={
            type === 'email' ? 'email' : type === 'tel' ? 'tel' : key === 'founderName' ? 'name' : 'off'
          }
          maxLength={type === 'text' ? 500 : undefined}
        />
      )}
      {errorText}
    </div>
  );
}
