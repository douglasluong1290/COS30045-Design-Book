import * as d3 from 'd3'

const css = getComputedStyle(document.documentElement)
const cv = (name, fallback) =>
  (css.getPropertyValue(name).trim() || fallback)

export const colors = {
  accent: cv('--accent', '#aa3bff'),
  accentBg: cv('--accent-bg', 'rgba(170,59,255,0.1)'),
  text: cv('--text', '#6b6375'),
  textH: cv('--text-h', '#08060d'),
  border: cv('--border', '#e5e4e7'),
  bg: cv('--bg', '#fff'),
  muted: '#9ca3af',
  amber: '#f59e0b',
  teal: '#0ea5b7',
}

export const phasePalette = {
  'Hospitalised injuries': colors.muted,
  'Change in admissions 2012': colors.accent,
  'Change in admissions 2017': colors.amber,
}

export const fmt = {
  int: d3.format(',d'),
  compact: (n) => {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
    return String(n)
  },
}

/** Mount an SVG inside a `.placeholder-canvas`, replacing any hint paragraph. */
export function mountSvg(rootEl, { width = 800, height = 480 } = {}) {
  rootEl.innerHTML = ''
  rootEl.style.padding = '0'
  rootEl.style.background = colors.bg
  rootEl.style.display = 'block'
  rootEl.style.overflow = 'hidden'

  const svg = d3
    .select(rootEl)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('role', 'img')
    .style('width', '100%')
    .style('height', '100%')
    .style('display', 'block')
  return svg
}

/** Draw a dotted light-gray grid background (mirrors the pbix theme). */
export function drawGrid(g, xScale, yScale, width, height, { vertical = true, horizontal = true } = {}) {
  const grid = g.append('g').attr('class', 'grid').attr('pointer-events', 'none')
  if (vertical) {
    grid
      .append('g')
      .selectAll('line')
      .data(xScale.ticks ? xScale.ticks() : xScale.domain())
      .join('line')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', colors.border)
      .attr('stroke-dasharray', '2 4')
      .attr('stroke-width', 1)
  }
  if (horizontal) {
    grid
      .append('g')
      .selectAll('line')
      .data(yScale.ticks ? yScale.ticks(5) : yScale.domain())
      .join('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', colors.border)
      .attr('stroke-dasharray', '2 4')
      .attr('stroke-width', 1)
  }
  return grid
}

/** A floating tooltip attached to a parent (defaults to <body>). */
export function makeTooltip(parent = document.body) {
  const node = document.createElement('div')
  node.className = 'd3-tooltip'
  Object.assign(node.style, {
    position: 'fixed',
    pointerEvents: 'none',
    padding: '8px 12px',
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    fontSize: '13px',
    color: colors.textH,
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
    opacity: '0',
    transition: 'opacity 0.12s',
    zIndex: '9999',
    maxWidth: '260px',
    lineHeight: '1.4',
  })
  parent.appendChild(node)
  return {
    show(html, ev) {
      node.innerHTML = html
      node.style.opacity = '1'
      this.move(ev)
    },
    move(ev) {
      const pad = 14
      const x = ev.clientX + pad
      const y = ev.clientY + pad
      node.style.left = `${x}px`
      node.style.top = `${y}px`
    },
    hide() {
      node.style.opacity = '0'
    },
    destroy() {
      node.remove()
    },
  }
}
