import './style.css'

document.querySelector('#app').innerHTML = `
<header class="story-header">
  <p class="kicker">COS30045 · Data Visualisation · Design Book</p>
  <h1>Who gets hurt on Australian roads — and why it keeps getting worse</h1>
  <p class="lede">
    A decade of BITRE hospitalisation data, traced from the national trend down to the
    individual: state by state, age by age, crash by crash. Scroll to read.
  </p>
  <nav class="story-nav" aria-label="Chapter navigation">
    <a href="#chapter-1"><span>01</span> National picture</a>
    <a href="#chapter-2"><span>02</span> Where</a>
    <a href="#chapter-3"><span>03</span> Who</a>
    <a href="#chapter-4"><span>04</span> How</a>
    <a href="#chapter-5"><span>05</span> Convergence</a>
  </nav>
</header>

<div class="ticks"></div>

<!-- ============================================================ -->
<!-- CHAPTER 1 — THE NATIONAL PICTURE                              -->
<!-- ============================================================ -->
<section class="chapter" id="chapter-1">
  <div class="chapter-head">
    <span class="chapter-number">01</span>
    <p class="chapter-label">Opening — the national picture</p>
    <h2>Australia's road injury burden grew for eight consecutive years</h2>
  </div>

  <div class="scrolly">
    <div class="steps">

      <div class="step is-active" data-step="1">
        <p class="step-eyebrow">2011 → 2019</p>
        <p>
          Between 2011 and 2019, the number of Australians hospitalised after a road
          crash climbed <strong>every single year</strong> — from roughly
          <strong>16,400</strong> cases to over <strong>19,500</strong>. A near-20%
          rise across eight years, with no dip to interrupt it.
        </p>
      </div>

      <div class="step" data-step="2">
        <p class="step-eyebrow">2020 — the natural experiment</p>
        <p>
          Then COVID-19 lockdowns hollowed out the roads. Traffic volumes collapsed,
          and so did the case count — a <strong>5% fall</strong> against the
          pre-pandemic trajectory. For one year, the curve broke.
        </p>
      </div>

      <div class="step" data-step="3">
        <p class="step-eyebrow">2021 — record high</p>
        <p>
          But the dip lasted exactly as long as the lockdowns did. As soon as
          behaviour returned to normal, 2021 became the
          <strong>highest year on record</strong>. The problem is structural — the
          2020 reprieve was behavioural, not progress.
        </p>
        <ul class="kpi-strip kpi-strip--inline">
          <li><span class="kpi-value">+19%</span><span class="kpi-label">2011 → 2019</span></li>
          <li><span class="kpi-value">−5%</span><span class="kpi-label">2020 dip</span></li>
          <li><span class="kpi-value">2021</span><span class="kpi-label">record high</span></li>
        </ul>
      </div>

    </div>

    <div class="chart-sticky">
      <figure class="chart-placeholder" id="chart-1-trend" data-chart="annotated-line">
        <figcaption class="placeholder-caption">Chart 01 · Annotated national trend line</figcaption>
        <div class="placeholder-canvas" aria-label="Chart placeholder">
          <p class="placeholder-hint">D3 placeholder</p>
        </div>
      
      </figure>
    </div>
  </div>
</section>

<div class="ticks"></div>

<!-- ============================================================ -->
<!-- CHAPTER 2 — WHERE                                             -->
<!-- ============================================================ -->
<section class="chapter" id="chapter-2">
  <div class="chapter-head">
    <span class="chapter-number">02</span>
    <p class="chapter-label">Chapter 2 — where</p>
    <h2>The burden is not shared equally across states</h2>
  </div>

  <div class="scrolly">
    <div class="steps">

      <div class="step is-active" data-step="1">
        <p class="step-eyebrow">Eight states, eight trajectories</p>
        <p>
          Splitting the national figure by state reveals eight very different stories.
          Some climbed steadily, some plateaued, some grew at staggering rates. Watch
          what each panel does across the decade.
        </p>
      </div>

      <div class="step" data-step="2">
        <p class="step-eyebrow">The VIC / NSW crossover</p>
        <p>
          NSW and VIC dominate the raw counts — but around <strong>2018</strong>,
          Victoria <strong>overtook NSW</strong> and has stayed higher since.
          Their populations are similar, so the gap isn't about size.
        </p>
      </div>

      <div class="step" data-step="3">
        <p class="step-eyebrow">Queensland's quiet climb</p>
        <p>
          Queensland shows the steepest sustained growth: <strong>+65% across the
          decade</strong>. That's part real worsening, part population growth — the
          state grew fast over the period and our population figure is a 2021
          snapshot.
        </p>
      </div>

      <div class="step" data-step="4">
        <p class="step-eyebrow">The Northern Territory disproportion</p>
        <p>
          NT looks tiny in absolute terms, but watch the population reference
          column. The case line is short — the population bar is even shorter. NT
          carries a disproportionate burden once you read the two together.
        </p>
        <p class="caveat">
          Raw counts favour populous states. The population column is a
          <em>visual denominator</em>, not a normalised per-capita rate.
        </p>
      </div>

    </div>

    <div class="chart-sticky">
      <figure class="chart-placeholder" id="chart-2-states" data-chart="small-multiples-with-pop">
        <figcaption class="placeholder-caption">Chart 02 · State small-multiples with 2021 population column</figcaption>
        <div class="placeholder-canvas placeholder-canvas--grid" aria-label="Chart placeholder">
          <p class="placeholder-hint">D3 placeholder</p>
        </div>
      </figure>
    </div>
  </div>
</section>

<div class="ticks"></div>

<!-- ============================================================ -->
<!-- CHAPTER 3 — WHO                                               -->
<!-- ============================================================ -->
<section class="chapter" id="chapter-3">
  <div class="chapter-head">
    <span class="chapter-number">03</span>
    <p class="chapter-label">Chapter 3 — who</p>
    <h2>Middle age dominates volume; old age dominates severity</h2>
  </div>

  <div class="scrolly">
    <div class="steps">

      <div class="step is-active" data-step="1">
        <p class="step-eyebrow">Where the volume sits</p>
        <p>
          Volume concentrates in the prime of working life. The
          <strong>40–64 age band</strong> accounts for roughly
          <strong>33% of all cases</strong> — far more than any other group.
        </p>
      </div>

      <div class="step" data-step="2">
        <p class="step-eyebrow">But severity tells a different story</p>
        <p>
          Switch the lens to severity — bed days per case — and the volume picture
          inverts. The <strong>75+ group averages 8.8 days</strong> per stay,
          more than double the youngest working-age band. Children sit at 2.7.
        </p>
      </div>

      <div class="step" data-step="3">
        <p class="step-eyebrow">The counterintuitive gender split</p>
        <p>
          Across every year and every state, <strong>females consistently make up
          about 53% of hospitalised cases</strong>. This inverts the public
          assumption that men dominate road injury statistics.
        </p>
      </div>

      <div class="step" data-step="4">
        <p class="step-eyebrow">Why it matters</p>
        <p>
          Together these dimensions reveal a system where volume and severity point
          to different populations — with sharp implications for healthcare capacity
          as Australia ages. The 53% female pattern is most plausibly explained by
          passenger injury patterns, not driving behaviour.
        </p>
      </div>

    </div>

    <div class="chart-sticky">
      <figure class="chart-placeholder" id="chart-3-demographics" data-chart="age-sex-multi-view">
        <figcaption class="placeholder-caption">Chart 03 · Age × sex (view morphs per step)</figcaption>
        <div class="placeholder-canvas" aria-label="Chart placeholder">
          <p class="placeholder-hint">D3 placeholder</p>
        </div>
      </figure>
    </div>
  </div>
</section>

<div class="ticks"></div>

<!-- ============================================================ -->
<!-- CHAPTER 4 — HOW                                               -->
<!-- ============================================================ -->
<section class="chapter" id="chapter-4">
  <div class="chapter-head">
    <span class="chapter-number">04</span>
    <p class="chapter-label">Chapter 4 — how</p>
    <h2>How you travel determines how badly you are hurt</h2>
  </div>

  <div class="scrolly">
    <div class="steps">

      <div class="step is-active" data-step="1">
        <p class="step-eyebrow">Volume: car drivers</p>
        <p>
          <strong>Car drivers</strong> dominate case counts — roughly
          <strong>135,000</strong> across the decade. The next-biggest categories
          (motorcyclists, cyclists) come in well behind.
        </p>
      </div>

      <div class="step" data-step="2">
        <p class="step-eyebrow">Severity inverts the ranking</p>
        <p>
          Switch to bed-days-per-case and the order flips.
          <strong>Pedestrians: 8.6 days</strong>. Motorcyclists: 5.8.
          Cyclists: just 3.3. Smaller groups, longer stays.
        </p>
      </div>

      <div class="step" data-step="3">
        <p class="step-eyebrow">The counterparty mix</p>
        <p>
          Switch to the counterparty view. Most crashes involve another car or
          pick-up — but <strong>non-collision transport accidents</strong>
          (rollovers, single-vehicle run-offs) take a substantial share.
        </p>
      </div>

      <div class="step" data-step="4">
        <p class="step-eyebrow">Where non-collision dominates</p>
        <p>
          That non-collision share isn't evenly spread. It concentrates in
          <strong>NT and rural QLD</strong>, where roads are remote and
          single-vehicle crashes are more common — connecting the geography of
          Chapter 2 to the mechanism here.
        </p>
      </div>

    </div>

    <div class="chart-sticky">
      <figure class="chart-placeholder" id="chart-4-mechanism" data-chart="roaduser-counterparty">
        <figcaption class="placeholder-caption">Chart 04 · Road user bubble + counterparty stack (morphs per step)</figcaption>
        <div class="placeholder-canvas" aria-label="Chart placeholder">
          <p class="placeholder-hint">D3 placeholder</p>
        </div>
      </figure>
    </div>
  </div>
</section>

<div class="ticks"></div>

<!-- ============================================================ -->
<!-- CHAPTER 5 — CONVERGENCE                                       -->
<!-- ============================================================ -->
<section class="chapter" id="chapter-5">
  <div class="chapter-head">
    <span class="chapter-number">05</span>
    <p class="chapter-label">Closing — convergence</p>
    <h2>The highest-risk profile: who, where, and in what crash</h2>
  </div>

  <div class="scrolly">
    <div class="steps">

      <div class="step is-active" data-step="1">
        <p class="step-eyebrow">All dimensions in one frame</p>
        <p>
          Pulled together — states down, road users across — the matrix shows
          where injury concentrates. The brighter the cell, the heavier the burden.
        </p>
      </div>

      <div class="step" data-step="2">
        <p class="step-eyebrow">The highest-volume profile</p>
        <p>
          One profile recurs across cells: a <strong>middle-aged male motorcyclist
          or car driver</strong>, involved in a <strong>collision with another
          vehicle or a fixed object</strong>, outside major cities — with
          <strong>NT and rural QLD</strong> the hottest cells.
        </p>
      </div>

      <div class="step" data-step="3">
        <p class="step-eyebrow">The highest-severity profile</p>
        <p>
          Switch the metric from cases to bed-days-per-case and a different cohort
          glows: <strong>older passengers and pedestrians</strong>. Fewer events,
          longer recovery, higher healthcare load per case.
        </p>
        <p class="caveat">
          Raw counts. Population not normalised. <code>n.p.</code> cells suppressed.
          The caveat strip stays visible across the bottom of this chart.
        </p>
      </div>

    </div>

    <div class="chart-sticky">
      <figure class="chart-placeholder" id="chart-5-heatmap" data-chart="state-roaduser-heatmap">
        <figcaption class="placeholder-caption">Chart 05 · State × road-user heatmap with risk-profile card</figcaption>
        <div class="placeholder-canvas placeholder-canvas--tall" aria-label="Chart placeholder">
          <p class="placeholder-hint">D3 placeholder</p>
        </div>
      </figure>
    </div>

  </div>
</section>

<div class="ticks"></div>

<!-- ============================================================ -->
<!-- LIMITATIONS                                                   -->
<!-- ============================================================ -->
<section class="limitations" id="limitations">
  <h2>Limitations surfaced in this narrative</h2>
  <ul>
    <li>
      <strong>Raw counts favour populous states.</strong> NSW and VIC always look
      large in absolute terms. NT and TAS figures are contextualised visually
      (Chapter 2's population column, Chapter 5's caveat strip).
    </li>
    <li>
      <strong>2021-only population data.</strong> Any per-capita framing is an
      approximation across 2011–2021 — Queensland in particular grew fast, so part
      of its +65% rise reflects population growth, not worsening safety.
    </li>
    <li>
      <strong>Suppressed cells (<code>n.p.</code>).</strong> The age and road-user
      files suppress small-count combinations, mostly in ACT and NT. We render
      them as hatched cells rather than dropping them silently.
    </li>
    <li>
      <strong>Lockdown framing.</strong> "During lockdown = 2020" is a
      simplification — restrictions varied sharply by state. Honest at national
      level (Chapter 1) but not carried into state comparisons.
    </li>
  </ul>
</section>

<div class="ticks"></div>

<footer class="story-footer">
  <p>
    Designed audience: informed general public, with enough analytical depth for a
    policy reader skimming through. BITRE hospitalisation data, 2011–2021.
  </p>
  <p class="footer-meta">
    <a href="https://mercury.swin.edu.au/cos30045/s104358130/design-book/" target="_blank" rel="noreferrer">Mercury</a>
    &nbsp;·&nbsp;
    <a href="https://www.overleaf.com/read/vtvvwgjgfsyz#e19982" target="_blank" rel="noreferrer">Report</a>
  </p>
</footer>
`

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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollytelling)
} else {
  initScrollytelling()
}
