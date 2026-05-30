import './style.css'
import { loadCharts } from './charts/load_charts.js'

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
      // Steps are visually positioned beneath a 55vh sticky chart, so
      // the focus band needs to sit in the lower portion of the viewport
      // (~70–90% from the top).
      { rootMargin: '-70% 0px -10% 0px', threshold: 0 }
    )

    steps.forEach((step) => observer.observe(step))
    // Seed initial state so D3 code can read it on first render
    sticky.dataset.activeStep = steps[0].dataset.step
  })
}

function boot() {
  initScrollytelling()
  loadCharts()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}
