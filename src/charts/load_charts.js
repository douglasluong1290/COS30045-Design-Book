/* load_charts.js — orchestrator.
 *
 * Pulls the workbook (one network round-trip via load_data.js), then
 * routes each sheet to the matching chart's load() + chart() pipeline.
 * Chart 2 additionally needs the Australian states GeoJSON.
 */

import { loadData } from './load_data.js'
import { load as loadCh1, chart as chartCh1 } from './charts/ch1_chart.js'
import { load as loadCh2, chart as chartCh2 } from './charts/ch2_chart.js'
import { load as loadCh3, chart as chartCh3 } from './charts/ch3_chart.js'
import { load as loadCh4, chart as chartCh4 } from './charts/ch4_chart.js'
import { load as loadCh5, chart as chartCh5 } from './charts/ch5_chart.js'

const GEO_PATH = `${import.meta.env.BASE_URL}data/au-states.geojson`

export async function loadCharts() {
  try {
    const [sheets, geo] = await Promise.all([
      loadData(),
      fetch(GEO_PATH).then((r) => {
        if (!r.ok) throw new Error(`failed to fetch ${GEO_PATH} (HTTP ${r.status})`)
        return r.json()
      }),
    ])

    // each chart is wrapped so a single failure doesn't take down the others
    runChart('ch1', () => chartCh1(loadCh1(sheets.publication)))
    runChart('ch2', () =>
      chartCh2(loadCh2(sheets.state, sheets.population, geo))
    )
    runChart('ch3', () => chartCh3(loadCh3(sheets.publication)))
    runChart('ch4', () => chartCh4(loadCh4(sheets.publication)))
    runChart('ch5', () => chartCh5(loadCh5(sheets.state_road)))
  } catch (err) {
    console.error('chart bootstrap failed:', err)
  }
}

function runChart(name, fn) {
  try {
    fn()
  } catch (err) {
    console.error(`${name} failed:`, err)
  }
}
