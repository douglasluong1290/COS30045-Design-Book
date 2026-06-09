/* Chart 2 — Australia map with case-count bubbles + click-drill.
 *
 * Sheets: state (6-monthly), population
 * Geo: public/data/au-states.geojson
 * Spec:
 *   - bubble per state, sized by SUM(count of cases) across period
 *   - hover bubble → tooltip with the sum + "Press to see more"
 *   - click → line × bar drill (line: cases per year, bar: population)
 *   - VIC + NSW: line segmented by admission, different line types,
 *     same hue family, NO connection between admissions
 *   - legend = admission (drill view only)
 */

import * as d3 from 'd3'
import {
  CHART_AXIS_FONT,
  CHART_LEGEND_FONT,
  CHART_TEXT_STYLE,
  COLORS,
  PHASE_DASH,
  PHASE_PALETTE,
  STATE_NAME_TO_CODE,
  appendLegendPrefix,
  drawGrid,
  drillBarSize,
  fmt,
  makeTooltip,
  mountSvg,
  styleAxisChrome,
  styleAxisTicks,
} from './constants.js'

const W = 880
const H = 540

/* load() — aggregate the 6-monthly state sheet to annual per state. */
export function load(stateCsv, populationCsv, geo) {
  const state = d3.csvParse(stateCsv, d3.autoType)
  const population = d3.csvParse(populationCsv, d3.autoType)

  // Annual aggregation per (state, year). admission is identical for
  // both halves of a year, so pick the first.
  const nested = d3.rollups(
    state,
    (v) => ({
      cases: d3.sum(v, (r) => r['count of cases'] ?? 0),
      bed_days: d3.sum(v, (r) => r['bed days'] ?? 0),
      admission: v[0]?.Admission || null,
    }),
    (r) => r['state or territory'],
    (r) => r['calendar year']
  )

  const annualByState = new Map(
    nested.map(([s, years]) => [
      s,
      years
        .map(([year, agg]) => ({
          state: s,
          year,
          cases: agg.cases,
          bed_days: agg.bed_days,
          admission: agg.admission,
        }))
        .sort((a, b) => a.year - b.year),
    ])
  )

  const totalsMap = new Map(
    Array.from(annualByState, ([s, rows]) => [s, d3.sum(rows, (r) => r.cases)])
  )

  const features = geo.features.map((f) => {
    const code = STATE_NAME_TO_CODE[f.properties.STATE_NAME] || f.properties.STATE_NAME
    return {
      ...f,
      properties: { ...f.properties, code, cases: totalsMap.get(code) || 0 },
    }
  })

  const populationByState = d3.group(
    population.map((r) => ({
      state: STATE_NAME_TO_CODE[r['Region/State']] || r['Region/State'],
      year: r['Year'],
      population: r["Population ('000)"],
    })),
    (r) => r.state
  )

  return {
    geo: { ...geo, features },
    totalsMap,
    populationByState,
    annualByState,
  }
}

/* chart() — render map with bubbles + drill. */
export function chart(data) {
  const root = document.querySelector('#chart-2-states .placeholder-canvas')
  if (!root) return

  const svg = mountSvg(root, { width: W, height: H })
  const mapLayer = svg.append('g').attr('class', 'map-layer')
  const drillLayer = svg.append('g').attr('class', 'drill-layer').style('display', 'none')
  const tooltip = makeTooltip()

  const totals = Array.from(data.totalsMap.values())
  const r = d3.scaleSqrt().domain([0, d3.max(totals) || 1]).range([6, 42])

  const projection = d3.geoMercator().fitSize([W - 60, H - 60], data.geo)
  const path = d3.geoPath(projection)

  // ---- map ----
  const mapG = mapLayer.append('g').attr('transform', 'translate(30,40)')

  // base state polygons
  mapG
    .selectAll('path.state')
    .data(data.geo.features)
    .join('path')
    .attr('class', 'state')
    .attr('d', path)
    .attr('fill', COLORS.accentBg)
    .attr('stroke', COLORS.border)
    .attr('stroke-width', 1)

  // bubbles — one per state, radius = sqrt(cases)
  const bubbles = mapG
    .selectAll('g.bubble')
    .data(data.geo.features.filter((f) => f.properties.cases > 0))
    .join('g')
    .attr('class', 'bubble')
    .attr('transform', (f) => `translate(${path.centroid(f)})`)
    .style('cursor', 'pointer')

  bubbles
    .append('circle')
    .attr('r', (f) => r(f.properties.cases))
    .attr('fill', COLORS.accent)
    .attr('fill-opacity', 0.55)
    .attr('stroke', COLORS.accent)
    .attr('stroke-width', 1.5)

  bubbles
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', COLORS.textH)
    .style('font-size', CHART_AXIS_FONT)
    .style('font-weight', '600')
    .style('pointer-events', 'none')
    .text((f) => f.properties.code)

  bubbles
    .on('mouseenter', function (ev, f) {
      d3.select(this).select('circle').transition().duration(120).attr('fill-opacity', 0.85)
      tooltip.show(
        `<strong>${f.properties.STATE_NAME}</strong><br>` +
          `${fmt.int(f.properties.cases)} cases 2011–2021<br>` +
          `<span style="color:${COLORS.accent};${CHART_TEXT_STYLE}">Press to see more →</span>`,
        ev
      )
    })
    .on('mousemove', (ev) => tooltip.move(ev))
    .on('mouseleave', function () {
      d3.select(this).select('circle').transition().duration(120).attr('fill-opacity', 0.55)
      tooltip.hide()
    })
    .on('click', (ev, f) => openDrill(f.properties.code, f.properties.STATE_NAME))

  // title strip
  mapLayer
    .append('text')
    .attr('x', 30)
    .attr('y', 24)
    .attr('fill', COLORS.text)
    .style('font-size', CHART_AXIS_FONT)
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Hospitalised cases by state, 2011–2021 · click a bubble')

  // ---- drill ----
  function openDrill(stateCode, stateName) {
    tooltip.hide()
    drillLayer.selectAll('*').remove()

    const dM = { top: 85, right: 70, bottom: 70, left: 70 }
    const dIW = W - dM.left - dM.right
    const dIH = H - dM.top - dM.bottom - 15

    // back button
    const back = drillLayer
      .append('g')
      .attr('class', 'back-btn')
      .attr('transform', 'translate(20,20)')
      .style('cursor', 'pointer')
    back
      .append('rect')
      .attr('rx', 6)
      .attr('width', 120)
      .attr('height', 32)
      .attr('fill', COLORS.accentBg)
      .attr('stroke', COLORS.accent)
    back
      .append('text')
      .attr('x', 60)
      .attr('y', 21)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.accent)
      .style('font-size', CHART_AXIS_FONT)
      .style('font-weight', '500')
      .text('← Back to map')
    back.on('click', closeDrill)

    // title
    drillLayer
      .append('text')
      .attr('x', W / 2)
      .attr('y', 36)
      .attr('text-anchor', 'middle')
      .attr('fill', COLORS.textH)
      .style('font-size', CHART_AXIS_FONT)
      .style('font-weight', '600')
      .text(stateName)

    const stateRows = data.annualByState.get(stateCode) || []
    const popRows = (data.populationByState.get(stateCode) || [])
      .slice()
      .sort((a, b) => a.year - b.year)

    const years = stateRows.map((d) => d.year)
    const yearCount = Math.max(popRows.length, years.length, 1)
    const bw = drillBarSize(dIW, yearCount)
    const x = d3.scaleLinear().domain(d3.extent(years)).range([bw / 2, dIW - bw / 2])
    const yCases = d3
      .scaleLinear()
      .domain([0, d3.max(stateRows, (d) => d.cases) * 1.1])
      .nice()
      .range([dIH, 0])
    const yPop = d3
      .scaleLinear()
      .domain([0, d3.max(popRows, (d) => d.population) * 1.1])
      .nice()
      .range([dIH, 0])

    const dg = drillLayer.append('g').attr('transform', `translate(${dM.left},${dM.top})`)
    drawGrid(dg, x, yCases, dIW, dIH)

    // population bars — behind the line
    dg.append('g')
      .selectAll('rect.pop-bar')
      .data(popRows)
      .join('rect')
      .attr('class', 'pop-bar')
      .attr('x', (d) => x(d.year) - bw / 2)
      .attr('y', (d) => yPop(d.population))
      .attr('width', bw)
      .attr('height', (d) => dIH - yPop(d.population))
      .attr('fill', COLORS.muted)
      .attr('opacity', 0.35)
      .on('mouseenter', (ev, d) =>
        tooltip.show(
          `<strong>${d.year}</strong><br>Population: ${fmt.int(d.population * 1000)}`,
          ev
        )
      )
      .on('mousemove', (ev) => tooltip.move(ev))
      .on('mouseleave', () => tooltip.hide())

    // cases line — phase-coloured for VIC + NSW only; segmented by
    // admission with NO line drawn across admission boundaries.
    const isPhased = stateCode === 'VIC' || stateCode === 'NSW'
    if (isPhased) {
      const groups = []
      for (const d of stateRows) {
        const last = groups[groups.length - 1]
        if (last && last.admission === d.admission) last.points.push(d)
        else groups.push({ admission: d.admission, points: [d] })
      }
      const lineGen = d3
        .line()
        .x((d) => x(d.year))
        .y((d) => yCases(d.cases))
      dg.append('g')
        .selectAll('path.group')
        .data(groups.filter((gr) => gr.points.length > 1))
        .join('path')
        .attr('class', 'group')
        .attr('d', (gr) => lineGen(gr.points))
        .attr('fill', 'none')
        .attr('stroke', (gr) => PHASE_PALETTE[gr.admission])
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round')
        .attr('stroke-dasharray', (gr) => PHASE_DASH[gr.admission] || null)
    } else {
      const lineGen = d3
        .line()
        .x((d) => x(d.year))
        .y((d) => yCases(d.cases))
      dg.append('path')
        .datum(stateRows)
        .attr('d', lineGen)
        .attr('fill', 'none')
        .attr('stroke', COLORS.accent)
        .attr('stroke-width', 3)
    }

    // dots on the line — coloured by admission for the phased states
    dg.append('g')
      .selectAll('circle.case-dot')
      .data(stateRows)
      .join('circle')
      .attr('class', 'case-dot')
      .attr('cx', (d) => x(d.year))
      .attr('cy', (d) => yCases(d.cases))
      .attr('r', 5)
      .attr('fill', (d) => (isPhased ? PHASE_PALETTE[d.admission] : COLORS.accent))
      .attr('stroke', COLORS.bg)
      .attr('stroke-width', 2)
      .on('mouseenter', (ev, d) =>
        tooltip.show(
          `<strong>${d.year}</strong><br>` +
            `${fmt.int(d.cases)} cases<br>` +
            `${fmt.int(d.bed_days)} bed days`,
          ev
        )
      )
      .on('mousemove', (ev) => tooltip.move(ev))
      .on('mouseleave', () => tooltip.hide())

    // axes
    dg.append('g')
      .attr('transform', `translate(0,${dIH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(stateRows.length))
      .call((s) => styleAxisTicks(s))
      .call((s) => styleAxisChrome(s))
    dg.append('g')
      .call(d3.axisLeft(yCases).ticks(5).tickFormat(fmt.compact))
      .call((s) => styleAxisTicks(s, COLORS.accent))
      .call((s) => styleAxisChrome(s))
    dg.append('g')
      .attr('transform', `translate(${dIW},0)`)
      .call(d3.axisRight(yPop).ticks(5).tickFormat((v) => fmt.compact(v * 1000)))
      .call((s) => styleAxisTicks(s, COLORS.muted))
      .call((s) => styleAxisChrome(s))

    dg.append('text')
      .attr('x', -8)
      .attr('y', -14)
      .attr('fill', COLORS.accent)
      .style('font-size', CHART_AXIS_FONT)
      .style('letter-spacing', '0.8px')
      .style('text-transform', 'uppercase')
      .text('Cases (line)')
    dg.append('text')
      .attr('x', dIW + 8)
      .attr('y', -14)
      .attr('text-anchor', 'end')
      .attr('fill', COLORS.muted)
      .style('font-size', CHART_AXIS_FONT)
      .style('letter-spacing', '0.8px')
      .style('text-transform', 'uppercase')
      .text('Population (bar)')

    drawAdmissionLegend(drillLayer, [dM.left, H - 38], isPhased)

    mapLayer.style('display', 'none')
    drillLayer.style('display', 'block')
  }

  function closeDrill() {
    drillLayer.style('display', 'none')
    mapLayer.style('display', 'block')
  }
}

function drawAdmissionLegend(parent, [x, y], isPhased) {
  const g = parent.append('g').attr('transform', `translate(${x},${y})`)
  let cursor = appendLegendPrefix(g, { y: 12 })
  if (!isPhased) {
    const note = g
      .append('text')
      .attr('x', cursor)
      .attr('y', 12)
      .attr('fill', COLORS.text)
      .style('font-size', CHART_LEGEND_FONT)
      .text('Admission (VIC + NSW phased line)')
    cursor += note.node().getComputedTextLength() + 16
  }
  Object.entries(PHASE_PALETTE).forEach(([label, color]) => {
    const it = g.append('g').attr('transform', `translate(${cursor},10)`)
    it.append('line')
      .attr('x1', 0)
      .attr('x2', 24)
      .attr('y1', 8)
      .attr('y2', 8)
      .attr('stroke', color)
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', PHASE_DASH[label] || null)
    const t = it
      .append('text')
      .attr('x', 30)
      .attr('y', 12)
      .attr('fill', COLORS.text)
      .style('font-size', CHART_LEGEND_FONT)
      .text(label)
    cursor += 30 + t.node().getComputedTextLength() + 22
  })
}
