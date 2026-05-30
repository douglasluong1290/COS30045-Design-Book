/* Chart 1 — annotated national line.
 *
 * Sheet: publication
 * Spec:
 *   - dotted light-gray grid
 *   - x = year, y = hospitalisation count
 *   - legend = admission category (3-tone)
 *   - hover on a year → tooltip (year + cases)
 */

import * as d3 from 'd3'
import {
  CHART_TEXT_STYLE,
  COLORS,
  PHASE_PALETTE,
  admissionFor,
  drawGrid,
  fmt,
  appendLegendPrefix,
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

/* load() — parse the publication CSV string and aggregate by year. */
export function load(csv) {
  const rows = d3.csvParse(csv, d3.autoType)
  const byYear = d3.rollup(
    rows,
    (v) => d3.sum(v, (r) => r['Hospitalisations'] ?? 0),
    (r) => r['Calendar year']
  )
  return Array.from(byYear, ([year, hospitalisations]) => ({
    year,
    hospitalisations,
    admission: admissionFor(year),
  })).sort((a, b) => a.year - b.year)
}

/* chart() — render into #chart-1-trend .placeholder-canvas. */
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
      d3.min(data, (d) => d.hospitalisations) * 0.95,
      d3.max(data, (d) => d.hospitalisations) * 1.02,
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
    .text('Hospitalisation count')
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

  // segments — colour by the INCOMING year's admission
  const segments = []
  for (let i = 0; i < data.length - 1; i++) {
    segments.push({
      from: data[i],
      to: data[i + 1],
      admission: data[i + 1].admission,
    })
  }
  const line = d3
    .line()
    .x((d) => x(d.year))
    .y((d) => y(d.hospitalisations))

  g.append('g')
    .selectAll('path.seg')
    .data(segments)
    .join('path')
    .attr('class', 'seg')
    .attr('d', (s) => line([s.from, s.to]))
    .attr('fill', 'none')
    .attr('stroke', (s) => PHASE_PALETTE[s.admission])
    .attr('stroke-width', 3)
    .attr('stroke-linecap', 'round')

  // dots
  const dots = g
    .append('g')
    .selectAll('circle')
    .data(data)
    .join('circle')
    .attr('cx', (d) => x(d.year))
    .attr('cy', (d) => y(d.hospitalisations))
    .attr('r', 5)
    .attr('fill', (d) => PHASE_PALETTE[d.admission])
    .attr('stroke', COLORS.bg)
    .attr('stroke-width', 2)

  // hit rects (one per year band) — drive the tooltip
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
          `${fmt.int(d.hospitalisations)} hospitalisations<br>` +
          `<span style="color:${COLORS.text};${CHART_TEXT_STYLE}">${d.admission}</span>`,
        ev
      )
    })
    .on('mousemove', (ev) => tooltip.move(ev))
    .on('mouseleave', function () {
      dots.transition().duration(120).attr('r', 5)
      tooltip.hide()
    })

  // legend
  const legend = svg
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${M.left},${M.top - 32})`)
  let cursor = appendLegendPrefix(legend)
  Object.entries(PHASE_PALETTE).forEach(([label, color]) => {
    const item = legend.append('g').attr('transform', `translate(${cursor},0)`)
    item.append('rect').attr('y', 6).attr('width', 14).attr('height', 4).attr('rx', 2).attr('fill', color)
    const txt = styleChartText(item.append('text').attr('x', 20).attr('y', 12)).text(label)
    cursor += 20 + txt.node().getComputedTextLength() + 24
  })
}
