// Build-time geometry for the clients map: land dot grid, Tunis-to-client arcs and marker positions.
// Nothing here ships to the browser; the component inlines the resulting SVG path data.
import { LAND_MASK } from '@/lib/land-mask';

export interface MapPlace {
  iso: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface WorldMap {
  viewBox: string;
  /** Dot size and pitch in viewBox units (the dasharray technique needs both). */
  pitch: number;
  /** One path: a subpath per land run; `stroke-dasharray="0 {pitch}"` plus round caps turns it into dots. */
  land: string;
  arcs: { iso: string; d: string }[];
  markers: { iso: string; name: string; x: number; y: number }[];
  home: { x: number; y: number };
}

const round = (n: number) => Math.round(n * 10) / 10;

/**
 * Equirectangular projection onto a `width`-unit wide canvas (one grid cell = `LAND_MASK.pitch` degrees).
 * The client country that is also the home country (D5) gets no marker or arc: the home marker stands for it.
 */
export function buildWorldMap({
  home,
  clients,
  width = 720,
  top = 6,
}: {
  home: { latitude: number; longitude: number; countryCode: string };
  clients: MapPlace[];
  width?: number;
  top?: number;
}): WorldMap {
  const { pitch: deg, latMax, rows } = LAND_MASK;
  const k = width / 360; // viewBox units per degree
  const cell = deg * k;
  const x = (lon: number) => (lon + 180) * k;
  const y = (lat: number) => (latMax - lat) * k + top;

  // Runs start on a cell centre; the zero-length dashes then fall on every centre along the run.
  const land = rows
    .flatMap((runs, r) =>
      runs.map(
        ([start, len]) =>
          `M${round((start + 0.5) * cell)} ${round((r + 0.5) * cell + top)}h${round((len - 1) * cell + 0.01)}`,
      ),
    )
    .join('');

  const h = { x: round(x(home.longitude)), y: round(y(home.latitude)) };
  const away = clients.filter((c) => c.iso !== home.countryCode);
  const markers = away.map((c) => ({
    iso: c.iso,
    name: c.name,
    x: round(x(c.longitude)),
    y: round(y(c.latitude)),
  }));
  // Quadratic arcs, control point lifted north of the chord midpoint so they read as flight paths.
  // The lift varies per arc so neighbouring destinations (e.g. India and Singapore) do not overlap.
  const lifts = [0.3, 0.17, 0.42];
  const arcs = markers.map((m, i) => {
    const dist = Math.hypot(m.x - h.x, m.y - h.y);
    const cx = (m.x + h.x) / 2;
    const cy = (m.y + h.y) / 2 - dist * lifts[i % lifts.length];
    return {
      iso: m.iso,
      d: `M${h.x} ${h.y}Q${round(cx)} ${round(cy)} ${m.x} ${m.y}`,
    };
  });

  const height = round(rows.length * cell + top + 4);
  return {
    viewBox: `0 0 ${width} ${height}`,
    pitch: round(cell),
    land,
    arcs,
    markers,
    home: h,
  };
}
