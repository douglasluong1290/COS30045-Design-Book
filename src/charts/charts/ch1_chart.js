/* Chart 1 — national line, segmented by admission category.
 *
 * Sheet: publication
 * Spec:
 *   - dotted light-gray grid
 *   - x = year, y = count of cases
 *   - legend = admission, do NOT connect lines between admissions
 *   - different line type per admission, same hue family
 *   - hover on a year → tooltip (year + cases)
 */

import * as d3 from 'd3'
import {
  CHART_TEXT_STYLE,
  COLORS,
  PHASE_DASH,
  PHASE_PALETTE,
  appendLegendPrefix,
  drawGrid,
  fmt,
  makeTooltip,
  mountSvg,
  styleAxisChrome,
  styleAxisTicks,
  styleChartText,
} from './constants.js'

const W = 880
const H = 480
const M = { top: 56, right: 30, bottom: 50, left: 80 }
const IW = W - M.left - M.right
const IH = H - M.top - M.bottom

/* load() — parse publication CSV, aggregate Count of cases by year +
 * keep the Admission tag (it's identical for every row of a given year
 * so we just take the first one). */
export function load(csv) {
  const rows = d3.csvParse(csv, d3.autoType)

  const byYear = d3.rollups(
    rows,
    (v) => ({
      cases: d3.sum(v, (r) => r['Count of cases'] ?? 0),
      admission: v[0]?.Admission || null,
    }),
    (r) => r['Calendar year']
  )

  return byYear
    .map(([year, { cases, admission }]) => ({ year, cases, admission }))
    .sort((a, b) => a.year - b.year)
}

/* chart() — render disconnected segments by admission */
export function chart(data) {
  const root = document.querySelector('#chart-1-trend .placeholder-canvas')
  if (!root) return

  const svg = mountSvg(root, { width: W, height: H })
  const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`)

  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.year))
    .range([0, IW])
  const y = d3
    .scaleLinear()
    .domain([
      d3.min(data, (d) => d.cases) * 0.95,
      d3.max(data, (d) => d.cases) * 1.02,
    ])
    .nice()
    .range([IH, 0])

  drawGrid(g, x, y, IW, IH)

  // axes
  g.append('g')
    .attr('transform', `translate(0,${IH})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(data.length))
    .call((s) => styleAxisTicks(s))
    .call((s) => styleAxisChrome(s))
  g.append('g')
    .call(d3.axisLeft(y).ticks(6).tickFormat(fmt.compact))
    .call((s) => styleAxisTicks(s))
    .call((s) => styleAxisChrome(s))

  styleChartText(
    g
      .append('text')
      .attr('x', -IH / 2)
      .attr('y', -56)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
  )
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Count of cases')
  styleChartText(
    g
      .append('text')
      .attr('x', IW / 2)
      .attr('y', IH + 38)
      .attr('text-anchor', 'middle')
  )
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Year')

  // Group consecutive same-admission years; each group becomes its own
  // <path>, so no segment is drawn across admission boundaries.
  const groups = []
  for (const d of data) {
    const last = groups[groups.length - 1]
    if (last && last.admission === d.admission) last.points.push(d)
    else groups.push({ admission: d.admission, points: [d] })
  }

  const line = d3
    .line()
    .x((d) => x(d.year))
    .y((d) => y(d.cases))

  g.append('g')
    .selectAll('path.group')
    .data(groups.filter((gr) => gr.points.length > 1))
    .join('path')
    .attr('class', 'group')
    .attr('d', (gr) => line(gr.points))
    .attr('fill', 'none')
    .attr('stroke', (gr) => PHASE_PALETTE[gr.admission])
    .attr('stroke-width', 3)
    .attr('stroke-linecap', 'round')
    .attr('stroke-dasharray', (gr) => PHASE_DASH[gr.admission] || null)

  // dots — one per year, coloured by admission
  const dots = g
    .append('g')
    .selectAll('circle')
    .data(data)
    .join('circle')
    .attr('cx', (d) => x(d.year))
    .attr('cy', (d) => y(d.cases))
    .attr('r', 5)
    .attr('fill', (d) => PHASE_PALETTE[d.admission])
    .attr('stroke', COLORS.bg)
    .attr('stroke-width', 2)

  // hit rects per year — drive the tooltip
  const tooltip = makeTooltip()
  const hitW = IW / (data.length - 1)
  g.append('g')
    .selectAll('rect.hit')
    .data(data)
    .join('rect')
    .attr('class', 'hit')
    .attr('x', (d) => x(d.year) - hitW / 2)
    .attr('y', 0)
    .attr('width', hitW)
    .attr('height', IH)
    .attr('fill', 'transparent')
    .on('mouseenter', function (ev, d) {
      dots.filter((p) => p.year === d.year).transition().duration(120).attr('r', 8)
      tooltip.show(
        `<strong style="color:${PHASE_PALETTE[d.admission]}">${d.year}</strong><br>` +
          `${fmt.int(d.cases)} cases<br>` +
          `<span style="color:${COLORS.text};${CHART_TEXT_STYLE}">${d.admission}</span>`,
        ev
      )
    })
    .on('mousemove', (ev) => tooltip.move(ev))
    .on('mouseleave', function () {
      dots.transition().duration(120).attr('r', 5)
      tooltip.hide()
    })

  // legend — sample line per admission with its dash pattern
  const legend = svg
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${M.left},${M.top - 32})`)
  let cursor = appendLegendPrefix(legend)
  Object.entries(PHASE_PALETTE).forEach(([label, color]) => {
    const item = legend.append('g').attr('transform', `translate(${cursor},0)`)
    item
      .append('line')
      .attr('x1', 0)
      .attr('x2', 28)
      .attr('y1', 9)
      .attr('y2', 9)
      .attr('stroke', color)
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('stroke-dasharray', PHASE_DASH[label] || null)
    const txt = styleChartText(item.append('text').attr('x', 34).attr('y', 12)).text(label)
    cursor += 34 + txt.node().getComputedTextLength() + 24
  })
}
