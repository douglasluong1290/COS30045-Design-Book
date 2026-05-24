/* Chart 02 — State map with click-to-drill.
 * Spec (charts_features.txt):
 *   - sheet: state
 *   - map: Australia's states; per-state circle sized by sum of count of cases
 *   - hover → "see more" tooltip
 *   - click → drill into line × bar combo (line: cases over years,
 *             bar: population over years), back button returns to map
 *   - VIC: change in admission 2012; NSW: change in 2017 — legend like ch1
 */

import * as d3 from 'd3'
import { colors, phasePalette, fmt, mountSvg, drawGrid, makeTooltip } from './theme.js'

const W = 880
const H = 540
const MARGIN = { top: 30, right: 30, bottom: 30, left: 30 }

const STATE_NAME_TO_CODE = {
  'New South Wales': 'NSW',
  Victoria: 'VIC',
  Queensland: 'QLD',
  'South Australia': 'SA',
  'Western Australia': 'WA',
  Tasmania: 'TAS',
  'Northern Territory': 'NT',
  'Australian Capital Territory': 'ACT',
}

function admissionFor(year, stateCode) {
  // VIC: change in 2012; NSW: change in 2017
  if (stateCode === 'VIC') {
    if (year === 2011) return 'Hospitalised injuries'
    if (year >= 2012 && year <= 2016) return 'Change in admissions 2012'
    return 'Change in admissions 2017'
  }
  if (stateCode === 'NSW') {
    if (year <= 2016) return 'Hospitalised injuries'
    return 'Change in admissions 2017'
  }
  return null
}

export async function initCh2() {
  const root = document.querySelector('#chart-2-states .placeholder-canvas')
  if (!root) return

  const [geo, totals, trend, population] = await Promise.all([
    fetch('data/au-states.geojson').then((r) => r.json()),
    fetch('data/state_totals.json').then((r) => r.json()),
    fetch('data/state_trend.json').then((r) => r.json()),
    fetch('data/population.json').then((r) => r.json()),
  ])

  // enrich geo features with our state code + total cases
  geo.features.forEach((f) => {
    const code = STATE_NAME_TO_CODE[f.properties.STATE_NAME] || f.properties.STATE_NAME
    f.properties.code = code
    const t = totals.find((r) => r.state === code)
    f.properties.cases = t ? t.cases : 0
  })

  const svg = mountSvg(root, { width: W, height: H })

  // ------- two layers: map + drill -------
  const mapLayer = svg.append('g').attr('class', 'map-layer')
  const drillLayer = svg.append('g').attr('class', 'drill-layer').style('display', 'none')

  // ---- map layer ----
  const projection = d3.geoMercator().fitSize([W - 60, H - 60], geo)
  const path = d3.geoPath(projection)

  mapLayer
    .append('g')
    .attr('transform', 'translate(30,30)')
    .selectAll('path')
    .data(geo.features)
    .join('path')
    .attr('d', path)
    .attr('fill', colors.accentBg)
    .attr('stroke', colors.border)
    .attr('stroke-width', 1)

  const rScale = d3.scaleSqrt().domain([0, d3.max(totals, (d) => d.cases)]).range([6, 38])

  const tooltip = makeTooltip()
  const bubbles = mapLayer
    .append('g')
    .attr('transform', 'translate(30,30)')
    .selectAll('g.bubble')
    .data(geo.features.filter((f) => f.properties.cases > 0))
    .join('g')
    .attr('class', 'bubble')
    .attr('transform', (f) => {
      const c = projection(d3.geoCentroid(f))
      return `translate(${c[0]},${c[1]})`
    })
    .style('cursor', 'pointer')

  bubbles
    .append('circle')
    .attr('r', (f) => rScale(f.properties.cases))
    .attr('fill', colors.accent)
    .attr('fill-opacity', 0.55)
    .attr('stroke', colors.accent)
    .attr('stroke-width', 1.5)

  bubbles
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', colors.textH)
    .style('font-size', '11px')
    .style('font-weight', '600')
    .style('pointer-events', 'none')
    .text((f) => f.properties.code)

  bubbles
    .on('mouseenter', function (ev, f) {
      d3.select(this).select('circle').transition().duration(120).attr('fill-opacity', 0.85)
      tooltip.show(
        `<strong>${f.properties.STATE_NAME}</strong><br>` +
          `${fmt.int(f.properties.cases)} total cases (2011–2021)<br>` +
          `<span style="color:${colors.accent};font-size:11px">Click to see more →</span>`,
        ev
      )
    })
    .on('mousemove', (ev) => tooltip.move(ev))
    .on('mouseleave', function () {
      d3.select(this).select('circle').transition().duration(120).attr('fill-opacity', 0.55)
      tooltip.hide()
    })
    .on('click', (ev, f) => openDrill(f.properties.code, f.properties.STATE_NAME))

  // title on the map
  mapLayer
    .append('text')
    .attr('x', 30)
    .attr('y', 20)
    .attr('fill', colors.text)
    .style('font-size', '12px')
    .style('letter-spacing', '1px')
    .style('text-transform', 'uppercase')
    .text('Total hospitalised cases by state, 2011–2021 · click a bubble for detail')

  // ---- drill layer ----
  function openDrill(stateCode, stateName) {
    tooltip.hide()
    drillLayer.selectAll('*').remove()

    const dW = W
    const dH = H
    const dM = { top: 60, right: 60, bottom: 60, left: 70 }
    const dIW = dW - dM.left - dM.right
    const dIH = dH - dM.top - dM.bottom

    // back button
    const back = drillLayer
      .append('g')
      .attr('class', 'back-btn')
      .attr('transform', `translate(20,20)`)
      .style('cursor', 'pointer')
    back
      .append('rect')
      .attr('rx', 6)
      .attr('width', 110)
      .attr('height', 32)
      .attr('fill', colors.accentBg)
      .attr('stroke', colors.accent)
    back
      .append('text')
      .attr('x', 55)
      .attr('y', 21)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.accent)
      .style('font-size', '13px')
      .style('font-weight', '500')
      .text('← Back to map')
    back.on('click', closeDrill)

    drillLayer
      .append('text')
      .attr('x', dW / 2)
      .attr('y', 36)
      .attr('text-anchor', 'middle')
      .attr('fill', colors.textH)
      .style('font-size', '20px')
      .style('font-weight', '500')
      .text(stateName)

    const stateRows = trend
      .filter((r) => r.state === stateCode)
      .sort((a, b) => a.year - b.year)
    const popRows = population
      .filter((p) => p.state === stateCode)
      .sort((a, b) => a.year - b.year)

    const x = d3
      .scaleLinear()
      .domain(d3.extent(stateRows, (d) => d.year))
      .range([0, dIW])

    const yCases = d3
      .scaleLinear()
      .domain([0, d3.max(stateRows, (d) => d.cases) * 1.1])
      .nice()
      .range([dIH, 0])
    const yPop = d3
      .scaleLinear()
      .domain([0, d3.max(popRows, (d) => d.population) * 1.1])
      .nice()
      .range([dIH, 0])

    const dg = drillLayer.append('g').attr('transform', `translate(${dM.left},${dM.top})`)

    drawGrid(dg, x, yCases, dIW, dIH)

    // population bars (drawn first so the line sits on top)
    const bw = Math.max(8, (dIW / stateRows.length) * 0.55)
    dg.append('g')
      .selectAll('rect.pop-bar')
      .data(popRows)
      .join('rect')
      .attr('class', 'pop-bar')
      .attr('x', (d) => x(d.year) - bw / 2)
      .attr('y', (d) => yPop(d.population))
      .attr('width', bw)
      .attr('height', (d) => dIH - yPop(d.population))
      .attr('fill', colors.muted)
      .attr('opacity', 0.35)
      .on('mouseenter', (ev, d) =>
        tooltip.show(
          `<strong>${d.year}</strong><br>Population: ${fmt.int(d.population * 1000)}`,
          ev
        )
      )
      .on('mousemove', (ev) => tooltip.move(ev))
      .on('mouseleave', () => tooltip.hide())

    // cases line — phase-coloured for VIC and NSW
    const isPhased = stateCode === 'VIC' || stateCode === 'NSW'
    if (isPhased) {
      const segments = []
      for (let i = 0; i < stateRows.length - 1; i++) {
        segments.push({
          from: stateRows[i],
          to: stateRows[i + 1],
          admission: admissionFor(stateRows[i + 1].year, stateCode),
        })
      }
      dg.append('g')
        .selectAll('path.segment')
        .data(segments)
        .join('path')
        .attr('d', (s) =>
          d3
            .line()
            .x((d) => x(d.year))
            .y((d) => yCases(d.cases))([s.from, s.to])
        )
        .attr('fill', 'none')
        .attr('stroke', (s) => phasePalette[s.admission])
        .attr('stroke-width', 3)
    } else {
      const lineGen = d3
        .line()
        .x((d) => x(d.year))
        .y((d) => yCases(d.cases))
      dg.append('path')
        .datum(stateRows)
        .attr('d', lineGen)
        .attr('fill', 'none')
        .attr('stroke', colors.accent)
        .attr('stroke-width', 3)
    }

    dg.append('g')
      .selectAll('circle.case-dot')
      .data(stateRows)
      .join('circle')
      .attr('class', 'case-dot')
      .attr('cx', (d) => x(d.year))
      .attr('cy', (d) => yCases(d.cases))
      .attr('r', 5)
      .attr('fill', (d) =>
        isPhased ? phasePalette[admissionFor(d.year, stateCode)] : colors.accent
      )
      .attr('stroke', colors.bg)
      .attr('stroke-width', 2)
      .on('mouseenter', (ev, d) =>
        tooltip.show(
          `<strong>${d.year}</strong><br>` +
            `${fmt.int(d.cases)} cases<br>` +
            `${fmt.int(d.bed_days)} bed days`,
          ev
        )
      )
      .on('mousemove', (ev) => tooltip.move(ev))
      .on('mouseleave', () => tooltip.hide())

    // axes
    dg.append('g')
      .attr('transform', `translate(0,${dIH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(stateRows.length))
      .call((sel) => sel.selectAll('text').attr('fill', colors.text))
      .call((sel) => sel.selectAll('line, path').attr('stroke', colors.border))
    dg.append('g')
      .call(d3.axisLeft(yCases).ticks(5).tickFormat(fmt.compact))
      .call((sel) => sel.selectAll('text').attr('fill', colors.accent))
      .call((sel) => sel.selectAll('line, path').attr('stroke', colors.border))
    dg.append('g')
      .attr('transform', `translate(${dIW},0)`)
      .call(d3.axisRight(yPop).ticks(5).tickFormat((v) => `${fmt.compact(v * 1000)}`))
      .call((sel) => sel.selectAll('text').attr('fill', colors.muted))
      .call((sel) => sel.selectAll('line, path').attr('stroke', colors.border))

    dg.append('text')
      .attr('x', -8)
      .attr('y', -14)
      .attr('fill', colors.accent)
      .style('font-size', '11px')
      .style('letter-spacing', '0.8px')
      .style('text-transform', 'uppercase')
      .text('Cases (line)')
    dg.append('text')
      .attr('x', dIW + 8)
      .attr('y', -14)
      .attr('text-anchor', 'end')
      .attr('fill', colors.muted)
      .style('font-size', '11px')
      .style('letter-spacing', '0.8px')
      .style('text-transform', 'uppercase')
      .text('Population (bar)')

    // legend for VIC + NSW
    if (isPhased) {
      const items = Object.entries(phasePalette)
      const lg = drillLayer.append('g').attr('transform', `translate(${dM.left},${dH - 36})`)
      let cursor = 0
      items.forEach(([label, color]) => {
        const it = lg.append('g').attr('transform', `translate(${cursor},0)`)
        it.append('rect').attr('y', 6).attr('width', 14).attr('height', 4).attr('rx', 2).attr('fill', color)
        const txt = it
          .append('text')
          .attr('x', 20)
          .attr('y', 12)
          .attr('fill', colors.text)
          .style('font-size', '11px')
          .text(label)
        cursor += 22 + txt.node().getComputedTextLength() + 22
      })
    }

    mapLayer.style('display', 'none')
    drillLayer.style('display', 'block')
  }

  function closeDrill() {
    drillLayer.style('display', 'none')
    mapLayer.style('display', 'block')
  }
}
