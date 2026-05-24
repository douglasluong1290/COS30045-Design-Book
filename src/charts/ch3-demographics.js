/* Chart 03 — Small-multiples horizontal bars by age band.
 * Spec (charts_features.txt):
 *   - sheet: publication
 *   - filter: gender (All / Male / Female slicer)
 *   - bars: sum of count of cases vs sum of bed days
 *   - small multiples: age groups
 *   - vertical dotted light gray grid background
 *   - drop the missing age group
 *   - labels at the right end of the bars
 *   - horizontal bars, left → right
 */

import * as d3 from 'd3'
import { colors, fmt, mountSvg, makeTooltip } from './theme.js'

const W = 920
const H = 580
const PANEL_W = 420
const PANEL_H = 56          // bar row height
const PANEL_GAP_Y = 14      // vertical gap between age panels
const PANEL_GAP_X = 40      // gap between cases panel and bed-days panel
const MARGIN = { top: 70, right: 30, bottom: 30, left: 100 }

const AGE_ORDER = ['0-7', '8-16', '17-25', '26-39', '40-64', '65-74', '75+']

function aggregate(data, sex) {
  const filtered = sex === 'all' ? data : data.filter((d) => d.sex.toLowerCase() === sex)
  const grouped = d3.rollups(
    filtered,
    (rows) => ({
      cases: d3.sum(rows, (r) => r.cases),
      bed_days: d3.sum(rows, (r) => r.bed_days),
    }),
    (d) => d.age_band
  )
  const byAge = new Map(grouped)
  return AGE_ORDER.filter((a) => byAge.has(a)).map((a) => ({ age_band: a, ...byAge.get(a) }))
}

export async function initCh3() {
  const root = document.querySelector('#chart-3-demographics .placeholder-canvas')
  if (!root) return
  const raw = await fetch('data/age_sex.json').then((r) => r.json())

  const svg = mountSvg(root, { width: W, height: H })
  const tooltip = makeTooltip()

  // -------- slicer (rendered inside the SVG so it lives with the chart) --------
  let activeSex = 'all'
  const slicer = svg
    .append('g')
    .attr('class', 'slicer')
    .attr('transform', `translate(${MARGIN.left},20)`)

  slicer
    .append('text')
    .attr('y', 14)
    .attr('fill', colors.text)
    .style('font-size', '11px')
    .style('letter-spacing', '1.2px')
    .style('text-transform', 'uppercase')
    .text('Sex')

  const opts = [
    { value: 'all', label: 'All' },
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
  ]
  let cursor = 36
  const pills = opts.map((opt) => {
    const g = slicer.append('g').attr('transform', `translate(${cursor},0)`).style('cursor', 'pointer')
    const txt = g
      .append('text')
      .attr('x', 14)
      .attr('y', 14)
      .attr('fill', opt.value === activeSex ? colors.accent : colors.textH)
      .style('font-size', '12px')
      .text(opt.label)
    const w = txt.node().getComputedTextLength() + 28
    g.insert('rect', 'text')
      .attr('rx', 12)
      .attr('width', w)
      .attr('height', 24)
      .attr('fill', opt.value === activeSex ? colors.accentBg : 'transparent')
      .attr('stroke', opt.value === activeSex ? colors.accent : colors.border)
    g.on('click', () => {
      activeSex = opt.value
      pills.forEach((p) => {
        p.rect
          .attr('fill', p.value === activeSex ? colors.accentBg : 'transparent')
          .attr('stroke', p.value === activeSex ? colors.accent : colors.border)
        p.text.attr('fill', p.value === activeSex ? colors.accent : colors.textH)
      })
      render()
    })
    cursor += w + 8
    return { value: opt.value, rect: g.select('rect'), text: txt }
  })

  // -------- chart group --------
  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

  // labels for the two metric columns
  g.append('text')
    .attr('x', 0)
    .attr('y', -16)
    .attr('fill', colors.accent)
    .style('font-size', '11px')
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Count of cases')
  g.append('text')
    .attr('x', PANEL_W + PANEL_GAP_X)
    .attr('y', -16)
    .attr('fill', colors.muted)
    .style('font-size', '11px')
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Bed days')

  function render() {
    const rows = aggregate(raw, activeSex)
    const maxCases = d3.max(rows, (d) => d.cases) || 1
    const maxBeds = d3.max(rows, (d) => d.bed_days) || 1
    const xCases = d3.scaleLinear().domain([0, maxCases]).range([0, PANEL_W])
    const xBeds = d3.scaleLinear().domain([0, maxBeds]).range([0, PANEL_W])

    // bind one group per age band
    const panels = g
      .selectAll('g.panel')
      .data(rows, (d) => d.age_band)
      .join((enter) => {
        const p = enter
          .append('g')
          .attr('class', 'panel')
          .attr('transform', (_, i) => `translate(0,${i * (PANEL_H + PANEL_GAP_Y)})`)
        p.append('text')
          .attr('class', 'age-label')
          .attr('x', -14)
          .attr('y', PANEL_H / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'end')
          .attr('fill', colors.textH)
          .style('font-size', '13px')
          .style('font-weight', '500')
          .text((d) => d.age_band)
        // vertical dotted grid for each panel column
        const gridCases = p.append('g').attr('class', 'grid-cases')
        const gridBeds = p
          .append('g')
          .attr('class', 'grid-beds')
          .attr('transform', `translate(${PANEL_W + PANEL_GAP_X},0)`)
        ;[gridCases, gridBeds].forEach((gridG) => {
          gridG
            .selectAll('line')
            .data(d3.range(0, 5))
            .join('line')
            .attr('x1', (i) => (PANEL_W / 4) * i)
            .attr('x2', (i) => (PANEL_W / 4) * i)
            .attr('y1', 0)
            .attr('y2', PANEL_H)
            .attr('stroke', colors.border)
            .attr('stroke-dasharray', '2 4')
        })
        // bars
        p.append('rect')
          .attr('class', 'bar-cases')
          .attr('y', PANEL_H / 2 - 9)
          .attr('height', 18)
          .attr('rx', 2)
          .attr('fill', colors.accent)
        p.append('rect')
          .attr('class', 'bar-beds')
          .attr('y', PANEL_H / 2 - 9)
          .attr('height', 18)
          .attr('rx', 2)
          .attr('fill', colors.muted)
          .attr('transform', `translate(${PANEL_W + PANEL_GAP_X},0)`)
        // labels at the right end of each bar
        p.append('text')
          .attr('class', 'label-cases')
          .attr('y', PANEL_H / 2)
          .attr('dy', '0.35em')
          .attr('fill', colors.textH)
          .style('font-size', '12px')
          .style('font-weight', '500')
        p.append('text')
          .attr('class', 'label-beds')
          .attr('y', PANEL_H / 2)
          .attr('dy', '0.35em')
          .attr('fill', colors.textH)
          .style('font-size', '12px')
          .style('font-weight', '500')
        return p
      })

    const t = d3.transition().duration(450)

    panels
      .select('.bar-cases')
      .transition(t)
      .attr('width', (d) => xCases(d.cases))

    panels
      .select('.bar-beds')
      .transition(t)
      .attr('width', (d) => xBeds(d.bed_days))

    panels
      .select('.label-cases')
      .transition(t)
      .attr('x', (d) => xCases(d.cases) + 8)
      .text((d) => fmt.compact(d.cases))

    panels
      .select('.label-beds')
      .transition(t)
      .attr('x', (d) => PANEL_W + PANEL_GAP_X + xBeds(d.bed_days) + 8)
      .text((d) => fmt.compact(d.bed_days))

    // tooltip wiring
    panels
      .on('mouseenter', (ev, d) =>
        tooltip.show(
          `<strong>${d.age_band}</strong> · ${activeSex === 'all' ? 'all sexes' : activeSex}<br>` +
            `${fmt.int(d.cases)} cases<br>${fmt.int(d.bed_days)} bed days`,
          ev
        )
      )
      .on('mousemove', (ev) => tooltip.move(ev))
      .on('mouseleave', () => tooltip.hide())
  }

  render()
}
