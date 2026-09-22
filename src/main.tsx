import { StrictMode, Suspense, lazy, useEffect, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/*
 * Routing is done with a plain pathname check rather than react-router.
 *
 * The site only has two routes ("/" and "/admin"), and the admin page
 * navigates with ordinary <a href> links, so a router was pulling a whole
 * routing library into the bundle that every visitor had to download before
 * anything could render. Netlify's SPA fallback (public/_redirects) still
 * serves index.html for /admin, so a pathname check is all that is needed.
 */
const AdminPage = lazy(() =>
  import('./pages/AdminPage.tsx').then((m) => ({ default: m.AdminPage }))
)

const isAdminRoute = window.location.pathname.replace(/\/+$/, '').endsWith('/admin')

/**
 * Dismisses the static splash painted by index.html.
 *
 * This lives above the route switch on purpose. The splash covers the whole
 * viewport, so it has to be cleared on every route - if only the marketing page
 * handled it, /admin would sit behind the splash until its CSS failsafe
 * expired eight seconds later.
 *
 * Effects run child-first, so by the time this fires the page below is mounted
 * and there is real content to reveal.
 */
function BootGate({ children }: { children: ReactNode }) {
  useEffect(() => {
    const splash = document.getElementById('boot-splash')
    if (!splash) return

    splash.classList.add('is-hidden')

    const remove = () => splash.remove()
    splash.addEventListener('transitionend', remove, { once: true })
    // Transitionend does not fire when transitions are disabled (for example
    // under prefers-reduced-motion), so removal cannot depend on it alone.
    window.setTimeout(remove, 600)
  }, [])

  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BootGate>
      {isAdminRoute ? (
        <Suspense
          fallback={
            <div className="min-h-screen bg-money-green flex items-center justify-center">
              <p className="font-display font-black uppercase text-off-white tracking-wider">
                Loading admin…
              </p>
            </div>
          }
        >
          <AdminPage />
        </Suspense>
      ) : (
        <App />
      )}
    </BootGate>
  </StrictMode>,
)
