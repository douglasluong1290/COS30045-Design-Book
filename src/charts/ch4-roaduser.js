/* Chart 04 — Road user dumbbell.
 * Spec (charts_features.txt):
 *   - sheet: publication (filtered: road_user ≠ "Not applicable" — baked in)
 *   - x: sum of count of cases vs sum of bed days (two scales)
 *   - y: road user
 *   - dotted light gray grid background
 *   - include legend
 *   - hover: road user, cases, bed days
 */

import * as d3 from 'd3'
import { colors, fmt, mountSvg, makeTooltip } from './theme.js'

const W = 920
const H = 580
const MARGIN = { top: 70, right: 140, bottom: 50, left: 220 }
const IW = W - MARGIN.left - MARGIN.right
const IH = H - MARGIN.top - MARGIN.bottom

export async function initCh4() {
  const root = document.querySelector('#chart-4-mechanism .placeholder-canvas')
  if (!root) return
  const data = await fetch('data/road_user.json').then((r) => r.json())
  // assert the baked filter
  if (data.some((d) => /not applicable/i.test(d.road_user))) {
    console.warn('ch4: "Not applicable" rows leaked into the dataset')
  }
  const rows = [...data].sort((a, b) => b.cases - a.cases)

  const svg = mountSvg(root, { width: W, height: H })
  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)
  const tooltip = makeTooltip()

  const y = d3
    .scaleBand()
    .domain(rows.map((d) => d.road_user))
    .range([0, IH])
    .padding(0.3)

  const xCases = d3
    .scaleLinear()
    .domain([0, d3.max(rows, (d) => Math.max(d.cases, d.bed_days)) * 1.05])
    .nice()
    .range([0, IW])

  // dotted grid (vertical lines = x ticks)
  g.append('g')
    .attr('class', 'grid')
    .selectAll('line')
    .data(xCases.ticks(6))
    .join('line')
    .attr('x1', (d) => xCases(d))
    .attr('x2', (d) => xCases(d))
    .attr('y1', 0)
    .attr('y2', IH)
    .attr('stroke', colors.border)
    .attr('stroke-dasharray', '2 4')

  // axes
  g.append('g')
    .attr('transform', `translate(0,${IH})`)
    .call(d3.axisBottom(xCases).ticks(6).tickFormat(fmt.compact))
    .call((sel) => sel.selectAll('text').attr('fill', colors.text))
    .call((sel) => sel.selectAll('line, path').attr('stroke', colors.border))
  g.append('g')
    .call(d3.axisLeft(y))
    .call((sel) =>
      sel.selectAll('text').attr('fill', colors.textH).style('font-size', '12px')
    )
    .call((sel) => sel.selectAll('line, path').attr('stroke', colors.border))

  g.append('text')
    .attr('x', IW / 2)
    .attr('y', IH + 38)
    .attr('text-anchor', 'middle')
    .attr('fill', colors.text)
    .style('font-size', '12px')
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Count')

  // dumbbells — connecting line, then two circles per row
  const row = g
    .append('g')
    .selectAll('g.dumbbell')
    .data(rows, (d) => d.road_user)
    .join('g')
    .attr('class', 'dumbbell')
    .attr('transform', (d) => `translate(0,${y(d.road_user) + y.bandwidth() / 2})`)

  row
    .append('line')
    .attr('x1', (d) => xCases(Math.min(d.cases, d.bed_days)))
    .attr('x2', (d) => xCases(Math.max(d.cases, d.bed_days)))
    .attr('y1', 0)
    .attr('y2', 0)
    .attr('stroke', colors.border)
    .attr('stroke-width', 2)

  row
    .append('circle')
    .attr('class', 'pt-cases')
    .attr('cx', (d) => xCases(d.cases))
    .attr('r', 8)
    .attr('fill', colors.accent)
    .attr('stroke', colors.bg)
    .attr('stroke-width', 2)

  row
    .append('circle')
    .attr('class', 'pt-beds')
    .attr('cx', (d) => xCases(d.bed_days))
    .attr('r', 8)
    .attr('fill', colors.muted)
    .attr('stroke', colors.bg)
    .attr('stroke-width', 2)

  // value labels next to the dots (right end of whichever is rightmost)
  row
    .append('text')
    .attr('class', 'lbl-cases')
    .attr('x', (d) => xCases(d.cases) + (d.cases >= d.bed_days ? 14 : -14))
    .attr('text-anchor', (d) => (d.cases >= d.bed_days ? 'start' : 'end'))
    .attr('dy', '0.35em')
    .attr('fill', colors.accent)
    .style('font-size', '11px')
    .text((d) => fmt.compact(d.cases))

  row
    .append('text')
    .attr('class', 'lbl-beds')
    .attr('x', (d) => xCases(d.bed_days) + (d.bed_days > d.cases ? 14 : -14))
    .attr('text-anchor', (d) => (d.bed_days > d.cases ? 'start' : 'end'))
    .attr('dy', '0.35em')
    .attr('fill', colors.muted)
    .style('font-size', '11px')
    .text((d) => fmt.compact(d.bed_days))

  // hover interaction on whole row
  row
    .style('cursor', 'pointer')
    .on('mouseenter', function (ev, d) {
      d3.select(this).selectAll('circle').transition().duration(120).attr('r', 11)
      tooltip.show(
        `<strong>${d.road_user}</strong><br>` +
          `${fmt.int(d.cases)} cases<br>` +
          `${fmt.int(d.bed_days)} bed days<br>` +
          `<span style="color:${colors.text};font-size:11px">${(d.bed_days / d.cases).toFixed(1)} bed days / case</span>`,
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
    .attr('transform', `translate(${MARGIN.left},20)`)
  const items = [
    { label: 'Count of cases', color: colors.accent },
    { label: 'Bed days', color: colors.muted },
  ]
  let cursor = 0
  items.forEach((it) => {
    const item = legend.append('g').attr('transform', `translate(${cursor},0)`)
    item.append('circle').attr('r', 6).attr('cx', 6).attr('cy', 10).attr('fill', it.color)
    const txt = item
      .append('text')
      .attr('x', 18)
      .attr('y', 14)
      .attr('fill', colors.text)
      .style('font-size', '12px')
      .text(it.label)
    cursor += 18 + txt.node().getComputedTextLength() + 28
  })
}
