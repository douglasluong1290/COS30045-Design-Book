/* Chart 4 — Back-to-back tornado bar chart, by road user.
 *
 * Sheet: publication
 * Spec:
 *   - LEFT bar: count of cases
 *   - RIGHT bar: average bed days (sum bed days / sum cases, rounded)
 *   - rows: road user
 *   - dotted light gray grid background
 *   - legend + hover tooltips
 *
 * Baked-in filter: drop rows where Road user = "Not applicable".
 * (Mirrors the page-level filter in the final pbix.)
 */

import * as d3 from 'd3'
import {
  CHART_AXIS_FONT,
  COLORS,
  appendLegendPrefix,
  fmt,
  makeTooltip,
  mountSvg,
  styleAxisChrome,
  styleAxisTicks,
  styleChartText,
} from './constants.js'

const W = 1080
const H = 700
const M = { top: 90, right: 60, bottom: 60, left: 60 }
const IW = W - M.left - M.right
const IH = H - M.top - M.bottom
const CENTER_GAP = 320
const HALF = (IW - CENTER_GAP) / 2

/* load() — parse + filter "Not applicable" + aggregate per road user.
 * Average bed days = round(sum(bed_days) / sum(cases)).             */
export function load(csv) {
  const rows = d3.csvParse(csv, d3.autoType)
  const filtered = rows.filter((r) => {
    const ru = (r['Road user'] || '').toString().trim().toLowerCase()
    return ru && ru !== 'not applicable'
  })
  const agg = d3.rollups(
    filtered,
    (v) => {
      const cases = d3.sum(v, (r) => r['Count of cases'] ?? 0)
      const bed_days = d3.sum(v, (r) => r['Bed days'] ?? 0)
      const avg_bed_days = cases > 0 ? Math.round(bed_days / cases) : 0
      return { cases, bed_days, avg_bed_days }
    },
    (r) => r['Road user']
  )
  return agg
    .map(([road_user, totals]) => ({ road_user, ...totals }))
    .sort((a, b) => b.cases - a.cases)
}

/* chart() */
export function chart(data) {
  const root = document.querySelector('#chart-4-mechanism .placeholder-canvas')
  if (!root) return

  const svg = mountSvg(root, { width: W, height: H })
  const tooltip = makeTooltip()

  // ---- legend ----
  const legend = svg.append('g').attr('class', 'legend').attr('transform', `translate(${M.left},22)`)
  let lc = appendLegendPrefix(legend, { y: 14 })
  ;[
    { label: 'Count of cases', color: COLORS.accent },
    { label: 'Average bed days', color: COLORS.muted },
  ].forEach((it) => {
    const item = legend.append('g').attr('transform', `translate(${lc},0)`)
    item.append('rect').attr('y', 8).attr('width', 16).attr('height', 8).attr('rx', 2).attr('fill', it.color)
    const t = styleChartText(item.append('text').attr('x', 22).attr('y', 14), COLORS.text).text(it.label)
    lc += 22 + t.node().getComputedTextLength() + 24
  })

  // ---- chart group ----
  const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`)

  // column headers
  styleChartText(
    g.append('text').attr('x', HALF - 4).attr('y', -16).attr('text-anchor', 'end'),
    COLORS.accent
  )
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Count of cases')
  styleChartText(
    g.append('text').attr('x', HALF + CENTER_GAP + 4).attr('y', -16).attr('text-anchor', 'start'),
    COLORS.muted
  )
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Average bed days')

  const y = d3.scaleBand().domain(data.map((d) => d.road_user)).range([0, IH]).padding(0.22)

  const maxCases = d3.max(data, (d) => d.cases) || 1
  const maxAvg = d3.max(data, (d) => d.avg_bed_days) || 1

  const xLeft = d3.scaleLinear().domain([0, maxCases]).nice().range([HALF, 0])
  const xRight = d3.scaleLinear().domain([0, maxAvg]).nice().range([HALF + CENTER_GAP, IW])

  // vertical dotted grids
  g.append('g')
    .selectAll('line')
    .data(xLeft.ticks(5))
    .join('line')
    .attr('x1', (d) => xLeft(d))
    .attr('x2', (d) => xLeft(d))
    .attr('y1', 0)
    .attr('y2', IH)
    .attr('stroke', COLORS.border)
    .attr('stroke-dasharray', '2 4')
  g.append('g')
    .selectAll('line')
    .data(xRight.ticks(5))
    .join('line')
    .attr('x1', (d) => xRight(d))
    .attr('x2', (d) => xRight(d))
    .attr('y1', 0)
    .attr('y2', IH)
    .attr('stroke', COLORS.border)
    .attr('stroke-dasharray', '2 4')

  // central road-user labels — wrap long labels at commas
  g.selectAll('text.ru-label')
    .data(data)
    .join('text')
    .attr('class', 'ru-label')
    .attr('x', HALF + CENTER_GAP / 2)
    .attr('y', (d) => y(d.road_user) + y.bandwidth() / 2)
    .attr('text-anchor', 'middle')
    .attr('fill', COLORS.textH)
    .style('font-size', CHART_AXIS_FONT)
    .style('font-weight', '500')
    .each(function (d) {
      const node = d3.select(this)
      const parts = d.road_user.length > 28 ? d.road_user.split(/,\s+/) : [d.road_user]
      parts.forEach((line, i) => {
        node
          .append('tspan')
          .attr('x', HALF + CENTER_GAP / 2)
          .attr('dy', i === 0 ? `${-(parts.length - 1) * 0.5 + 0.35}em` : '1.2em')
          .text(line)
      })
    })

  // bars
  g.selectAll('rect.bar-left')
    .data(data)
    .join('rect')
    .attr('class', 'bar-left')
    .attr('y', (d) => y(d.road_user))
    .attr('height', y.bandwidth())
    .attr('x', (d) => xLeft(d.cases))
    .attr('width', (d) => HALF - xLeft(d.cases))
    .attr('fill', COLORS.accent)
    .attr('rx', 2)
  g.selectAll('rect.bar-right')
    .data(data)
    .join('rect')
    .attr('class', 'bar-right')
    .attr('y', (d) => y(d.road_user))
    .attr('height', y.bandwidth())
    .attr('x', HALF + CENTER_GAP)
    .attr('width', (d) => xRight(d.avg_bed_days) - (HALF + CENTER_GAP))
    .attr('fill', COLORS.muted)
    .attr('rx', 2)

  // value labels at the outer end of each bar
  g.selectAll('text.lbl-left')
    .data(data)
    .join('text')
    .attr('class', 'lbl-left')
    .attr('x', (d) => xLeft(d.cases) - 8)
    .attr('y', (d) => y(d.road_user) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'end')
    .attr('fill', COLORS.textH)
    .style('font-size', CHART_AXIS_FONT)
    .text((d) => fmt.compact(d.cases))
  g.selectAll('text.lbl-right')
    .data(data)
    .join('text')
    .attr('class', 'lbl-right')
    .attr('x', (d) => xRight(d.avg_bed_days) + 8)
    .attr('y', (d) => y(d.road_user) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'start')
    .attr('fill', COLORS.textH)
    .style('font-size', CHART_AXIS_FONT)
    .text((d) => `${d.avg_bed_days}`)

  // axes
  g.append('g')
    .attr('transform', `translate(0,${IH})`)
    .call(d3.axisBottom(xLeft).ticks(5).tickFormat(fmt.compact))
    .call((s) => styleAxisTicks(s))
    .call((s) => styleAxisChrome(s))
  g.append('g')
    .attr('transform', `translate(0,${IH})`)
    .call(d3.axisBottom(xRight).ticks(5))
    .call((s) => styleAxisTicks(s))
    .call((s) => styleAxisChrome(s))

  // hover hit-zones
  g.selectAll('rect.row-hit')
    .data(data)
    .join('rect')
    .attr('class', 'row-hit')
    .attr('x', 0)
    .attr('y', (d) => y(d.road_user))
    .attr('width', IW)
    .attr('height', y.bandwidth())
    .attr('fill', 'transparent')
    .style('cursor', 'pointer')
    .on('mouseenter', (ev, d) =>
      tooltip.show(
        `<strong>${d.road_user}</strong><br>` +
          `${fmt.int(d.cases)} cases<br>` +
          `${fmt.int(d.bed_days)} total bed days<br>` +
          `${d.avg_bed_days} average bed days / case`,
        ev
      )
    )
    .on('mousemove', (ev) => tooltip.move(ev))
    .on('mouseleave', () => tooltip.hide())
}
