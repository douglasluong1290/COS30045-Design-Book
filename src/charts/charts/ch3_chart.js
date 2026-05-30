/* Chart 3 — Small-multiples horizontal bars by age band, with sex slicer.
 *
 * Sheet: publication
 * Spec:
 *   - filter by sex (slicer)
 *   - bars: sum of count of cases vs sum of bed days
 *   - small multiples: age groups
 *   - vertical dotted light gray grid
 *   - drop the "missing" age group
 *   - value labels at the right end of each bar
 *   - bars horizontal, left → right
 */

import * as d3 from 'd3'
import { AGE_ORDER, COLORS, fmt, makeTooltip, mountSvg } from './constants.js'

const W = 920
const H = 580
const PANEL_W = 420
const PANEL_H = 56
const PANEL_GAP_Y = 14
const PANEL_GAP_X = 40
const M = { top: 80, right: 30, bottom: 30, left: 100 }

/* load() — parse + filter missing age group + aggregate by (age, sex) */
export function load(csv) {
  const rows = d3.csvParse(csv, d3.autoType)
  const cleaned = rows.filter((r) => {
    const a = (r['Age group'] || '').toString().trim().toLowerCase()
    return a && !['missing', 'not stated', 'unknown'].includes(a)
  })
  const agg = d3.rollups(
    cleaned,
    (v) => ({
      cases: d3.sum(v, (r) => r['Count of cases'] ?? 0),
      bed_days: d3.sum(v, (r) => r['Bed days'] ?? 0),
    }),
    (r) => r['Age group'],
    (r) => r['Sex']
  )
  // flatten to [{age_band, sex, cases, bed_days}]
  const flat = []
  for (const [age, perSex] of agg) {
    for (const [sex, totals] of perSex) {
      flat.push({ age_band: age, sex, ...totals })
    }
  }
  return flat
}

/* chart() — render with the in-SVG sex slicer */
export function chart(data) {
  const root = document.querySelector('#chart-3-demographics .placeholder-canvas')
  if (!root) return

  const svg = mountSvg(root, { width: W, height: H })
  const tooltip = makeTooltip()

  // ----- slicer -----
  let activeSex = 'all'
  const slicer = svg.append('g').attr('class', 'slicer').attr('transform', `translate(${M.left},24)`)
  slicer
    .append('text')
    .attr('y', 14)
    .attr('fill', COLORS.text)
    .style('font-size', '11px')
    .style('letter-spacing', '1.2px')
    .style('text-transform', 'uppercase')
    .text('Sex')

  const opts = [
    { value: 'all', label: 'All' },
    { value: 'Female', label: 'Female' },
    { value: 'Male', label: 'Male' },
  ]
  let cursor = 36
  const pills = opts.map((opt) => {
    const g = slicer.append('g').attr('transform', `translate(${cursor},0)`).style('cursor', 'pointer')
    const txt = g
      .append('text')
      .attr('x', 14)
      .attr('y', 14)
      .attr('fill', opt.value === activeSex ? COLORS.accent : COLORS.textH)
      .style('font-size', '12px')
      .text(opt.label)
    const w = txt.node().getComputedTextLength() + 28
    const rect = g
      .insert('rect', 'text')
      .attr('rx', 12)
      .attr('width', w)
      .attr('height', 24)
      .attr('fill', opt.value === activeSex ? COLORS.accentBg : 'transparent')
      .attr('stroke', opt.value === activeSex ? COLORS.accent : COLORS.border)
    g.on('click', () => {
      activeSex = opt.value
      pills.forEach((p) => {
        p.rect
          .attr('fill', p.value === activeSex ? COLORS.accentBg : 'transparent')
          .attr('stroke', p.value === activeSex ? COLORS.accent : COLORS.border)
        p.text.attr('fill', p.value === activeSex ? COLORS.accent : COLORS.textH)
      })
      render()
    })
    cursor += w + 8
    return { value: opt.value, rect, text: txt }
  })

  // ----- chart group -----
  const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`)
  // header — both metrics shown together
  g.append('text')
    .attr('x', 0)
    .attr('y', -16)
    .attr('fill', COLORS.text)
    .style('font-size', '11px')
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Demographics by age: clustered bars (cases · bed days)')

  function aggForSex(sex) {
    const filtered = sex === 'all' ? data : data.filter((d) => d.sex === sex)
    const byAge = d3.rollup(
      filtered,
      (v) => ({
        cases: d3.sum(v, (r) => r.cases),
        bed_days: d3.sum(v, (r) => r.bed_days),
      }),
      (d) => d.age_band
    )
    return AGE_ORDER.filter((a) => byAge.has(a)).map((a) => ({ age_band: a, ...byAge.get(a) }))
  }

  function render() {
    const rows = aggForSex(activeSex)
    // shared x scale so both metrics are comparable in the clustered layout
    const maxCases = d3.max(rows, (d) => d.cases) || 1
    const maxBeds = d3.max(rows, (d) => d.bed_days) || 1
    const maxVal = Math.max(maxCases, maxBeds)
    const x = d3.scaleLinear().domain([0, maxVal]).range([0, PANEL_W])

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
          .attr('fill', COLORS.textH)
          .style('font-size', '13px')
          .style('font-weight', '500')
          .text((d) => d.age_band)
        // single grid for the shared x axis
        .append('g')
        .attr('class', 'grid')
        .selectAll('line')
        .data(d3.range(0, 5))
        .join('line')
        .attr('x1', (i) => (PANEL_W / 4) * i)
        .attr('x2', (i) => (PANEL_W / 4) * i)
        .attr('y1', 0)
        .attr('y2', PANEL_H)
        .attr('stroke', COLORS.border)
        .attr('stroke-dasharray', '2 4')
        // two stacked bars per age band (clustered) — vertically offset
        p.append('rect')
          .attr('class', 'bar-cases')
          .attr('y', PANEL_H / 2 - 10)
          .attr('height', 12)
          .attr('rx', 2)
          .attr('fill', COLORS.accent)
        p.append('rect')
          .attr('class', 'bar-beds')
          .attr('y', PANEL_H / 2 + 2)
          .attr('height', 12)
          .attr('rx', 2)
          .attr('fill', COLORS.muted)
        p.append('text')
          .attr('class', 'label-cases')
          .attr('y', PANEL_H / 2 - 4)
          .attr('dy', '0.35em')
          .attr('fill', COLORS.textH)
          .style('font-size', '12px')
          .style('font-weight', '500')
        p.append('text')
          .attr('class', 'label-beds')
          .attr('y', PANEL_H / 2 + 8)
          .attr('dy', '0.35em')
          .attr('fill', COLORS.textH)
          .style('font-size', '12px')
          .style('font-weight', '500')
        return p
      })

    const t = d3.transition().duration(450)

    panels.select('.bar-cases').transition(t).attr('width', (d) => x(d.cases))
    panels.select('.bar-beds').transition(t).attr('width', (d) => x(d.bed_days))
    panels
      .select('.label-cases')
      .transition(t)
      .attr('x', (d) => x(d.cases) + 8)
      .text((d) => fmt.compact(d.cases))
    panels
      .select('.label-beds')
      .transition(t)
      .attr('x', (d) => x(d.bed_days) + 8)
      .text((d) => fmt.compact(d.bed_days))

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
