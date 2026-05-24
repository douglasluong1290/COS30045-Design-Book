import './style.css'
import { initCh1 } from './charts/ch1-trend.js'
import { initCh2 } from './charts/ch2-states.js'
import { initCh3 } from './charts/ch3-demographics.js'
import { initCh4 } from './charts/ch4-roaduser.js'

/* ====================================================================
   Scrollytelling — drive each chart-sticky from the active step
   ==================================================================== */

function initScrollytelling() {
  const scrollies = document.querySelectorAll('.scrolly')
  if (!scrollies.length || !('IntersectionObserver' in window)) return

  scrollies.forEach((scrolly) => {
    const steps = scrolly.querySelectorAll('.step')
    const sticky = scrolly.querySelector('.chart-sticky')
    if (!steps.length || !sticky) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          steps.forEach((s) => s.classList.remove('is-active'))
          entry.target.classList.add('is-active')
          sticky.dataset.activeStep = entry.target.dataset.step
          sticky.dispatchEvent(
            new CustomEvent('stepchange', {
              detail: { step: entry.target.dataset.step },
            })
          )
        })
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    )

    steps.forEach((step) => observer.observe(step))
    // Seed initial state so D3 code can read it on first render
    sticky.dataset.activeStep = steps[0].dataset.step
  })
}

function initCharts() {
  // Each chart owns its mount + data load; failures are isolated.
  ;[initCh1, initCh2, initCh3, initCh4].forEach((fn) =>
    Promise.resolve()
      .then(() => fn())
      .catch((err) => console.error(`${fn.name} failed:`, err))
  )
}

function boot() {
  initScrollytelling()
  initCharts()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
