/* Chart 01 — National trend line.
 * Spec (charts_features.txt):
 *   - sheet: publication
 *   - dotted light gray grid background
 *   - x: year, y: hospitalisation count
 *   - legend: admission category (3 phases)
 *   - hover on the line/year intersection → tooltip (year + cases)
 */

import * as d3 from 'd3'
import { colors, phasePalette, fmt, mountSvg, drawGrid, makeTooltip } from './theme.js'

const W = 880
const H = 480
const MARGIN = { top: 50, right: 30, bottom: 50, left: 80 }
const IW = W - MARGIN.left - MARGIN.right
const IH = H - MARGIN.top - MARGIN.bottom

export async function initCh1() {
  const root = document.querySelector('#chart-1-trend .placeholder-canvas')
  if (!root) return
  const data = await fetch('data/national_trend.json').then((r) => r.json())

  const svg = mountSvg(root, { width: W, height: H })
  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.year))
    .range([0, IW])
  const y = d3
    .scaleLinear()
    .domain([d3.min(data, (d) => d.hospitalisations) * 0.95, d3.max(data, (d) => d.hospitalisations) * 1.02])
    .nice()
    .range([IH, 0])

  drawGrid(g, x, y, IW, IH, { vertical: true, horizontal: true })

  // axes
  g.append('g')
    .attr('transform', `translate(0,${IH})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(data.length))
    .call((sel) => sel.selectAll('text').attr('fill', colors.text))
    .call((sel) => sel.selectAll('line, path').attr('stroke', colors.border))
  g.append('g')
    .call(d3.axisLeft(y).ticks(6).tickFormat(fmt.compact))
    .call((sel) => sel.selectAll('text').attr('fill', colors.text))
    .call((sel) => sel.selectAll('line, path').attr('stroke', colors.border))

  // axis titles
  g.append('text')
    .attr('x', -IH / 2)
    .attr('y', -56)
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'middle')
    .attr('fill', colors.text)
    .style('font-size', '12px')
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Hospitalisation count')
  g.append('text')
    .attr('x', IW / 2)
    .attr('y', IH + 38)
    .attr('text-anchor', 'middle')
    .attr('fill', colors.text)
    .style('font-size', '12px')
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Year')

  // split the dataset into the three phase-segments, each segment overlapping by 1 point
  // so the polyline visually connects across category boundaries.
  const segments = []
  for (let i = 0; i < data.length - 1; i++) {
    const a = data[i]
    const b = data[i + 1]
    // segment colour = the "incoming" year's admission (b)
    segments.push({ from: a, to: b, admission: b.admission })
  }

  const line = d3
    .line()
    .x((d) => x(d.year))
    .y((d) => y(d.hospitalisations))

  g.append('g')
    .selectAll('path.segment')
    .data(segments)
    .join('path')
    .attr('class', 'segment')
    .attr('d', (s) => line([s.from, s.to]))
    .attr('fill', 'none')
    .attr('stroke', (s) => phasePalette[s.admission])
    .attr('stroke-width', 3)
    .attr('stroke-linecap', 'round')

  // points
  const points = g
    .append('g')
    .selectAll('circle')
    .data(data)
    .join('circle')
    .attr('cx', (d) => x(d.year))
    .attr('cy', (d) => y(d.hospitalisations))
    .attr('r', 5)
    .attr('fill', (d) => phasePalette[d.admission])
    .attr('stroke', colors.bg)
    .attr('stroke-width', 2)

  // hover hit-area (transparent vertical strips per year)
  const tooltip = makeTooltip()
  const hitW = IW / (data.length - 1)
  g.append('g')
    .selectAll('rect')
    .data(data)
    .join('rect')
    .attr('x', (d) => x(d.year) - hitW / 2)
    .attr('y', 0)
    .attr('width', hitW)
    .attr('height', IH)
    .attr('fill', 'transparent')
    .on('mouseenter', function (ev, d) {
      points
        .filter((p) => p.year === d.year)
        .transition()
        .duration(120)
        .attr('r', 8)
      tooltip.show(
        `<strong style="color:${phasePalette[d.admission]}">${d.year}</strong><br>` +
          `${fmt.int(d.hospitalisations)} hospitalisations<br>` +
          `<span style="color:${colors.text};font-size:11px">${d.admission}</span>`,
        ev
      )
    })
    .on('mousemove', (ev) => tooltip.move(ev))
    .on('mouseleave', function () {
      points.transition().duration(120).attr('r', 5)
      tooltip.hide()
    })

  // legend (admission categories)
  const legendItems = Object.entries(phasePalette)
  const legend = svg
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${MARGIN.left},${MARGIN.top - 30})`)
  let cursor = 0
  legendItems.forEach(([label, color]) => {
    const item = legend.append('g').attr('transform', `translate(${cursor},0)`)
    item.append('rect').attr('width', 14).attr('height', 4).attr('y', 6).attr('rx', 2).attr('fill', color)
    const txt = item
      .append('text')
      .attr('x', 20)
      .attr('y', 12)
      .attr('fill', colors.text)
      .style('font-size', '12px')
      .text(label)
    cursor += 20 + txt.node().getComputedTextLength() + 24
  })
}
