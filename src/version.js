import { createContext, useContext } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   VERSION SWITCH — shared state
   ───────────────────────────────────────────────────────────────────────────
   Lets you flip the whole site between two builds at runtime, so nothing is
   lost if you prefer the earlier take:

     v2 — shard sphere in both the loader and the hero; flat delegate tiles.
     v3 — sphere only in the loader (dismantles + remantles); 3D voxel
          Idea Incubator logo in the hero; department cubes for the roster.

   The provider lives in components/VersionProvider.jsx. This file holds no
   components on purpose, so React Fast Refresh keeps working.
   ═══════════════════════════════════════════════════════════════════════════ */

export const VERSIONS = {
  v2: { id: 'v2', label: 'v2', name: 'Sphere hero · tile roster' },
  v3: { id: 'v3', label: 'v3', name: 'Logo hero · cube roster' },
};

export const STORAGE_KEY = 'nec-version';
export const DEFAULT_VERSION = 'v3';

export const VersionContext = createContext({
  version: DEFAULT_VERSION,
  setVersion: () => {},
});

export function useVersion() {
  return useContext(VersionContext);
}
