/* Chart 4 — Road-user dumbbell.
 *
 * Sheet: publication
 * Spec:
 *   - x: sum of count of cases vs sum of bed days
 *   - y: road user
 *   - dotted light gray grid background
 *   - include legend
 *   - hover: tooltip with road user, cases, bed days
 *
 * Baked-in filter: drop rows where Road user = "Not applicable".
 * (Mirrors the page-level filter in the final pbix.)
 */

import * as d3 from 'd3'
import {
  appendLegendPrefix,
  CHART_FONT_FAMILY,
  COLORS,
  fmt,
  makeTooltip,
  mountSvg,
  styleAxisChrome,
  styleAxisTicks,
  wrapAxisTickLabel,
} from './constants.js'

const W = 1300
const H = 700
const M = { top: 70, right: 140, bottom: 50, left: 300 }
const CHART_SHIFT_X = 100
const PLOT_GAP_X = 14
/** Chart 4 only — +2px over the shared 14px chart typography. */
const CH4_FONT = '16px'
const CH4_TEXT_STYLE = `font-size:${CH4_FONT};font-family:${CHART_FONT_FAMILY}`

function styleCh4Text(selection, fill = COLORS.text) {
  return selection
    .attr('fill', fill)
    .style('font-size', CH4_FONT)
    .style('font-family', CHART_FONT_FAMILY)
}
const IW = W - M.left - M.right
const IH = H - M.top - M.bottom

/* load() — parse + filter + aggregate by Road user */
export function load(csv) {
  const rows = d3.csvParse(csv, d3.autoType)
  const filtered = rows.filter((r) => {
    const ru = (r['Road user'] || '').toString().trim().toLowerCase()
    return ru && ru !== 'not applicable'
  })
  const agg = d3.rollups(
    filtered,
    (v) => ({
      cases: d3.sum(v, (r) => r['Count of cases'] ?? 0),
      bed_days: d3.sum(v, (r) => r['Bed days'] ?? 0),
    }),
    (r) => r['Road user']
  )
  return agg
    .map(([road_user, totals]) => ({ road_user, ...totals }))
    .sort((a, b) => b.cases - a.cases)
}

/* chart() — render dumbbell */
export function chart(data) {
  const root = document.querySelector('#chart-4-mechanism .placeholder-canvas')
  if (!root) return

  const svg = mountSvg(root, { width: W, height: H }).style('font-size', CH4_FONT)
  // center the chart group horizontally within the SVG by using the
  // midpoint of the left/right margins, and apply the top margin as before
  const centerX = (M.left + M.right) / 2
  const chartG = svg
    .append('g')
    .attr('class', 'chart-content')
    .attr('transform', `translate(${centerX + CHART_SHIFT_X},${M.top})`)
  const plotG = chartG.append('g').attr('class', 'plot-layer').attr('transform', `translate(${PLOT_GAP_X},0)`)
  const tooltip = makeTooltip()

  const y = d3
    .scaleBand()
    .domain(data.map((d) => d.road_user))
    .range([0, IH])
    .padding(0.3)

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => Math.max(d.cases, d.bed_days)) * 1.05])
    .nice()
    .range([0, IW])

  // dotted vertical grid
  plotG.append('g')
    .selectAll('line')
    .data(x.ticks(6))
    .join('line')
    .attr('x1', (d) => x(d))
    .attr('x2', (d) => x(d))
    .attr('y1', 0)
    .attr('y2', IH)
    .attr('stroke', COLORS.border)
    .attr('stroke-dasharray', '2 4')

  // x-axis
  plotG
    .append('g')
    .attr('transform', `translate(0,${IH})`)
    .call(d3.axisBottom(x).ticks(6).tickFormat(fmt.compact))
    .call((s) => styleCh4Text(s.selectAll('text')))
    .call((s) => styleAxisChrome(s))
  // Y-axis labels only (no axis line); plot shifted right of labels
  const yAxis = chartG.append('g').attr('class', 'y-axis-layer').call(d3.axisLeft(y).tickSize(0))
  yAxis.selectAll('path').attr('stroke', 'none')
  yAxis.selectAll('line').attr('stroke', 'none')
  styleCh4Text(yAxis.selectAll('text'), COLORS.textH)
    .attr('text-anchor', 'end')
    .attr('transform', 'translate(-30,0)')
    .call(wrapAxisTickLabel, 4)
  yAxis.selectAll('tspan').style('font-size', CH4_FONT).style('font-family', CHART_FONT_FAMILY)

  styleCh4Text(
    plotG.append('text').attr('x', IW / 2).attr('y', IH + 38).attr('text-anchor', 'middle')
  )
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Count')

  // dumbbells
  const row = plotG
    .append('g')
    .selectAll('g.dumbbell')
    .data(data, (d) => d.road_user)
    .join('g')
    .attr('class', 'dumbbell')
    .attr('transform', (d) => `translate(0,${y(d.road_user) + y.bandwidth() / 2})`)
    .style('cursor', 'pointer')

  row
    .append('line')
    .attr('x1', (d) => x(Math.min(d.cases, d.bed_days)))
    .attr('x2', (d) => x(Math.max(d.cases, d.bed_days)))
    .attr('y1', 0)
    .attr('y2', 0)
    .attr('stroke', COLORS.border)
    .attr('stroke-width', 2)
  row
    .append('circle')
    .attr('class', 'pt-cases')
    .attr('cx', (d) => x(d.cases))
    .attr('r', 8)
    .attr('fill', COLORS.accent)
    .attr('stroke', COLORS.bg)
    .attr('stroke-width', 2)
  row
    .append('circle')
    .attr('class', 'pt-beds')
    .attr('cx', (d) => x(d.bed_days))
    .attr('r', 8)
    .attr('fill', COLORS.muted)
    .attr('stroke', COLORS.bg)
    .attr('stroke-width', 2)

  // value labels (outboard of whichever dot is the outer one)
  row
    .append('text')
    .attr('x', (d) => x(d.cases) + (d.cases >= d.bed_days ? 14 : -14))
    .attr('text-anchor', (d) => (d.cases >= d.bed_days ? 'start' : 'end'))
    .attr('dy', '0.35em')
    .attr('fill', COLORS.accent)
    .text((d) => fmt.compact(d.cases))
  row
    .append('text')
    .attr('x', (d) => x(d.bed_days) + (d.bed_days > d.cases ? 14 : -14))
    .attr('text-anchor', (d) => (d.bed_days > d.cases ? 'start' : 'end'))
    .attr('dy', '0.35em')
    .attr('fill', COLORS.muted)
    .text((d) => fmt.compact(d.bed_days))

  row
    .on('mouseenter', function (ev, d) {
      d3.select(this).selectAll('circle').transition().duration(120).attr('r', 11)
      tooltip.show(
        `<strong>${d.road_user}</strong><br>` +
          `${fmt.int(d.cases)} cases<br>${fmt.int(d.bed_days)} bed days<br>` +
          `<span style="color:${COLORS.text};${CH4_TEXT_STYLE}">${(d.bed_days / d.cases).toFixed(1)} bed days / case</span>`,
        ev
      )
    })
    .on('mousemove', (ev) => tooltip.move(ev))
    .on('mouseleave', function () {
      d3.select(this).selectAll('circle').transition().duration(120).attr('r', 8)
      tooltip.hide()
    })

  // legend
  const legend = svg
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${M.left + CHART_SHIFT_X},24)`)
  const items = [
    { label: 'Count of cases', color: COLORS.accent },
    { label: 'Bed days', color: COLORS.muted },
  ]
  let cursor = appendLegendPrefix(legend, { y: 14 })
  items.forEach((it) => {
    const item = legend.append('g').attr('transform', `translate(${cursor},0)`)
    item.append('circle').attr('r', 6).attr('cx', 6).attr('cy', 10).attr('fill', it.color)
    const t = styleCh4Text(item.append('text').attr('x', 18).attr('y', 14)).text(it.label)
    cursor += 18 + t.node().getComputedTextLength() + 28
  })
  legend.selectAll('text').style('font-size', CH4_FONT).style('font-family', CHART_FONT_FAMILY)
}
