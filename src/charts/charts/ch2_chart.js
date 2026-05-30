/* Chart 2 — Australia choropleth with click-to-drill.
 *
 * Sheets: state_summary, population
 * Geo: public/data/au-states.geojson
 * Spec:
 *   - choropleth coloured by sum of "count of cases" (red hues)
 *   - hover state → tooltip with the sum + "Press to see more"
 *   - click → line × bar drill (line = cases per year, bar = population)
 *   - VIC + NSW: line uses admission palette; bar unchanged
 *   - legend = admission (only shown on the drill view)
 */

import * as d3 from 'd3'
import {
  AGE_ORDER as _unused, // (silence unused import linters)
  CHART_AXIS_FONT,
  CHART_LEGEND_FONT,
  COLORS,
  PHASE_PALETTE,
  STATE_NAME_TO_CODE,
  STATE_CODE_TO_NAME,
  choroplethColor,
  appendLegendPrefix,
  CHART_TEXT_STYLE,
  drawGrid,
  drillBarSize,
  fmt,
  makeTooltip,
  mountSvg,
  stateAdmissionFor,
  styleAxisChrome,
  styleAxisTicks,
  styleChartText,
} from './constants.js'

const W = 880
const H = 540

/* load() — accept the two CSV strings + the GeoJSON, return prepared data. */
export function load(stateSummaryCsv, populationCsv, geo) {
  const summary = d3.csvParse(stateSummaryCsv, d3.autoType)
  const population = d3.csvParse(populationCsv, d3.autoType)

  // sum cases per state across the whole period
  const totalsMap = d3.rollup(
    summary,
    (v) => d3.sum(v, (r) => r['count of cases'] ?? 0),
    (r) => r['state or territory']
  )

  // attach total cases + state code onto each GeoJSON feature
  const features = geo.features.map((f) => {
    const code = STATE_NAME_TO_CODE[f.properties.STATE_NAME] || f.properties.STATE_NAME
    return {
      ...f,
      properties: {
        ...f.properties,
        code,
        cases: totalsMap.get(code) || 0,
      },
    }
  })

  // normalise population sheet onto state-code keys
  const populationByState = d3.group(
    population.map((r) => ({
      state: STATE_NAME_TO_CODE[r['Region/State']] || r['Region/State'],
      year: r['Year'],
      population: r["Population ('000)"],
    })),
    (r) => r.state
  )

  // state-trend (per year cases per state) for the drill line
  const trendByState = d3.group(summary, (r) => r['state or territory'])

  return { geo: { ...geo, features }, totalsMap, populationByState, trendByState }
}

/* chart() — render the choropleth + drill. */
export function chart(data) {
  const root = document.querySelector('#chart-2-states .placeholder-canvas')
  if (!root) return

  const svg = mountSvg(root, { width: W, height: H })
  const mapLayer = svg.append('g').attr('class', 'map-layer')
  const drillLayer = svg.append('g').attr('class', 'drill-layer').style('display', 'none')
  const tooltip = makeTooltip()

  const totals = Array.from(data.totalsMap.values())
  const color = choroplethColor([0, d3.max(totals)])

  const projection = d3.geoMercator().fitSize([W - 60, H - 60], data.geo)
  const path = d3.geoPath(projection)

  // ---- map ----
  const mapG = mapLayer.append('g').attr('transform', 'translate(30,40)')

  mapG
    .selectAll('path.state')
    .data(data.geo.features)
    .join('path')
    .attr('class', 'state')
    .attr('d', path)
    .attr('fill', (f) => (f.properties.cases > 0 ? color(f.properties.cases) : COLORS.border))
    .attr('stroke', COLORS.bg)
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('mouseenter', function (ev, f) {
      d3.select(this).transition().duration(120).attr('stroke', COLORS.textH).attr('stroke-width', 1.6)
      tooltip.show(
        `<strong>${f.properties.STATE_NAME}</strong><br>` +
          `${fmt.int(f.properties.cases)} cases 2011–2021<br>` +
          `<span style="color:${COLORS.accent};${CHART_TEXT_STYLE}">Press to see more →</span>`,
        ev
      )
    })
    .on('mousemove', (ev) => tooltip.move(ev))
    .on('mouseleave', function () {
      d3.select(this).transition().duration(120).attr('stroke', COLORS.bg).attr('stroke-width', 1)
      tooltip.hide()
    })
    .on('click', (ev, f) => openDrill(f.properties.code, f.properties.STATE_NAME))

  // state-code labels on top
  mapG
    .selectAll('text.state-label')
    .data(data.geo.features.filter((f) => f.properties.cases > 0))
    .join('text')
    .attr('class', 'state-label')
    .attr('transform', (f) => `translate(${path.centroid(f)})`)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', COLORS.textH)
    .style('font-size', CHART_AXIS_FONT)
    .style('font-weight', '600')
    .style('pointer-events', 'none')
    .text((f) => f.properties.code)

  // title strip
  mapLayer
    .append('text')
    .attr('x', 30)
    .attr('y', 24)
    .attr('fill', COLORS.text)
    .style('font-size', CHART_AXIS_FONT)
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Hospitalised cases by state, 2011–2021 · click a state')

  // simple choropleth legend in the bottom-left corner
  drawChoroplethLegend(mapLayer, color, [40, H - 50])

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

    // collate per-year data for the state
    const stateRows = (data.trendByState.get(stateCode) || [])
      .slice()
      .sort((a, b) => a['calendar year'] - b['calendar year'])
    const popRows = (data.populationByState.get(stateCode) || [])
      .slice()
      .sort((a, b) => a.year - b.year)

    const years = stateRows.map((r) => r['calendar year'])
    const yearCount = Math.max(popRows.length, years.length, 1)
    const bw = drillBarSize(dIW, yearCount)
    const x = d3.scaleLinear().domain(d3.extent(years)).range([bw / 2, dIW - bw / 2])
    const yCases = d3
      .scaleLinear()
      .domain([0, d3.max(stateRows, (r) => r['count of cases']) * 1.1])
      .nice()
      .range([dIH, 0])
    const yPop = d3
      .scaleLinear()
      .domain([0, d3.max(popRows, (r) => r.population) * 1.1])
      .nice()
      .range([dIH, 0])

    const dg = drillLayer.append('g').attr('transform', `translate(${dM.left},${dM.top})`)
    drawGrid(dg, x, yCases, dIW, dIH)

    // population bars — z-order BELOW the line
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

    // cases line — phase-coloured for VIC + NSW only
    const isPhased = stateCode === 'VIC' || stateCode === 'NSW'
    if (isPhased) {
      const segments = []
      for (let i = 0; i < stateRows.length - 1; i++) {
        segments.push({
          from: stateRows[i],
          to: stateRows[i + 1],
          admission: stateAdmissionFor(stateRows[i + 1]['calendar year'], stateCode),
        })
      }
      dg.append('g')
        .selectAll('path.seg')
        .data(segments)
        .join('path')
        .attr('d', (s) =>
          d3
            .line()
            .x((d) => x(d['calendar year']))
            .y((d) => yCases(d['count of cases']))([s.from, s.to])
        )
        .attr('fill', 'none')
        .attr('stroke', (s) => PHASE_PALETTE[s.admission])
        .attr('stroke-width', 3)
    } else {
      const lineGen = d3
        .line()
        .x((d) => x(d['calendar year']))
        .y((d) => yCases(d['count of cases']))
      dg.append('path')
        .datum(stateRows)
        .attr('d', lineGen)
        .attr('fill', 'none')
        .attr('stroke', COLORS.accent)
        .attr('stroke-width', 3)
    }

    // dots on the line
    dg.append('g')
      .selectAll('circle.case-dot')
      .data(stateRows)
      .join('circle')
      .attr('class', 'case-dot')
      .attr('cx', (d) => x(d['calendar year']))
      .attr('cy', (d) => yCases(d['count of cases']))
      .attr('r', 5)
      .attr('fill', (d) =>
        isPhased
          ? PHASE_PALETTE[stateAdmissionFor(d['calendar year'], stateCode)]
          : COLORS.accent
      )
      .attr('stroke', COLORS.bg)
      .attr('stroke-width', 2)
      .on('mouseenter', (ev, d) =>
        tooltip.show(
          `<strong>${d['calendar year']}</strong><br>` +
            `${fmt.int(d['count of cases'])} cases<br>` +
            `${fmt.int(d['bed days'])} bed days`,
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

    // admission legend — drawn on the drill view (per spec)
    drawAdmissionLegend(drillLayer, [dM.left, H - 38], isPhased)

    mapLayer.style('display', 'none')
    drillLayer.style('display', 'block')
  }

  function closeDrill() {
    drillLayer.style('display', 'none')
    mapLayer.style('display', 'block')
  }
}

/* small horizontal colour ramp for the choropleth */
function drawChoroplethLegend(parent, color, [x, y]) {
  const w = 180
  const h = 10
  const g = parent.append('g').attr('transform', `translate(${x},${y})`)
  const id = `grad-ch2-${Math.random().toString(36).slice(2, 8)}`
  const grad = g.append('defs').append('linearGradient').attr('id', id)
  grad.append('stop').attr('offset', '0%').attr('stop-color', color.range()[0])
  grad.append('stop').attr('offset', '100%').attr('stop-color', color(color.domain()[1]))
  g.append('rect').attr('width', w).attr('height', h).attr('fill', `url(#${id})`).attr('rx', 2)
  g.append('text')
    .attr('y', -6)
    .attr('fill', COLORS.text)
    .style('font-size', CHART_LEGEND_FONT)
    .style('letter-spacing', '0.8px')
    .style('text-transform', 'uppercase')
    .text('Legend: Total cases — heat scale')
  g.append('text').attr('y', h + 14).attr('fill', COLORS.text).style('font-size', CHART_AXIS_FONT).text('0')
  g.append('text')
    .attr('x', w)
    .attr('y', h + 14)
    .attr('text-anchor', 'end')
    .attr('fill', COLORS.text)
    .style('font-size', CHART_AXIS_FONT)
    .text(fmt.compact(color.domain()[1]))
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
    it.append('rect').attr('y', 6).attr('width', 14).attr('height', 4).attr('rx', 2).attr('fill', color)
    const t = it
      .append('text')
      .attr('x', 20)
      .attr('y', 12)
      .attr('fill', COLORS.text)
      .style('font-size', CHART_LEGEND_FONT)
      .text(label)
    cursor += 22 + t.node().getComputedTextLength() + 22
  })
}

// silence unused-name complaints from bundlers about unused exports
void STATE_CODE_TO_NAME
