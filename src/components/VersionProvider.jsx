import { useCallback, useEffect, useState } from 'react';
import { VersionContext, VERSIONS, STORAGE_KEY, DEFAULT_VERSION } from '../version';

/** Holds the active build and persists the choice to localStorage. */
export default function VersionProvider({ children }) {
  const [version, setVersionState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored && VERSIONS[stored] ? stored : DEFAULT_VERSION;
    } catch {
      return DEFAULT_VERSION;
    }
  });

  const setVersion = useCallback((next) => {
    if (!VERSIONS[next]) return;
    setVersionState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked (private mode) — the choice just won't persist */
    }
  }, []);

  // Expose on <html> so CSS can react to the build if it ever needs to
  useEffect(() => {
    document.documentElement.dataset.build = version;
  }, [version]);

  return (
    <VersionContext.Provider value={{ version, setVersion }}>
      {children}
    </VersionContext.Provider>
  );
}
