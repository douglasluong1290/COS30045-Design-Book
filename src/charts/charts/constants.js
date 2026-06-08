/* constants.js — values shared across the four chart modules.
 *
 * Colors are read from the page's CSS custom properties so the charts
 * inherit the dark / light theme automatically.
 */

import * as d3 from 'd3'

const css = getComputedStyle(document.documentElement)
const cv = (name, fallback) => css.getPropertyValue(name).trim() || fallback

export const COLORS = {
  accent: cv('--accent', '#aa3bff'),
  accentBg: cv('--accent-bg', 'rgba(170,59,255,0.1)'),
  text: cv('--text', '#6b6375'),
  textH: cv('--text-h', '#08060d'),
  border: cv('--border', '#e5e4e7'),
  bg: cv('--bg', '#fff'),
  muted: '#9ca3af',
  amber: '#f59e0b',
}

/* Three-tone admission palette — kept in the SAME hue family (purple)
 * so the visual difference between admission categories is carried by
 * line-type (see PHASE_DASH) rather than colour. Spec for chart 1 +
 * chart 2's drill line.
 */
export const PHASE_PALETTE = {
  'Hospitalised injuries': '#d1a8ff',
  'Change in admissions 2012': '#aa3bff',
  'Change in admissions 2017': '#6b1aa0',
}

/* Stroke-dasharray paired with each admission category. Empty string =
 * solid stroke. */
export const PHASE_DASH = {
  'Hospitalised injuries': '',
  'Change in admissions 2012': '8 4',
  'Change in admissions 2017': '2 4',
}

/* Red-hue sequential scale builder for chart 2's choropleth. */
export const choroplethColor = (domain) =>
  d3.scaleSequential(d3.interpolateReds).domain(domain)

/* Ascending age order for chart 3's small-multiples panels. */
export const AGE_ORDER = ['0-7', '8-16', '17-25', '26-39', '40-64', '65-74', '75+']

/* Map full state names (from the GeoJSON) to the codes the dataset uses. */
export const STATE_NAME_TO_CODE = {
  'New South Wales': 'NSW',
  Victoria: 'VIC',
  Queensland: 'QLD',
  'South Australia': 'SA',
  'Western Australia': 'WA',
  Tasmania: 'TAS',
  'Northern Territory': 'NT',
  'Australian Capital Territory': 'ACT',
}

export const STATE_CODE_TO_NAME = Object.fromEntries(
  Object.entries(STATE_NAME_TO_CODE).map(([n, c]) => [c, n])
)

export const fmt = {
  int: d3.format(',d'),
  compact: (n) => {
    if (!Number.isFinite(n)) return '—'
    const abs = Math.abs(n)
    if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`
    if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}k`
    return String(n)
  },
}

/* Chart 1 typography — shared by every chart module. */
export const CHART_AXIS_FONT = '14px'
export const CHART_LEGEND_FONT = CHART_AXIS_FONT
export const CHART_FILTER_FONT = CHART_AXIS_FONT
export const CHART_FONT_FAMILY = cv(
  '--sans',
  "system-ui, 'Segoe UI', Roboto, sans-serif"
)

/** Inline CSS for HTML tooltips (same family + size as chart 1). */
export const CHART_TEXT_STYLE = `font-size:${CHART_AXIS_FONT};font-family:${CHART_FONT_FAMILY}`

export function styleChartText(selection, fill = COLORS.text) {
  return selection
    .attr('fill', fill)
    .style('font-size', CHART_AXIS_FONT)
    .style('font-family', CHART_FONT_FAMILY)
}

/** Returns x-offset after a leading “Legend:” label (for horizontal legend rows). */
export function appendLegendPrefix(g, { x = 0, y = 12 } = {}) {
  const t = styleChartText(
    g.append('text').attr('x', x).attr('y', y),
    COLORS.text
  ).text('Legend:')
  return x + t.node().getComputedTextLength() + 8
}

export function styleAxisTicks(selection, fill = COLORS.text) {
  return styleChartText(selection.selectAll('text'), fill)
}

export function styleAxisChrome(selection) {
  return selection.selectAll('line, path').attr('stroke', COLORS.border)
}

/** Population-bar width in chart-2 drill; reused as horizontal bar thickness in chart 3. */
export function drillBarSize(innerWidth, slotCount) {
  return Math.max(8, (innerWidth / Math.max(slotCount, 1)) * 0.55)
}

/** Axis tick labels: wrap at most `wordsPerLine` words per line (chart 5 y-axis). */
export function wrapAxisTickLabel(textSel, wordsPerLine = 4, lineHeightEm = 1.12) {
  textSel.each(function () {
    const el = d3.select(this)
    const full = el.text()
    const words = full.split(/\s+/).filter(Boolean)
    if (words.length <= wordsPerLine) return

    const x = el.attr('x')
    const y = el.attr('y')
    const dy = el.attr('dy') ?? 0
    const anchor = el.attr('text-anchor')
    const dx = el.attr('dx')
    const lines = []
    for (let i = 0; i < words.length; i += wordsPerLine) {
      lines.push(words.slice(i, i + wordsPerLine).join(' '))
    }

    el.text(null)
    lines.forEach((line, i) => {
      const tspan = styleChartText(el.append('tspan').text(line), COLORS.textH)
      if (x != null) tspan.attr('x', x)
      if (anchor) tspan.attr('text-anchor', anchor)
      if (dx != null) tspan.attr('dx', dx)
      tspan.attr('dy', i === 0 ? dy : `${lineHeightEm}em`)
      if (i === 0 && y != null) tspan.attr('y', y)
    })
  })
}

/* Admission category — same SWITCH rule as the spec.  */
export function admissionFor(year) {
  if (year === 2011) return 'Hospitalised injuries'
  if (year >= 2012 && year <= 2016) return 'Change in admissions 2012'
  return 'Change in admissions 2017'
}

/* VIC and NSW each have their own admission cut-over (per spec). */
export function stateAdmissionFor(year, stateCode) {
  if (stateCode === 'VIC') return admissionFor(year)
  if (stateCode === 'NSW') {
    if (year <= 2016) return 'Hospitalised injuries'
    return 'Change in admissions 2017'
  }
  return null
}

/* Mount a responsive SVG into a .placeholder-canvas. */
export function mountSvg(rootEl, { width = 880, height = 520 } = {}) {
  rootEl.innerHTML = ''
  rootEl.style.padding = '0'
  rootEl.style.background = COLORS.bg
  rootEl.style.display = 'block'
  rootEl.style.overflow = 'hidden'

  return d3
    .select(rootEl)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('role', 'img')
    .style('width', '100%')
    .style('height', '100%')
    .style('display', 'block')
    .style('font-family', CHART_FONT_FAMILY)
    .style('font-size', CHART_AXIS_FONT)
}

/* Dotted light-gray background grid (the spec calls for it everywhere). */
export function drawGrid(g, xScale, yScale, w, h, { vertical = true, horizontal = true } = {}) {
  const grid = g.append('g').attr('class', 'grid').attr('pointer-events', 'none')
  if (vertical && xScale?.ticks) {
    grid
      .append('g')
      .selectAll('line')
      .data(xScale.ticks(6))
      .join('line')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', 0)
      .attr('y2', h)
      .attr('stroke', COLORS.border)
      .attr('stroke-dasharray', '2 4')
  }
  if (horizontal && yScale?.ticks) {
    grid
      .append('g')
      .selectAll('line')
      .data(yScale.ticks(5))
      .join('line')
      .attr('x1', 0)
      .attr('x2', w)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', COLORS.border)
      .attr('stroke-dasharray', '2 4')
  }
  return grid
}

/* A floating tooltip — one per chart is fine. */
export function makeTooltip() {
  const node = document.createElement('div')
  node.className = 'd3-tooltip'
  Object.assign(node.style, {
    position: 'fixed',
    pointerEvents: 'none',
    padding: '8px 12px',
    background: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    fontSize: CHART_AXIS_FONT,
    fontFamily: CHART_FONT_FAMILY,
    color: COLORS.textH,
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
    opacity: '0',
    transition: 'opacity 0.12s',
    zIndex: '9999',
    maxWidth: '260px',
    lineHeight: '1.4',
  })
  document.body.appendChild(node)
  return {
    show(html, ev) {
      node.innerHTML = html
      node.style.opacity = '1'
      this.move(ev)
    },
    move(ev) {
      node.style.left = `${ev.clientX + 14}px`
      node.style.top = `${ev.clientY + 14}px`
    },
    hide() {
      node.style.opacity = '0'
    },
  }
}
