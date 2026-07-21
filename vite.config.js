import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// Three real pages, not one SPA with anchors:
//   /               → the main site
//   /winners.html   → the NEC 2026 winners, a genuine navigation away
//   /about.html     → about the club, with the speedometer timeline below it
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Avoid crashes if default port 5173 is busy — try next available port
    strictPort: false,
    watch: {
      // Without this a production build rewrites dist/*.html and yanks a
      // full page reload out from under whatever you have open in the browser.
      ignored: ['**/dist/**'],
    },
  },
  build: {
    rollupOptions: {
      input: {
        main:    fileURLToPath(new URL('./index.html',   import.meta.url)),
        winners: fileURLToPath(new URL('./winners.html', import.meta.url)),
        about:   fileURLToPath(new URL('./about.html',   import.meta.url)),
        timeline: fileURLToPath(new URL('./timeline.html', import.meta.url)),
      },
    },
  },
})
