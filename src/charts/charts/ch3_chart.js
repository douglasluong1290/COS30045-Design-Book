/* Chart 3 — Back-to-back tornado bar chart, by age group.
 *
 * Sheet: publication
 * Spec:
 *   - filter: gender (sex slicer)
 *   - LEFT bar: count of cases (value axis at bottom-left)
 *   - RIGHT bar: average bed days (sum bed days / sum cases, rounded)
 *   - rows: age groups (small multiples)
 *   - vertical dotted light gray grid
 *   - legend + hover tooltips
 */

import * as d3 from 'd3'
import {
  AGE_ORDER,
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
const H = 580
const M = { top: 100, right: 60, bottom: 60, left: 60 }
const IW = W - M.left - M.right
const IH = H - M.top - M.bottom
const CENTER_GAP = 130
const HALF = (IW - CENTER_GAP) / 2

/* load() — parse publication CSV, drop missing/unknown age groups,
 * aggregate by (age band, sex) summing cases + bed days. */
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
  const flat = []
  for (const [age_band, perSex] of agg) {
    for (const [sex, totals] of perSex) {
      flat.push({ age_band, sex, ...totals })
    }
  }
  return flat
}

/* chart() */
export function chart(data) {
  const root = document.querySelector('#chart-3-demographics .placeholder-canvas')
  if (!root) return

  const svg = mountSvg(root, { width: W, height: H })
  const tooltip = makeTooltip()

  // ----- sex slicer -----
  let activeSex = 'all'
  const slicer = svg
    .append('g')
    .attr('class', 'slicer')
    .attr('transform', `translate(${M.left},22)`)
  styleChartText(slicer.append('text').attr('y', 14), COLORS.text)
    .style('letter-spacing', '1.2px')
    .style('text-transform', 'uppercase')
    .text('Sex')

  const opts = [
    { value: 'all', label: 'All' },
    { value: 'Female', label: 'Female' },
    { value: 'Male', label: 'Male' },
  ]
  let cursor = 60
  const pills = opts.map((opt) => {
    const gg = slicer
      .append('g')
      .attr('transform', `translate(${cursor},0)`)
      .style('cursor', 'pointer')
    const txt = styleChartText(
      gg.append('text').attr('x', 14).attr('y', 14),
      opt.value === activeSex ? COLORS.accent : COLORS.textH
    ).text(opt.label)
    const w = txt.node().getComputedTextLength() + 28
    const rect = gg
      .insert('rect', 'text')
      .attr('rx', 12)
      .attr('width', w)
      .attr('height', 24)
      .attr('fill', opt.value === activeSex ? COLORS.accentBg : 'transparent')
      .attr('stroke', opt.value === activeSex ? COLORS.accent : COLORS.border)
    gg.on('click', () => {
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

  // ----- legend (right of slicer) -----
  const legend = svg
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${M.left + 380},22)`)
  let lc = appendLegendPrefix(legend, { y: 14 })
  ;[
    { label: 'Count of cases', color: COLORS.accent },
    { label: 'Average bed days', color: COLORS.muted },
  ].forEach((it) => {
    const item = legend.append('g').attr('transform', `translate(${lc},0)`)
    item
      .append('rect')
      .attr('y', 8)
      .attr('width', 16)
      .attr('height', 8)
      .attr('rx', 2)
      .attr('fill', it.color)
    const t = styleChartText(
      item.append('text').attr('x', 22).attr('y', 14),
      COLORS.text
    ).text(it.label)
    lc += 22 + t.node().getComputedTextLength() + 24
  })

  // ----- chart group -----
  const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`)

  // column headers
  styleChartText(
    g.append('text').attr('x', HALF - 4).attr('y', -18).attr('text-anchor', 'end'),
    COLORS.accent
  )
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Count of cases')
  styleChartText(
    g
      .append('text')
      .attr('x', HALF + CENTER_GAP + 4)
      .attr('y', -18)
      .attr('text-anchor', 'start'),
    COLORS.muted
  )
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Average bed days')

  function aggForSex(sex) {
    const filtered = sex === 'all' ? data : data.filter((d) => d.sex === sex)
    const byAge = d3.rollup(
      filtered,
      (v) => {
        const cases = d3.sum(v, (r) => r.cases)
        const bed_days = d3.sum(v, (r) => r.bed_days)
        const avg_bed_days = cases > 0 ? Math.round(bed_days / cases) : 0
        return { cases, bed_days, avg_bed_days }
      },
      (d) => d.age_band
    )
    return AGE_ORDER.filter((a) => byAge.has(a)).map((a) => ({
      age_band: a,
      ...byAge.get(a),
    }))
  }

  const y = d3.scaleBand().domain(AGE_ORDER).range([0, IH]).padding(0.22)

  // vertical dotted grid containers; populated each render
  const gridLeft = g.append('g').attr('class', 'grid grid-left')
  const gridRight = g.append('g').attr('class', 'grid grid-right')
  const xLeftAxisG = g.append('g').attr('transform', `translate(0,${IH})`)
  const xRightAxisG = g.append('g').attr('transform', `translate(0,${IH})`)

  // central age labels (drawn once)
  g.selectAll('text.age-label')
    .data(AGE_ORDER)
    .join('text')
    .attr('class', 'age-label')
    .attr('x', HALF + CENTER_GAP / 2)
    .attr('y', (d) => y(d) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', 'middle')
    .attr('fill', COLORS.textH)
    .style('font-size', CHART_AXIS_FONT)
    .style('font-weight', '500')
    .text((d) => d)

  function render() {
    const rows = aggForSex(activeSex)
    const maxCases = d3.max(rows, (d) => d.cases) || 1
    const maxAvg = d3.max(rows, (d) => d.avg_bed_days) || 1

    const xLeft = d3.scaleLinear().domain([0, maxCases]).nice().range([HALF, 0])
    const xRight = d3
      .scaleLinear()
      .domain([0, maxAvg])
      .nice()
      .range([HALF + CENTER_GAP, IW])

    gridLeft
      .selectAll('line')
      .data(xLeft.ticks(5))
      .join('line')
      .attr('x1', (d) => xLeft(d))
      .attr('x2', (d) => xLeft(d))
      .attr('y1', 0)
      .attr('y2', IH)
      .attr('stroke', COLORS.border)
      .attr('stroke-dasharray', '2 4')
    gridRight
      .selectAll('line')
      .data(xRight.ticks(5))
      .join('line')
      .attr('x1', (d) => xRight(d))
      .attr('x2', (d) => xRight(d))
      .attr('y1', 0)
      .attr('y2', IH)
      .attr('stroke', COLORS.border)
      .attr('stroke-dasharray', '2 4')

    const left = g
      .selectAll('rect.bar-left')
      .data(rows, (d) => d.age_band)
      .join('rect')
      .attr('class', 'bar-left')
      .attr('y', (d) => y(d.age_band))
      .attr('height', y.bandwidth())
      .attr('fill', COLORS.accent)
      .attr('rx', 2)
    left
      .transition()
      .duration(450)
      .attr('x', (d) => xLeft(d.cases))
      .attr('width', (d) => HALF - xLeft(d.cases))

    const right = g
      .selectAll('rect.bar-right')
      .data(rows, (d) => d.age_band)
      .join('rect')
      .attr('class', 'bar-right')
      .attr('y', (d) => y(d.age_band))
      .attr('height', y.bandwidth())
      .attr('fill', COLORS.muted)
      .attr('rx', 2)
    right
      .transition()
      .duration(450)
      .attr('x', HALF + CENTER_GAP)
      .attr('width', (d) => xRight(d.avg_bed_days) - (HALF + CENTER_GAP))

    g.selectAll('text.lbl-left')
      .data(rows, (d) => d.age_band)
      .join('text')
      .attr('class', 'lbl-left')
      .attr('y', (d) => y(d.age_band) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', COLORS.textH)
      .style('font-size', CHART_AXIS_FONT)
      .transition()
      .duration(450)
      .attr('x', (d) => xLeft(d.cases) - 8)
      .text((d) => fmt.compact(d.cases))

    g.selectAll('text.lbl-right')
      .data(rows, (d) => d.age_band)
      .join('text')
      .attr('class', 'lbl-right')
      .attr('y', (d) => y(d.age_band) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'start')
      .attr('fill', COLORS.textH)
      .style('font-size', CHART_AXIS_FONT)
      .transition()
      .duration(450)
      .attr('x', (d) => xRight(d.avg_bed_days) + 8)
      .text((d) => `${d.avg_bed_days}`)

    xLeftAxisG
      .call(d3.axisBottom(xLeft).ticks(5).tickFormat(fmt.compact))
      .call((s) => styleAxisTicks(s))
      .call((s) => styleAxisChrome(s))
    xRightAxisG
      .call(d3.axisBottom(xRight).ticks(5))
      .call((s) => styleAxisTicks(s))
      .call((s) => styleAxisChrome(s))

    g.selectAll('rect.row-hit')
      .data(rows, (d) => d.age_band)
      .join('rect')
      .attr('class', 'row-hit')
      .attr('x', 0)
      .attr('y', (d) => y(d.age_band))
      .attr('width', IW)
      .attr('height', y.bandwidth())
      .attr('fill', 'transparent')
      .on('mouseenter', (ev, d) =>
        tooltip.show(
          `<strong>${d.age_band}</strong> · ${activeSex === 'all' ? 'all sexes' : activeSex}<br>` +
            `${fmt.int(d.cases)} cases<br>` +
            `${fmt.int(d.bed_days)} total bed days<br>` +
            `${d.avg_bed_days} average bed days / case`,
          ev
        )
      )
      .on('mousemove', (ev) => tooltip.move(ev))
      .on('mouseleave', () => tooltip.hide())
  }

  render()
}
