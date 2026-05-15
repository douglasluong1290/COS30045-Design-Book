import './style.css'

document.querySelector('#app').innerHTML = `
<header class="story-header">
  <p class="kicker">COS30045 · Data Visualisation · Design Book</p>
  <h1>Who gets hurt on Australian roads — and why it keeps getting worse</h1>
  <p class="lede">
    A decade of BITRE hospitalisation data, traced from the national trend down to the
    individual: state by state, age by age, crash by crash. A scroll-driven narrative in
    five chapters.
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

  <div class="chapter-body">
    <p>
      Between 2011 and 2019, the number of Australians hospitalised after a road crash
      climbed every single year — from roughly <strong>16,400 cases</strong> to over
      <strong>19,500</strong>, a near-20% rise. In 2020, COVID-19 lockdowns hollowed out
      the roads and the figure dropped sharply. Then, in 2021, it rebounded to its
      <strong>highest point on record</strong>.
    </p>
    <p>
      The 2020 dip is the natural experiment that frames the whole story: when traffic
      volumes fell, so did injuries. As soon as behaviour returned to normal, so did the
      harm. The problem is structural, not cyclical.
    </p>
  </div>

  <ul class="kpi-strip">
    <li><span class="kpi-value">+19%</span><span class="kpi-label">national cases 2011 → 2019</span></li>
    <li><span class="kpi-value">−5%</span><span class="kpi-label">drop during 2020 lockdowns</span></li>
    <li><span class="kpi-value">2021</span><span class="kpi-label">highest year on record</span></li>
  </ul>

  <figure class="chart-placeholder" id="chart-1-trend" data-chart="annotated-line">
    <figcaption class="placeholder-caption">Chart 01 · Annotated national trend line</figcaption>
    <div class="placeholder-canvas" aria-label="Chart placeholder">
      <p class="placeholder-hint">D3 placeholder — replace this block with an SVG bound to <code>publification.xlsx</code></p>
    </div>
    <details class="placeholder-spec">
      <summary>How to build this chart in D3</summary>
      <div class="spec-body">
        <p><strong>Visual:</strong> Single-line annotated time-series with three coloured background bands (Before / During / After lockdown).</p>
        <p><strong>Dataset:</strong> <code>thanh_analysis/datasets/publification.xlsx</code> — aggregate the two 6-monthly rows into one annual total per year.</p>
        <ul class="spec-list">
          <li><strong>X axis:</strong> <code>d3.scaleTime()</code> over calendar year 2011–2021.</li>
          <li><strong>Y axis:</strong> <code>d3.scaleLinear()</code> on annual <code>count of cases excluding died in hospitals within 30 days</code>. Truncate the domain (e.g. 15k–21k) to make the trend readable, but label the axis clearly.</li>
          <li><strong>Line:</strong> <code>d3.line().curve(d3.curveMonotoneX)</code> in <code>var(--accent)</code>.</li>
          <li><strong>Lockdown bands:</strong> three <code>&lt;rect&gt;</code> backgrounds — 2011–2019 neutral, 2020 amber, 2021 recovery tone (derived from a DAX-style <code>SWITCH</code> categorisation).</li>
          <li><strong>Annotations:</strong> <code>&lt;text&gt;</code> labels at 2019 peak, 2020 trough, and 2021 record — pin with a short leader line.</li>
          <li><strong>Interactions:</strong> vertical hover guide + tooltip showing year and case count. No filters — this chart is intentionally an unfiltered national overview.</li>
        </ul>
        <p><strong>Avoid:</strong> pie/donut framings, zero-baseline that flattens the slope, slicers (they undercut the national narrative).</p>
      </div>
    </details>
  </figure>

  <p class="datasets-used"><span>Datasets used:</span> <code>publification.xlsx</code></p>
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

  <div class="chapter-body">
    <p>
      NSW and VIC dominate raw counts, but the more interesting story is that
      <strong>Victoria overtook NSW around 2018</strong> and has stayed higher since —
      despite the two states having similar populations. <strong>Queensland</strong>
      shows the steepest sustained growth: <strong>+65%</strong> across the decade.
      The Northern Territory is tiny in absolute terms but carries a disproportionate
      burden once population context is acknowledged.
    </p>
    <p class="caveat">
      <strong>Limitation surfaced in the visual:</strong> raw counts favour populous
      states. We pair the trend chart with a 2021 population reference column so the
      reader can read the disproportion without us claiming a per-capita rate we
      haven't fully normalised.
    </p>
  </div>

  <ul class="kpi-strip">
    <li><span class="kpi-value">VIC</span><span class="kpi-label">overtook NSW in 2018</span></li>
    <li><span class="kpi-value">+65%</span><span class="kpi-label">QLD growth 2011 → 2021</span></li>
    <li><span class="kpi-value">NT</span><span class="kpi-label">highest relative burden</span></li>
  </ul>

  <figure class="chart-placeholder" id="chart-2-states" data-chart="small-multiples-with-pop">
    <figcaption class="placeholder-caption">Chart 02 · Small-multiple state trends with 2021 population column</figcaption>
    <div class="placeholder-canvas placeholder-canvas--grid" aria-label="Chart placeholder">
      <p class="placeholder-hint">D3 small-multiple grid (8 panels — one per state/territory)</p>
    </div>
    <details class="placeholder-spec">
      <summary>How to build this chart in D3</summary>
      <div class="spec-body">
        <p><strong>Visual:</strong> 8-panel small-multiples grid. Each panel = one state. Each panel contains (a) a 2011–2021 line of annual case counts and (b) a thin vertical bar pinned to the right edge representing 2021 population — the visual denominator.</p>
        <p><strong>Datasets:</strong> <code>state_territory.xlsx</code> (group the two 6-monthly rows per year via <code>d3.rollup</code>) joined to <code>population_2021.xlsx</code> on state name.</p>
        <ul class="spec-list">
          <li><strong>Panel layout:</strong> use <code>d3.faceted</code> via CSS grid — 4 cols × 2 rows. Order panels by 2021 case count <em>descending</em>, not alphabetically; the ordering itself is a finding.</li>
          <li><strong>Within-panel X scale:</strong> shared time scale 2011–2021 so panels are visually comparable.</li>
          <li><strong>Within-panel Y scale:</strong> two options — (i) per-panel scale with a clearly labelled secondary axis for the population bar; or (ii) index every value to its own 2011 = 100 baseline so panels share a 0–100% scale. Option (ii) is more academically defensible.</li>
          <li><strong>Encoding:</strong> line in <code>var(--accent)</code>; population bar in a muted neutral so it reads as context, not as a comparable data series.</li>
          <li><strong>Filters / controls:</strong>
            <ul>
              <li>Toggle: <em>Raw counts</em> vs <em>Indexed to 2011 = 100</em>.</li>
              <li>Toggle: <em>Show population reference column</em> on/off.</li>
              <li>Hover on any panel highlights the matching state across all other panels in chapter 5.</li>
            </ul>
          </li>
          <li><strong>Annotation layer:</strong> draw a thin dashed marker on the VIC and NSW panels at 2018 (the crossover year). Highlight the QLD panel's +65% delta with a small bracket.</li>
        </ul>
        <p><strong>Avoid:</strong> overlaying all 8 lines in one panel — NT and TAS will be invisible against NSW.</p>
      </div>
    </details>
  </figure>

  <p class="datasets-used"><span>Datasets used:</span> <code>state_territory.xlsx</code> · <code>population_2021.xlsx</code></p>
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

  <div class="chapter-body">
    <p>
      The <strong>40–64 age group</strong> accounts for roughly <strong>33% of all
      cases</strong>, but severity — measured as bed days per case — rises sharply with
      age: the <strong>75+ group averages 8.8 days</strong> per stay, more than double
      the youngest working-age band.
    </p>
    <p>
      The gender split is the counterintuitive hook. Across every year and every state,
      <strong>females consistently make up about 53% of hospitalised cases</strong> —
      inverting the public assumption that men dominate road injury statistics. The
      likely explanation is passenger injury patterns rather than driving behaviour, and
      the narrative should resist over-simplifying it.
    </p>
  </div>

  <ul class="kpi-strip">
    <li><span class="kpi-value">33%</span><span class="kpi-label">cases aged 40–64</span></li>
    <li><span class="kpi-value">8.8d</span><span class="kpi-label">avg stay, 75+</span></li>
    <li><span class="kpi-value">~53%</span><span class="kpi-label">cases are female</span></li>
  </ul>

  <figure class="chart-placeholder" id="chart-3-demographics" data-chart="age-sex-grouped">
    <figcaption class="placeholder-caption">Chart 03a · Age × sex grouped bars by state</figcaption>
    <div class="placeholder-canvas" aria-label="Chart placeholder">
      <p class="placeholder-hint">D3 grouped bar chart — age bands grouped, with sex as inner bars</p>
    </div>
    <details class="placeholder-spec">
      <summary>How to build this chart in D3</summary>
      <div class="spec-body">
        <p><strong>Visual:</strong> Grouped bar chart. Outer groups = age bands (0–7, 8–16, 17–25, 26–39, 40–64, 65–74, 75+). Inner bars = sex (male / female) side-by-side.</p>
        <p><strong>Datasets:</strong> <code>state_territory_age.xlsx</code> and <code>state_territory_sex.xlsx</code> joined on (state, year). Replace <code>n.p.</code> values with <code>null</code> before aggregating, and exclude them from sums.</p>
        <ul class="spec-list">
          <li><strong>X scale:</strong> two-level <code>d3.scaleBand()</code> — outer for age band, inner for sex.</li>
          <li><strong>Y scale:</strong> <code>d3.scaleLinear()</code> on summed case count over the selected year range.</li>
          <li><strong>Colour:</strong> two-hue categorical scale, accessible against the page background; reuse <code>var(--accent)</code> for one sex and a complementary neutral for the other (don't default to pink/blue stereotype).</li>
          <li><strong>Filters / controls:</strong>
            <ul>
              <li>State dropdown (<em>All Australia</em> default, plus each state/territory).</li>
              <li>Year range slider (2011–2021).</li>
              <li>Toggle: raw count vs share-of-total (%).</li>
            </ul>
          </li>
          <li><strong>Annotation:</strong> mark the 40–64 band as the volume peak; place a callout near the 75+ band noting it dominates severity (forward reference to chart 03b).</li>
          <li><strong>n.p. handling:</strong> render suppressed cells as a hatched bar with a tooltip explaining "value not published (small count)". Don't drop them silently.</li>
        </ul>
      </div>
    </details>
  </figure>

  <figure class="chart-placeholder" id="chart-3-severity" data-chart="age-severity-scatter">
    <figcaption class="placeholder-caption">Chart 03b · Volume vs severity scatter, by age band</figcaption>
    <div class="placeholder-canvas" aria-label="Chart placeholder">
      <p class="placeholder-hint">D3 scatter — case count on X, bed-days-per-case on Y, point sized by total bed days</p>
    </div>
    <details class="placeholder-spec">
      <summary>How to build this chart in D3</summary>
      <div class="spec-body">
        <p><strong>Visual:</strong> Scatter / bubble. One point per age band. Encodes the volume-vs-severity divergence in a single glance.</p>
        <p><strong>Dataset:</strong> <code>publification.xlsx</code> — it's the only file with both age and bed-days at the same grain.</p>
        <ul class="spec-list">
          <li><strong>X:</strong> total case count for the age band.</li>
          <li><strong>Y:</strong> bed days ÷ case count (severity).</li>
          <li><strong>Bubble radius:</strong> total bed days (uses <code>d3.scaleSqrt</code>).</li>
          <li><strong>Label:</strong> each bubble labelled with its age band; the 75+ bubble should sit visibly highest on Y; the 40–64 bubble furthest right on X.</li>
          <li><strong>Filters / controls:</strong> year-range slider; optional sex toggle (male only / female only / all).</li>
          <li><strong>Annotation:</strong> two diagonal guide lines or quadrant labels — "High volume, low severity" vs "Low volume, high severity" — to make the inversion explicit.</li>
        </ul>
      </div>
    </details>
  </figure>

  <p class="datasets-used"><span>Datasets used:</span> <code>state_territory_age.xlsx</code> · <code>state_territory_sex.xlsx</code> · <code>publification.xlsx</code></p>
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

  <div class="chapter-body">
    <p>
      <strong>Car drivers</strong> dominate case counts — roughly 135,000 across the
      decade — but the severity picture inverts the volume picture. <strong>Pedestrians
      average 8.6 bed days per case</strong>, <strong>motorcyclists 5.8</strong>, while
      cyclists sit at just 3.3.
    </p>
    <p>
      The counterparty data adds the mechanism layer: most crashes involve another car
      or pick-up, but <strong>non-collision transport accidents</strong> — rollovers,
      single-vehicle run-offs — account for a large share, particularly in NT and rural
      QLD where roads are remote and single-vehicle crashes more common.
    </p>
  </div>

  <ul class="kpi-strip">
    <li><span class="kpi-value">8.6d</span><span class="kpi-label">pedestrian bed-days / case</span></li>
    <li><span class="kpi-value">5.8d</span><span class="kpi-label">motorcyclist bed-days / case</span></li>
    <li><span class="kpi-value">3.3d</span><span class="kpi-label">cyclist bed-days / case</span></li>
  </ul>

  <figure class="chart-placeholder" id="chart-4-roaduser" data-chart="roaduser-bubble">
    <figcaption class="placeholder-caption">Chart 04a · Road user bubble — volume vs severity</figcaption>
    <div class="placeholder-canvas" aria-label="Chart placeholder">
      <p class="placeholder-hint">D3 bubble chart — road user types positioned by count × severity</p>
    </div>
    <details class="placeholder-spec">
      <summary>How to build this chart in D3</summary>
      <div class="spec-body">
        <p><strong>Visual:</strong> Bubble chart. Same encoding logic as Chart 03b, but the categorical dimension is <em>road user type</em> (driver, passenger, motorcyclist, cyclist, pedestrian, other).</p>
        <p><strong>Dataset:</strong> <code>state_territory_road.xlsx</code> aggregated to national level. Replace <code>n.p.</code> with <code>null</code>.</p>
        <ul class="spec-list">
          <li><strong>X:</strong> total cases for road user type.</li>
          <li><strong>Y:</strong> bed days per case.</li>
          <li><strong>Bubble radius:</strong> total bed days.</li>
          <li><strong>Colour:</strong> categorical hue per road user; keep pedestrian + motorcyclist visually warmest to draw the eye to the severity outliers.</li>
          <li><strong>Filters / controls:</strong> state dropdown (default all), year range slider, optional sex/age cross-filter that links to chart 03a.</li>
          <li><strong>Annotation:</strong> highlight the pedestrian bubble (high Y, low X) and the car driver bubble (low Y, high X) with leader-line callouts.</li>
        </ul>
      </div>
    </details>
  </figure>

  <figure class="chart-placeholder" id="chart-4-counterparty" data-chart="counterparty-stacked">
    <figcaption class="placeholder-caption">Chart 04b · Stacked counterparty composition by state</figcaption>
    <div class="placeholder-canvas" aria-label="Chart placeholder">
      <p class="placeholder-hint">D3 stacked bar — counterparty share per state, with non-collision called out</p>
    </div>
    <details class="placeholder-spec">
      <summary>How to build this chart in D3</summary>
      <div class="spec-body">
        <p><strong>Visual:</strong> 100% stacked horizontal bar chart. One bar per state. Stacks = counterparty type (another vehicle, pedestrian, fixed object, non-collision transport accident, other).</p>
        <p><strong>Dataset:</strong> <code>state_territory_counterparty.xlsx</code>.</p>
        <ul class="spec-list">
          <li><strong>Y axis:</strong> state, ordered by <em>share of non-collision accidents descending</em> so NT and rural-QLD bias is visible at the top.</li>
          <li><strong>X axis:</strong> 0–100% share.</li>
          <li><strong>Stack generator:</strong> <code>d3.stack().offset(d3.stackOffsetExpand)</code> for percentage stacking.</li>
          <li><strong>Colour:</strong> use a desaturated palette for common categories and a single accent hue for "non-collision transport accident" — the category the narrative is calling out.</li>
          <li><strong>Filters / controls:</strong> year range slider; toggle between 100% normalised view and absolute counts.</li>
          <li><strong>Linked highlighting:</strong> hovering a state bar fades non-matching states in the small-multiples (chart 02) and dims unrelated bubbles in chart 04a.</li>
        </ul>
      </div>
    </details>
  </figure>

  <p class="datasets-used"><span>Datasets used:</span> <code>state_territory_road.xlsx</code> · <code>state_territory_counterparty.xlsx</code> · <code>publification.xlsx</code></p>
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

  <div class="chapter-body">
    <p>
      Pulled together, the data converges on a recognisable profile: a
      <strong>middle-aged male motorcyclist or car driver</strong>, involved in a
      <strong>collision with another vehicle or a fixed object</strong>, outside major
      cities — with the <strong>NT and rural QLD</strong> showing the highest
      concentration. <strong>Older passengers and pedestrians</strong> represent the
      highest-severity cohort.
    </p>
    <p>
      The intention of this closing chapter is to frame the data as a call to targeted
      intervention rather than a generic road-safety message — and to restate the
      population caveat one last time so the analytical integrity holds.
    </p>
  </div>

  <figure class="chart-placeholder" id="chart-5-heatmap" data-chart="state-roaduser-heatmap">
    <figcaption class="placeholder-caption">Chart 05 · State × road-user severity heatmap</figcaption>
    <div class="placeholder-canvas placeholder-canvas--tall" aria-label="Chart placeholder">
      <p class="placeholder-hint">D3 matrix heatmap with a side panel summarising the highest-risk profile</p>
    </div>
    <details class="placeholder-spec">
      <summary>How to build this chart in D3</summary>
      <div class="spec-body">
        <p><strong>Visual:</strong> A two-pane composition. Left pane: heatmap matrix — rows are states, columns are road user types, cell colour encodes either cases or bed-days-per-case. Right pane: dynamic "risk profile" summary card that updates with hover/click.</p>
        <p><strong>Datasets:</strong> all six — joined on state and year. <code>publification.xlsx</code> provides the bed-days denominator.</p>
        <ul class="spec-list">
          <li><strong>Colour scale:</strong> <code>d3.scaleSequential(d3.interpolateMagma)</code> or similar perceptually-uniform ramp; legend rendered above the matrix.</li>
          <li><strong>Row order:</strong> states sorted by overall severity (descending). Don't sort alphabetically.</li>
          <li><strong>Column order:</strong> road users ordered by severity ranking from chart 04a, so the eye reads the matrix in the same direction as earlier chapters.</li>
          <li><strong>Filters / controls:</strong>
            <ul>
              <li>Metric toggle: <em>Case count</em> vs <em>Bed days per case</em>.</li>
              <li>Year range slider.</li>
              <li>Age band multi-select (default 40–64 + 75+ — the two narratively important bands).</li>
              <li>Sex toggle.</li>
            </ul>
          </li>
          <li><strong>Right-pane card:</strong> on hover, populate a card with the state name, dominant road user, dominant counterparty, average bed days, and a one-line narrative — e.g. "NT · motorcyclist · non-collision · 7.9 days avg stay".</li>
          <li><strong>Final annotation:</strong> persistent caveat strip across the bottom: "Raw counts. Population not normalised. <code>n.p.</code> cells suppressed."</li>
        </ul>
      </div>
    </details>
  </figure>

  <p class="datasets-used"><span>Datasets used:</span> all six datasets</p>
</section>

<div class="ticks"></div>

<!-- ============================================================ -->
<!-- LIMITATIONS                                                   -->
<!-- ============================================================ -->
<section class="limitations" id="limitations">
  <h2>Limitations surfaced in this narrative</h2>
  <ul>
    <li>
      <strong>Raw counts favour populous states.</strong> NSW and VIC will always look
      large in absolute terms. NT and TAS figures are always contextualised in the
      visuals (chapter 2's population column, chapter 5's caveat strip).
    </li>
    <li>
      <strong>2021-only population data.</strong> Any per-capita framing is an
      approximation across 2011–2021 — Queensland in particular grew fast during the
      decade, so some of its +65% case rise reflects population growth rather than
      worsening safety.
    </li>
    <li>
      <strong>Suppressed cells (<code>n.p.</code>).</strong> The age and road-user
      files suppress small-count combinations, mostly in ACT and NT. We render these as
      hatched cells rather than dropping them silently.
    </li>
    <li>
      <strong>Lockdown framing.</strong> "During lockdown = 2020" is a simplification —
      restrictions varied sharply by state, with VIC under extended lockdown while WA
      and QLD saw little. The frame is honest at the national level (chapter 1) but
      should not be carried into state comparisons.
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
