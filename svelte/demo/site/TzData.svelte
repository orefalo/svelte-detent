<script module lang="ts">
  /**
   * Data and maths for the "Time zones" example, ported from the original source: the cities and their skylines, the
   * time-zone helpers, the sun and moon (position, phase), the colour of the sky by sun height, the weather lookup, and
   * `paintSky`, which writes one city's sky (colours, sun, moon, stars, clouds, windows...) straight to its SVG.
   */
  export interface City { name: string; tz: string; lat: number; lon: number; skyline: string }
  export const HOME: City = { name: 'Madrid', tz: 'Europe/Madrid', lat: 40.42, lon: -3.7, skyline: 'madrid' }
  export const NEARBY: City[] = [
    { name: 'New York', tz: 'America/New_York', lat: 40.71, lon: -74.01, skyline: 'newyork' },
    { name: 'London', tz: 'Europe/London', lat: 51.51, lon: -0.13, skyline: 'london' },
    { name: 'Tokyo', tz: 'Asia/Tokyo', lat: 35.68, lon: 139.69, skyline: 'tokyo' },
    { name: 'Sydney', tz: 'Australia/Sydney', lat: -33.87, lon: 151.21, skyline: 'sydney' },
  ]
  export const MORE: City[] = [
    { name: 'Paris', tz: 'Europe/Paris', lat: 48.86, lon: 2.35, skyline: 'paris' },
    { name: 'Dubai', tz: 'Asia/Dubai', lat: 25.2, lon: 55.27, skyline: 'dubai' },
    { name: 'Rio de Janeiro', tz: 'America/Sao_Paulo', lat: -22.91, lon: -43.17, skyline: 'rio' },
  ]
  export const CITIES: City[] = [HOME, ...NEARBY, ...MORE]
  /** The scrub: a day in quarter hours. */
  export const QUARTERS = Array.from({ length: 96 }, (_, i) => i)

  /** "14:30" as shown: 24 hour, or 12 hour with AM / PM apart. */
  export function clockFace(time: string, h12: boolean) {
    if (!h12) return { time, half: '' }
    const [h, m] = time.split(':').map(Number) as [number, number]
    return { time: `${h % 12 || 12}:${String(m).padStart(2, '0')}`, half: h < 12 ? 'AM' : 'PM' }
  }

  const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
  const RAD = Math.PI / 180

  // --- time zones -------------------------------------------------------------------------------------------------
  const formatters = new Map<string, Intl.DateTimeFormat>()
  export interface Zoned { date: string; hour: number; time: string; gmt: string; offset: number }
  /** An instant as the wall clock of a zone: date, hour, "HH:MM", "GMT+1" and the offset in minutes. */
  export function zoneParts(tz: string, at: Date): Zoned {
    let f = formatters.get(tz)
    if (!f) {
      f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset' })
      formatters.set(tz, f)
    }
    const p = Object.fromEntries(f.formatToParts(at).map((x) => [x.type, x.value])) as Record<string, string>
    const [, sign, hours, minutes] = /GMT(?:([+-])(\d+)(?::(\d+))?)?/.exec(p.timeZoneName!)!
    const offset = (sign === '-' ? -1 : 1) * (60 * Number(hours ?? 0) + Number(minutes ?? 0))
    return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) + Number(p.minute) / 60, time: `${p.hour}:${p.minute}`, gmt: p.timeZoneName!, offset }
  }
  /** The instant at `minutes` past midnight of a calendar day, in a zone. */
  export function zonedDate(tz: string, year: number, month: number, day: number, minutes: number): Date {
    const utc = Date.UTC(year, month - 1, day, 0, minutes)
    const guess = utc - 60000 * zoneParts(tz, new Date(utc)).offset
    return new Date(utc - 60000 * zoneParts(tz, new Date(guess)).offset)
  }

  // --- sun and moon -------------------------------------------------------------------------------------------------
  /** Moon phase, 0..1 (0 = new). */
  export const moonPhase = (t: number) => ((((t - Date.UTC(2000, 0, 6, 18, 14)) / 864e5 / 29.530588853) % 1) + 1) % 1
  export interface Body { alt: number; az: number }
  export function sunMoon(t: number, lat: number, lon: number): { sun: Body; moon: Body; phase: number } {
    const year = new Date(t).getUTCFullYear()
    const day = (t - Date.UTC(year, 0, 0)) / 864e5
    const g = ((2 * Math.PI) / 365) * (day - 1)
    const declination =
      (0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 907e-6 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)) / RAD
    const hourAngle = ((t / 36e5) % 24 + lon / 15 + (229.18 * (75e-6 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))) / 60 - 12) * 15
    const phase = moonPhase(t)
    const moonDeclination = Math.asin(Math.sin(23.44 * RAD) * Math.sin(((360 / 365.2422) * (day - 80) + 360 * phase) * RAD)) / RAD
    const at = (h: number, d: number): Body => {
      const H = h * RAD
      const D = d * RAD
      const L = lat * RAD
      return {
        alt: Math.asin(Math.sin(L) * Math.sin(D) + Math.cos(L) * Math.cos(D) * Math.cos(H)) / RAD,
        az: Math.atan2(-Math.cos(D) * Math.sin(H), Math.sin(D) * Math.cos(L) - Math.cos(D) * Math.sin(L) * Math.cos(H)) / RAD,
      }
    }
    return { sun: at(hourAngle, declination), moon: at(hourAngle - 360 * phase, moonDeclination), phase }
  }
  /** Where a body sits in the 32 × 32 sky: along an arc, flipped in the southern hemisphere. */
  const place = (b: Body, south: boolean) => ({ x: 16 + 14 * Math.sin((b.az - (south ? 0 : 180)) * RAD), y: 25.5 - 19 * Math.sin(Math.max(b.alt, -40) * RAD) })

  // --- colour -----------------------------------------------------------------------------------------------------
  type Color = [number, number, number] // OKLCH: lightness, chroma, hue
  /** Sky colour stops by sun height (deg): zenith, middle and horizon. */
  const SKY: [number, Color, Color, Color][] = [
    [-90, [0.16, 0.05, 272], [0.2, 0.055, 275], [0.24, 0.06, 282]],
    [-18, [0.16, 0.05, 272], [0.2, 0.055, 275], [0.24, 0.06, 282]],
    [-12, [0.2, 0.06, 272], [0.26, 0.07, 280], [0.33, 0.08, 292]],
    [-6, [0.3, 0.08, 280], [0.42, 0.09, 318], [0.58, 0.12, 28]],
    [-2, [0.42, 0.1, 274], [0.6, 0.11, 350], [0.72, 0.15, 44]],
    [2, [0.5, 0.1, 266], [0.68, 0.1, 18], [0.8, 0.14, 60]],
    [8, [0.58, 0.12, 255], [0.74, 0.08, 236], [0.86, 0.08, 76]],
    [20, [0.62, 0.13, 248], [0.76, 0.09, 240], [0.89, 0.045, 225]],
    [90, [0.6, 0.14, 250], [0.75, 0.1, 242], [0.88, 0.045, 220]],
  ]
  /** Mix two colours (the hue the short way round). */
  const mix = (a: Color, b: Color, t: number): Color => {
    const turn = ((b[2] - a[2] + 540) % 360) - 180
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (a[2] + turn * t + 360) % 360]
  }
  export const oklch = (c: Color, alpha = 1) => `oklch(${c[0].toFixed(3)} ${c[1].toFixed(3)} ${c[2].toFixed(1)}${alpha < 1 ? ` / ${alpha.toFixed(3)}` : ''})`
  const scale = (c: Color, l: number, ch: number): Color => [c[0] * l, c[1] * ch, c[2]]
  export function skyColors(alt: number) {
    const i = Math.max(1, SKY.findIndex(([a]) => a > alt))
    const [a0, z0, m0, h0] = SKY[i - 1]!
    const [a1, z1, m1, h1] = SKY[i]!
    const t = clamp01((alt - a0) / (a1 - a0))
    return { zenith: mix(z0, z1, t), mid: mix(m0, m1, t), horizon: mix(h0, h1, t) }
  }
  const SUN_NOON: Color = [0.92, 0.13, 92]
  const SUN_LOW: Color = [0.76, 0.16, 48]
  const CLOUD_DAY: Color = [0.97, 0.01, 250]
  const CLOUD_DUSK: Color = [0.82, 0.09, 30]
  const CLOUD_NIGHT: Color = [0.36, 0.035, 275]
  const SNOW_DAY: Color = [0.95, 0.012, 250]
  const SNOW_DUSK: Color = [0.82, 0.09, 12]
  const SAIL_DAY: Color = [0.9, 0.012, 85]
  const SAIL_DUSK: Color = [0.84, 0.08, 55]
  const SAIL_NIGHT: Color = [0.93, 0.045, 85]
  const CLOUD_RAIN: Color = [0.55, 0.012, 260]
  /** Cloud cover greys a colour: a little darker, a lot less colourful. */
  const overcast = (c: Color, cover: number): Color => [c[0] * (1 - 0.14 * cover), c[1] * (1 - 0.7 * cover), c[2]]

  // --- weather ----------------------------------------------------------------------------------------------------
  export interface Weather { t0: number; code: number[]; cloud: number[]; rain: number[] }
  export interface Conditions { cover: number; rain: number; snow: number; storm: boolean; fog: number; label: string }
  /** Open-Meteo, hourly, for every city at once (the original example's request). */
  export const weatherUrl = (cities: City[]) =>
    `https://api.open-meteo.com/v1/forecast?latitude=${cities.map((c) => c.lat).join(',')}&longitude=${cities.map((c) => c.lon).join(',')}&hourly=weather_code,cloud_cover,precipitation&past_days=1&forecast_days=3&timeformat=unixtime&timezone=GMT`
  export function weatherAt(w: Weather | undefined, at: number): Conditions | undefined {
    if (!w) return
    const h = (at - w.t0) / 36e5
    const i = Math.floor(h)
    if (i < 0 || i >= w.code.length - 1) return
    const cover = (w.cloud[i]! + (w.cloud[i + 1]! - w.cloud[i]!) * (h - i)) / 100
    const code = w.code[Math.round(h)]!
    const rain = w.rain[Math.round(h)] ?? 0
    const snowy = (code >= 71 && code <= 77) || code === 85 || code === 86
    const wet = !snowy && code >= 51
    const drizzle = code >= 51 && code <= 57
    return {
      cover,
      rain: wet ? (drizzle ? 0.35 : Math.max(0.45, clamp01(rain / 3))) : 0,
      snow: snowy ? 0.8 : 0,
      storm: code >= 95,
      fog: code === 45 || code === 48 ? 1 : 0,
      label: code >= 95 ? 'thunderstorm' : snowy ? 'snow' : wet ? (drizzle ? 'drizzle' : 'rain') : code === 45 || code === 48 ? 'fog' : cover > 0.75 ? 'overcast' : cover > 0.3 ? 'cloudy' : 'clear',
    }
  }

  /** The moon's lit part, as a path in a 3.6 radius disc: `phase` 0..1. */
  export function moonPath(phase: number) {
    const waxing = phase < 0.5
    const r = Math.cos(2 * Math.PI * phase)
    return `M0 -3.6A3.6 3.6 0 0 ${+waxing} 0 3.6A${(3.6 * Math.abs(r)).toFixed(2)} 3.6 0 0 ${waxing ? (r > 0 ? 0 : 1) : +(r > 0)} 0 -3.6Z`
  }

  /** The strip under the ruler: the sky's middle colour across a day (73 stops), and the quarters of sunrise and sunset. */
  export function dayStrip(dayStart: number, city: City) {
    const alt = (h: number) => sunMoon(dayStart + 36e5 * h, city.lat, city.lon).sun.alt
    const stops = Array.from({ length: 73 }, (_, i) => `${oklch(skyColors(alt(i / 3)).mid)} ${((i / 72) * 100).toFixed(2)}%`)
    let sunrise = -1
    let sunset = -1
    for (let q = 1; q < 96; q++) {
      const a = alt((q - 1) / 4)
      const b = alt(q / 4)
      if (a < -0.83 && b >= -0.83) sunrise = q
      if (a >= -0.83 && b < -0.83) sunset = q
    }
    return { strip: `linear-gradient(90deg, ${stops.join(', ')})`, sunrise, sunset }
  }

  // --- skylines ---------------------------------------------------------------------------------------------------
  /** A box from x, with its top at y and width w, down to the ground. */
  const box = (x: number, top: number, w: number, ground = 25.5) => `M${x} ${ground}V${top}h${w}V${ground}Z`
  const EIFFEL =
    'M15.2 25.5C16 24.2 16.6 23.4 17 22.8H17.9C17.4 23.6 16.9 24.4 16.5 25.5ZM22.8 25.5C22 24.2 21.4 23.4 21 22.8H20.1C20.6 23.6 21.1 24.4 21.5 25.5ZM17.4 22.8h3.2c-.5.55-1 .8-1.6.8s-1.1-.25-1.6-.8ZM16.4 22.2h5.2v.6h-5.2ZM16.9 22.2C17.3 21 17.7 19.9 18 18.9H18.6C18.4 19.9 18.1 21 17.9 22.2ZM21.1 22.2C20.7 21 20.3 19.9 20 18.9H19.4C19.6 19.9 19.9 21 20.1 22.2ZM17.7 18.4h2.6v.5h-2.6ZM18 18.4C18.3 16.6 18.6 14.8 18.8 13.2H19C19 14.6 18.9 16.6 18.8 18.4ZM20 18.4C19.7 16.6 19.4 14.8 19.2 13.2H19C19 14.6 19.1 16.6 19.2 18.4ZM18.6 12.9h.8v.4h-.8ZM18.75 12.95 18.85 8.4h.3L19.25 12.95Z'
  export const EIFFEL_PATH = EIFFEL
  const GROUND = 'M0 25.5h32V32H0Z'

  export interface Skyline {
    water?: boolean
    far: string
    near: string
    beacons: [number, number][]
    /** [x, y, threshold]: a window lights once the night is darker than the threshold. */
    windows: [number, number, number][]
  }
  export const SKYLINES: Record<string, Skyline> = {
    madrid: {
      far: 'M0 22.6l3.2-1.4 2.6.8 3.4-2.6 2.4 1.5 2.2-1 3.6 2.4 3-1.9 3.4 1.6 2.6-.9 3.6 1.5V32H0Z',
      near: [GROUND, box(0.6, 23.6, 2.4), box(3, 24.2, 1.6), box(15.2, 23.8, 1.2), box(29, 23.6, 2.6), 'M4.7 25.5H7.3L9.7 16.6H7.1Z', 'M15.3 25.5H12.7L10.3 16.6H12.9Z', box(16.3, 12.4, 2.6), box(16.3, 9.6, 0.65), box(18.25, 9.6, 0.65), 'M16.3 9.6h2.6v.4h-2.6Z', 'M19.5 25.5V9.6q1.25-1.6 2.5 0V25.5Z', 'M22.6 25.5V8.6l2.5-1.2V25.5Z', box(25.7, 9.1, 2.5)].join(''),
      beacons: [[17.6, 9.35], [20.75, 8.45], [23.85, 7.5], [26.95, 8.9]],
      windows: [[17.6, 14.5, 0.3], [17.6, 19, 0.5], [20.75, 12.4, 0.2], [20.75, 17, 0.6], [23.85, 11.2, 0.35], [23.85, 16, 0.15], [26.95, 13, 0.45], [26.95, 19.4, 0.25], [6.2, 22.4, 0.4], [13.8, 22.2, 0.55], [1.8, 24.4, 0.3], [30.2, 24.3, 0.6]],
    },
    newyork: {
      far: [box(0, 22.6, 2.6), box(2.6, 21.4, 1.8), box(4.4, 22.8, 2.2), box(10.6, 21.8, 2), box(19, 22.2, 2.4), box(21.4, 21, 1.6), box(28.4, 22.4, 1.8), box(30.2, 21.6, 1.8)].join(''),
      near: [GROUND, box(2, 20.6, 2.4), box(4.2, 22.4, 1.8), box(8.4, 18.8, 2), box(10.6, 21.2, 2.4), box(19.4, 17.8, 2), box(21.6, 20.4, 1.8), box(28, 19.4, 2), box(30, 21.6, 2), box(6, 13.4, 2), 'M6 13.4 7 10.4 8 13.4Z', 'M6.93 10.6 7 7.6 7.07 10.6Z', box(13.4, 20.4, 5.2), box(14.2, 15, 3.6), box(15, 11.6, 2), box(15.55, 9.6, 0.9), 'M15.92 9.7 16 5.6 16.08 9.7Z', 'M24 25.5 24.6 10.6H27L27.6 25.5Z', 'M25.75 10.7 25.8 6.2 25.85 10.7Z'].join(''),
      beacons: [[25.8, 6.3], [16, 5.7]],
      windows: [[3, 22, 0.3], [9.2, 20.5, 0.5], [11.5, 23, 0.2], [14.6, 22.5, 0.6], [17.4, 22, 0.4], [16, 17, 0.25], [20.2, 19.5, 0.55], [25.2, 14, 0.35], [26.2, 19, 0.15], [25.4, 23, 0.6], [29, 21, 0.45], [7, 16.4, 0.3]],
    },
    london: {
      far: ['M5.6 22.6a2 2 0 0 1 4 0Z', 'M7.5 20.6h.2v-1h-.2Z', box(0, 23, 3), box(3, 22.6, 2.6), box(9.6, 22.8, 3), box(13, 23.2, 2), box(22, 22.4, 2.6), box(29, 22.8, 3)].join(''),
      near: [GROUND, box(1.4, 22.4, 2.2), box(12.4, 22, 1.8), box(22, 21.6, 2), box(28.6, 22.6, 2.6), box(5, 14.6, 2), box(4.75, 12.6, 2.5), box(5.05, 11.2, 1.9), 'M5 11.2 6 8.4 7 11.2Z', 'M5.94 8.6 6 7 6.06 8.6Z', box(7, 21.6, 5), box(9, 20.6, 0.5), box(11.2, 20.9, 0.5), 'M18 17.3 15.6 25.5h.6L18 18.1ZM18 17.3l2.4 8.2h-.6L18 18.1Z', 'M25 25.5 26.55 8.4 26.75 8 26.9 8.6 28.4 25.5Z'].join(''),
      beacons: [[26.7, 8.2]],
      windows: [[2.4, 23.6, 0.3], [8, 23, 0.5], [10.4, 23.4, 0.2], [13.2, 23.5, 0.6], [22.8, 23, 0.4], [29.8, 24, 0.25], [26.6, 15, 0.35], [26.6, 20, 0.55], [6, 18, 0.45]],
    },
    tokyo: {
      far: 'M0 25.5V24.6C2.6 23.6 6.2 20.6 9.1 16.9 9.5 16.4 10.5 16.4 10.9 16.9 13.8 20.6 17.4 23.6 20 24.6V25.5Z',
      near: [GROUND, box(0.6, 21.6, 2.4), box(6.4, 20.6, 2.2), box(8.8, 22.4, 2.6), box(11.6, 19.8, 2.4), box(14.2, 21.4, 2), box(16.4, 20.2, 2.4), box(27, 21, 2.2), box(29.2, 22.4, 2.4), 'M4.15 25.5 4.4 13.4H4.8L5.05 25.5Z', 'M3.95 13.6h1.3v-1.1H3.95Z', 'M4.15 10.9h.9v-.8h-.9Z', 'M4.55 10.2 4.6 3.6 4.65 10.2Z', 'M20.2 25.5C21.6 22 22.4 18.5 22.7 14.2H23.7C24 18.5 24.8 22 26.2 25.5H25.1C24.2 23.2 23.6 21.4 23.2 19.6 22.8 21.4 22.2 23.2 21.3 25.5Z', 'M22.1 17.4h2.2v1h-2.2Z', 'M22.55 13.6h1.3v.7h-1.3Z', 'M23.12 13.7 23.2 6.8 23.28 13.7Z'].join(''),
      beacons: [[4.6, 3.8], [23.2, 7]],
      windows: [[7.4, 22, 0.3], [9.6, 23.5, 0.5], [12.6, 21.5, 0.2], [15, 23, 0.6], [17.4, 22, 0.4], [28, 22.6, 0.25], [30, 23.8, 0.55], [1.6, 23, 0.45]],
    },
    sydney: {
      water: true,
      far: 'M0 24.4c4-1.2 8-1.6 12-1 5 .8 9 .4 14-.8 2.4-.6 4.4-.6 6 0V26H0Z',
      near: 'M3.4 25.8V24.7H15.6V25.8ZM16.4 22.6H31.6V23.1H16.4ZM16.2 25.8V20.6h1.3v5.2ZM30.1 25.8V20.6h1.3v5.2Z',
      beacons: [[24, 19.3]],
      windows: [[5, 25.2, 0.3], [9, 25.2, 0.5], [13, 25.2, 0.2]],
    },
    paris: {
      far: 'M0 23.4c3-1.6 6-2.2 9-1.4 3 .8 5 .4 8-.6V25.5H0ZM4.4 21.7a1 1 0 0 1 2 0ZM5.3 20.9h.2v-.7h-.2ZM3.9 21.9a.55.55 0 0 1 1.1 0ZM5.9 21.9a.55.55 0 0 1 1.1 0Z',
      near: [GROUND, box(0.4, 22.2, 3), box(3.4, 22.7, 2.4), box(9, 21.9, 2.6), box(11.6, 22.5, 2.2), box(24, 22, 2.4), box(26.8, 15.6, 2.4), box(29.4, 22.6, 2.6), 'M3 22.2l.4-.6h2.2l.4.6ZM9 21.9l.4-.6h1.8l.4.6Z', EIFFEL, 'M18.96 8.5 19 6.6 19.04 8.5Z'].join(''),
      beacons: [[27.95, 15.4]],
      windows: [[1.6, 23.6, 0.3], [4.4, 24, 0.5], [10, 23.4, 0.2], [12.6, 23.8, 0.6], [25, 23.4, 0.4], [27.9, 18, 0.25], [27.9, 21.4, 0.55], [30.6, 24, 0.35]],
    },
    dubai: {
      far: 'M0 24.2c4-1.4 7-1.6 11-.6 4 1 7 .8 11-.4 4-1.2 7-1 10 0V25.5H0Z',
      near: [GROUND, box(0.8, 19.6, 1.8), box(3, 21.4, 1.6), box(5.2, 18.2, 1.6), 'M5.2 18.2l.8-1.4.8 1.4Z', box(7.2, 18.8, 1.4), 'M7.2 18.8l.7-1.2.7 1.2Z', box(9.4, 20.2, 2), box(11.6, 21.8, 1.8), box(21, 20.6, 1.8), box(29.4, 21.6, 2.4), 'M14.6 25.5V20.5h.9V16h.8v-4.5h.6V8h.2V2.6h.1V8h.2v3.5h.6V16h.8v4.5h.9v5Z', 'M24.6 25.5C25 21 26 17.4 27.8 14.8V25.5Z', 'M27.6 14.8 27.7 13 27.8 14.8Z'].join(''),
      beacons: [[17.15, 2.8], [6, 16.9]],
      windows: [[1.7, 21, 0.3], [3.8, 23, 0.5], [6, 20.5, 0.2], [7.9, 21.5, 0.45], [10.4, 22, 0.6], [12.4, 23.2, 0.35], [21.9, 22.4, 0.25], [30.4, 23.2, 0.55]],
    },
    rio: {
      water: true,
      far: 'M0 22.4c2-1 4-3.4 6-3.6 2.4-.2 3.4 2.2 6 2.8 3 .7 6-.6 9-.2 4 .5 7 1.4 11 .8V25.8H0Z',
      near: 'M0 25.8V20.6C1.4 19.6 2.6 17.2 3.6 14.4c.3-.9.9-.9 1.2 0 1.4 4.2 3.6 7.6 6.4 11.4ZM3.55 14.3V13.4h1.3v.9ZM1.75 9.75 3.75 9.35 3.95 9.05h.5L4.65 9.35 6.65 9.75V10.05L5.6 10 5 10.9 4.75 12.2 4.95 13.4H3.45L3.65 12.2 3.4 10.9 2.8 10 1.75 10.05ZM14.4 25.8c1-2.6 2.4-4.2 3.6-4.3 1.4 0 2.3 1.6 2.9 4.3ZM19.6 25.8C20.6 21 22.6 16.6 25 16.2c2 .2 3.4 3.6 4.6 9.6Z',
      beacons: [[25, 16.1]],
      windows: [[7, 24, 0.3], [9.2, 25, 0.5], [12.6, 25.2, 0.2], [16.8, 24.4, 0.45], [28.4, 25, 0.6]],
    },
  }

  /** Rain streaks, snowflakes and stars: positions and timing. */
  export const RAIN = Array.from({ length: 14 }, (_, i): [number, number] => [((7.3 * i) % 30) + 1, -((0.37 * i) % 0.7)])
  export const SNOW = Array.from({ length: 11 }, (_, i): [number, number, number] => [((5.9 * i) % 29) + 1.5, -((0.83 * i) % 5), i % 2 ? 1 : -1])
  export const STARS: [number, number, number, number][] = [[7, 8, 0.55, 4.2], [12.5, 4.5, 0.4, 5.6], [21, 6, 0.6, 3.6], [26, 11, 0.4, 6.4], [9.5, 14.5, 0.35, 5], [18, 12.5, 0.45, 4.8], [24.5, 17, 0.35, 7], [4, 13, 0.3, 6]]

  // --- painting ---------------------------------------------------------------------------------------------------
  const queries = new WeakMap<Element, Map<string, Element[]>>()

  /** One city's sky at instant `at` (ms): written to the SVG's gradients, shapes and lights. */
  export function paintSky(el: SVGElement, at: number, wx: Weather | undefined) {
    let cache = queries.get(el)
    if (!cache) queries.set(el, (cache = new Map()))
    const all = (sel: string) => {
      let list = cache!.get(sel)
      if (!list) cache!.set(sel, (list = [...el.querySelectorAll(sel)]))
      return list as SVGElement[]
    }
    const one = (sel: string) => all(sel)[0]!
    const lat = Number(el.dataset.lat)
    const lon = Number(el.dataset.lon)
    const south = lat < 0
    const hour = (((at / 36e5 + Number(el.dataset.utc) / 60) % 24) + 24) % 24
    const astro = sunMoon(at, lat, lon)
    const alt = astro.sun.alt
    const weather = weatherAt(wx, at)
    const cover = weather?.cover ?? 0
    const base = skyColors(alt)
    const sky = { zenith: overcast(base.zenith, cover), mid: overcast(base.mid, cover), horizon: overcast(base.horizon, cover) }
    one('.tz-z').style.stopColor = oklch(sky.zenith)
    one('.tz-m').style.stopColor = oklch(sky.mid)
    one('.tz-h').style.stopColor = oklch(sky.horizon)
    const sun = place(astro.sun, south)
    const moon = place(astro.moon, south)
    const night = clamp01((-2 - alt) / 10)
    const warm = clamp01(1 - alt / 12) * clamp01((alt + 4) / 3)
    const glowing = clamp01(1 - Math.abs(alt - 1) / 9)
    const deep = clamp01((-6 - alt) / 8)
    one('.tz-sun-at').setAttribute('transform', `translate(${sun.x.toFixed(2)} ${sun.y.toFixed(2)}) scale(${(1 + 0.24 * warm).toFixed(3)})`)
    one('.tz-sun').style.fill = oklch(mix(SUN_NOON, SUN_LOW, warm))
    one('.tz-sun-at').style.opacity = (1 - 0.8 * cover).toFixed(3)
    one('.tz-moon-at').setAttribute('transform', `translate(${moon.x.toFixed(2)} ${moon.y.toFixed(2)})`)
    one('.tz-moon-at').style.opacity = ((0.45 + 0.55 * clamp01((-alt + 2) / 8)) * (1 - 0.75 * cover)).toFixed(3)
    one('.tz-earthshine').style.opacity = (0.16 * deep).toFixed(3)
    const glow = one('.tz-glow')
    glow.setAttribute('cx', sun.x.toFixed(2))
    glow.setAttribute('cy', Math.max(sun.y, 21).toFixed(2))
    glow.style.opacity = (0.85 * glowing * (1 - 0.8 * cover)).toFixed(3)
    one('.tz-stars').style.opacity = (deep * (1 - 0.95 * cover)).toFixed(3)
    one('.tz-pole').setAttribute('transform', `rotate(${((15 * hour) % 360).toFixed(2)} 16 ${south ? 44 : -12}) `)
    one('.tz-day').style.opacity = clamp01(1 - 1.4 * night).toFixed(3)
    const precipitation = Math.max(weather?.rain ?? 0, weather?.snow ?? 0)
    const cloudColor = mix(mix(mix(CLOUD_DAY, CLOUD_DUSK, +(alt > -6) * glowing * (1 - cover)), CLOUD_RAIN, precipitation), CLOUD_NIGHT, night)
    const cloudiness = weather ? cover : 0.28
    all('.tz-cloud').forEach((c, i) => {
      c.style.fill = oklch(cloudColor, (0.82 - 0.3 * night) * clamp01((cloudiness - 0.2 * i + 0.12) / 0.2))
    })
    one('.tz-rain').style.opacity = (weather?.rain ?? 0).toFixed(3)
    one('.tz-snowfall').style.opacity = (weather?.snow ?? 0).toFixed(3)
    one('.tz-storm').style.display = weather?.storm ? '' : 'none'
    one('.tz-fog').style.opacity = ((weather?.fog ?? 0) * 0.85).toFixed(3)
    const horizon = sky.horizon
    const ink = oklch(scale(horizon, 0.4, 0.45))
    one('.tz-far').style.fill = oklch(scale(horizon, 0.66, 0.55))
    one('.tz-near').style.fill = ink
    for (const t of all('.tz-ink')) t.style.stroke = ink
    for (const t of all('.tz-inkfill')) t.style.fill = ink
    const kong = oklch(scale(horizon, 0.24, 0.35))
    all('.tz-kongfill')[0]?.style.setProperty('fill', kong)
    all('.tz-kongarm')[0]?.style.setProperty('stroke', kong)
    const rim = one('.tz-rim-g')
    rim.setAttribute('x1', (sun.x - 11).toFixed(2))
    rim.setAttribute('x2', (sun.x + 11).toFixed(2))
    one('.tz-rim').style.opacity = (glowing * clamp01((alt + 1.5) / 3) * 0.9 * (1 - cover)).toFixed(3)
    one('.tz-lights').style.opacity = night.toFixed(3)
    for (const t of all('.tz-dayonly')) t.style.opacity = clamp01(1 - 1.4 * night).toFixed(3)
    all('.tz-eye-turn')[0]?.setAttribute('transform', `rotate(${((60 * hour) % 360).toFixed(2)} 18 17.3)`)
    const whale = all('.tz-ink-whale')[0]
    if (whale) whale.style.fill = oklch(scale(sky.mid, 0.3, 0.5))
    const snow = all('.tz-snow')[0]
    if (snow) snow.style.fill = oklch(scale(mix(SNOW_DAY, SNOW_DUSK, +(alt > -4) * glowing), 1 - 0.58 * night, 1 - 0.4 * night))
    const sails = all('.tz-sails')[0]
    if (sails) sails.style.fill = oklch(mix(mix(SAIL_DAY, SAIL_DUSK, glowing), SAIL_NIGHT, night))
    const waterTop = all('.tz-wa')[0]
    const waterBottom = all('.tz-wb')[0]
    const glint = all('.tz-glint')[0]
    if (waterTop && waterBottom && glint) {
      waterTop.style.stopColor = oklch(scale(sky.horizon, 0.72, 0.8))
      waterBottom.style.stopColor = oklch(scale(sky.mid, 0.45, 0.7))
      glint.setAttribute('cx', sun.x.toFixed(2))
      glint.style.opacity = (clamp01((alt + 1) / 4) * (0.3 + 0.6 * glowing)).toFixed(3)
      glint.style.fill = oklch(mix(SUN_NOON, SUN_LOW, warm))
    }
    const sparkle = all('.tz-sparkle')[0]
    if (sparkle) sparkle.style.display = night > 0.6 && (hour % 1) * 60 < 5 ? '' : 'none'
    // Windows light up with the dark, a few going out in the small hours.
    const lateNight = hour >= 1 && hour < 5.5
    all('.tz-windows rect').forEach((w, i) => w.toggleAttribute('data-on', night > Number(w.dataset.at) && !(lateNight && i % 3)))
  }

  /** The home sky's middle colour at `at`: a breath of it tints the card. */
  export const homeTint = (at: number) => oklch(skyColors(sunMoon(at, HOME.lat, HOME.lon).sun.alt).mid)
</script>
