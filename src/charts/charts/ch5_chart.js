/* Chart 5 — State × road user heatmap.
 *
 * Sheet: state_road
 * Spec:
 *   - x axis: states
 *   - y axis: road users
 *   - cell value (heat): sum of count of cases
 */

import * as d3 from 'd3'
import {
  CHART_AXIS_FONT,
  CHART_LEGEND_FONT,
  COLORS,
  fmt,
  makeTooltip,
  mountSvg,
  wrapAxisTickLabel,
} from './constants.js'

const W = 1200
const H = 640
const M = { top: 80, right: 80, bottom: 60, left: 280 }
const IW = W - M.left - M.right
const IH = H - M.top - M.bottom

const STATE_ORDER = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT']

/* load() — parse the state_road CSV, aggregate cases by (state, road user). */
export function load(csv) {
  const rows = d3.csvParse(csv, d3.autoType)

  const agg = d3.rollups(
    rows,
    (v) => d3.sum(v, (r) => Number(r['count of cases']) || 0),
    (r) => r['state or territory'],
    (r) => r['road user']
  )

  const flat = []
  for (const [state, perRU] of agg) {
    for (const [road_user, cases] of perRU) {
      if (state && road_user) flat.push({ state, road_user, cases })
    }
  }
  return flat
}

/* chart() — render heatmap into #chart-5-heatmap .placeholder-canvas */
export function chart(data) {
  const root = document.querySelector('#chart-5-heatmap .placeholder-canvas')
  if (!root) return

  const svg = mountSvg(root, { width: W, height: H })
  const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`)
  const tooltip = makeTooltip()

  // Axis domains — preserve project-wide ordering for states; sort road
  // users by total cases descending so the busiest categories sit at the
  // top of the matrix.
  const states = STATE_ORDER.filter((s) => data.some((d) => d.state === s))
  const roadUsers = Array.from(
    d3.rollup(
      data,
      (v) => d3.sum(v, (d) => d.cases),
      (d) => d.road_user
    )
  )
    .sort((a, b) => b[1] - a[1])
    .map(([ru]) => ru)

  // Fill in every (state × road user) combination so the grid has no holes.
  const lookup = new Map(data.map((d) => [`${d.state}|${d.road_user}`, d.cases]))
  const cells = []
  for (const s of states) {
    for (const ru of roadUsers) {
      cells.push({ state: s, road_user: ru, cases: lookup.get(`${s}|${ru}`) || 0 })
    }
  }

  const x = d3.scaleBand().domain(states).range([0, IW]).padding(0.04)
  const y = d3.scaleBand().domain(roadUsers).range([0, IH]).padding(0.06)

  const maxVal = d3.max(cells, (d) => d.cases) || 1
  const color = d3.scaleSequential(d3.interpolateReds).domain([0, maxVal])

  // Cells
  g.selectAll('rect.cell')
    .data(cells)
    .join('rect')
    .attr('class', 'cell')
    .attr('x', (d) => x(d.state))
    .attr('y', (d) => y(d.road_user))
    .attr('width', x.bandwidth())
    .attr('height', y.bandwidth())
    .attr('fill', (d) => (d.cases > 0 ? color(d.cases) : COLORS.border))
    .attr('rx', 2)
    .attr('stroke', COLORS.bg)
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('mouseenter', function (ev, d) {
      d3.select(this).attr('stroke', COLORS.textH).attr('stroke-width', 2)
      tooltip.show(
        `<strong>${d.state}</strong> × ${d.road_user}<br>` +
          `${fmt.int(d.cases)} cases`,
        ev
      )
    })
    .on('mousemove', (ev) => tooltip.move(ev))
    .on('mouseleave', function () {
      d3.select(this).attr('stroke', COLORS.bg).attr('stroke-width', 1)
      tooltip.hide()
    })

  // Cell value labels — show every non-zero cell (small values use a smaller type size).
  const labelThreshold = maxVal * 0.15
  g.selectAll('text.cell-label')
    .data(cells.filter((d) => d.cases > 0))
    .join('text')
    .attr('class', 'cell-label')
    .attr('x', (d) => x(d.state) + x.bandwidth() / 2)
    .attr('y', (d) => y(d.road_user) + y.bandwidth() / 2)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', (d) => (d.cases > maxVal * 0.55 ? '#fff' : COLORS.textH))
    .style('font-size', CHART_AXIS_FONT)
    .style('font-weight', '500')
    .style('pointer-events', 'none')
    .text((d) => fmt.compact(d.cases))

  // X axis — state codes at the bottom
  g.append('g')
    .attr('transform', `translate(0,${IH})`)
    .call(d3.axisBottom(x).tickSize(0))
    .call((s) =>
      s
        .selectAll('text')
        .attr('fill', COLORS.textH)
        .attr('dy', '1.2em')
        .style('font-size', CHART_AXIS_FONT)
        .style('font-weight', '600')
    )
    .call((s) => s.selectAll('path').attr('stroke', 'none'))

  // Y axis — road user labels (wrapped, max 4 words per line)
  const yAxis = g.append('g').call(d3.axisLeft(y).tickSize(0))
  yAxis.selectAll('path').attr('stroke', 'none')
  yAxis
    .selectAll('text')
    .attr('fill', COLORS.textH)
    .attr('dx', '-0.4em')
    .attr('text-anchor', 'end')
    .style('font-size', CHART_AXIS_FONT)
    .call(wrapAxisTickLabel, 4)

  // Axis titles
  g.append('text')
    .attr('x', IW / 2)
    .attr('y', IH + 44)
    .attr('text-anchor', 'middle')
    .attr('fill', COLORS.text)
    .style('font-size', CHART_AXIS_FONT)
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('State / territory')

  g.append('text')
    .attr('x', -IH / 2)
    .attr('y', -M.left + 24)
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'middle')
    .attr('fill', COLORS.text)
    .style('font-size', CHART_AXIS_FONT)
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Road user')

  // Color legend — horizontal gradient ramp top-right of the chart
  drawColorLegend(svg, color, maxVal, {
    x: M.left + IW - 220,
    y: 28,
    width: 220,
    height: 10,
  })
}

function drawColorLegend(parent, color, maxVal, { x, y, width, height }) {
  const id = `grad-ch5-${Math.random().toString(36).slice(2, 8)}`
  const lg = parent.append('g').attr('transform', `translate(${x},${y})`)

  const grad = lg.append('defs').append('linearGradient').attr('id', id)
  d3.range(0, 1.01, 0.1).forEach((t) => {
    grad
      .append('stop')
      .attr('offset', `${t * 100}%`)
      .attr('stop-color', color(t * maxVal))
  })

  lg.append('text')
    .attr('y', -6)
    .attr('fill', COLORS.text)
    .style('font-size', CHART_LEGEND_FONT)
    .style('letter-spacing', '0.8px')
    .style('text-transform', 'uppercase')
    .text('Legend: Cases — heat scale')

  lg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('rx', 2)
    .attr('fill', `url(#${id})`)
    .attr('stroke', COLORS.border)
    .attr('stroke-width', 0.5)

  lg.append('text')
    .attr('y', height + 14)
    .attr('fill', COLORS.text)
    .style('font-size', CHART_AXIS_FONT)
    .text('0')

  lg.append('text')
    .attr('x', width)
    .attr('y', height + 14)
    .attr('text-anchor', 'end')
    .attr('fill', COLORS.text)
    .style('font-size', CHART_AXIS_FONT)
    .text(fmt.compact(maxVal))
}
