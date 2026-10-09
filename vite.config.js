import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from 'node:process'

/* The Idea Box API (server/app.js, an Express app) is mounted on /api inside
   the Vite dev and preview servers, so `npm run dev` runs the whole site with
   one command. On Vercel the same app runs as a function via api/index.js.
   Secrets come from .env (see .env.example) and never reach the client bundle:
   only VITE_-prefixed variables are exposed to the browser, and none are used. */
function ideaBoxApi() {
  let app
  const mount = (server) => {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith('/api')) return next()
      try {
        if (!app) {
          try { loadEnvFile() } catch (e) { if (e.code !== 'ENOENT') throw e }
          // Absolute URL: the config file is bundled before it runs, so a bare
          // relative import would resolve against the bundle, not this file.
          app = (await import(new URL('./server/app.js', import.meta.url).href)).default
        }
        app(req, res, next)
      } catch (error) {
        next(error)
      }
    })
  }
  return { name: 'idea-box-api', configureServer: mount, configurePreviewServer: mount }
}

// Real pages, not one SPA with anchors:
//   /               → the main site
//   /winners.html   → the NEC 2026 winners, a genuine navigation away
//   /about.html     → about the club and the four bodies behind NEC 2026
//   /idea-box.html  → the Idea Box: startup expo registration, idea and
//                     rapid-fire submissions, application tracking and the
//                     organizer dashboard (backed by /api)
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ideaBoxApi(),
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
        main:    fileURLToPath(new URL('./index.html',    import.meta.url)),
        winners: fileURLToPath(new URL('./winners.html',  import.meta.url)),
        about:   fileURLToPath(new URL('./about.html',    import.meta.url)),
        timeline: fileURLToPath(new URL('./timeline.html', import.meta.url)),
        blog:    fileURLToPath(new URL('./blog.html',     import.meta.url)),
        ideaBox: fileURLToPath(new URL('./idea-box.html', import.meta.url)),
      },
    },
  },
})
