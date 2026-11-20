// Build-time geometry for the clients map: the land dot grid and where each client country sits on it.
// Nothing here ships to the browser; the component inlines the resulting SVG path data, and the review loop
// (src/lib/review-loop.ts) anchors its bubbles at the country points.
import { LAND_MASK } from '@/lib/land-mask';

export interface MapPlace {
  iso: string;
  latitude: number;
  longitude: number;
}

export interface WorldMap {
  viewBox: string;
  width: number;
  height: number;
  /** Dot size and pitch in viewBox units (the dasharray technique needs both). */
  pitch: number;
  /** One path: a subpath per land run; `stroke-dasharray="0 {pitch}"` plus round caps turns it into dots. */
  land: string;
  /** Each place projected into the viewBox (not drawn: the map shows land only). */
  points: { iso: string; x: number; y: number }[];
}

const round = (n: number) => Math.round(n * 10) / 10;

/** Equirectangular projection onto a `width`-unit wide canvas (one grid cell = `LAND_MASK.pitch` degrees). */
export function buildWorldMap({
  places = [],
  width = 720,
  top = 6,
}: {
  places?: MapPlace[];
  width?: number;
  top?: number;
} = {}): WorldMap {
  const { pitch: deg, latMax, rows } = LAND_MASK;
  const k = width / 360; // viewBox units per degree
  const cell = deg * k;

  // Runs start on a cell centre; the zero-length dashes then fall on every centre along the run.
  const land = rows
    .flatMap((runs, r) =>
      runs.map(
        ([start, len]) =>
          `M${round((start + 0.5) * cell)} ${round((r + 0.5) * cell + top)}h${round((len - 1) * cell + 0.01)}`,
      ),
    )
    .join('');

  const points = places.map((p) => ({
    iso: p.iso,
    x: round((p.longitude + 180) * k),
    y: round((latMax - p.latitude) * k + top),
  }));

  const height = round(rows.length * cell + top + 4);
  return {
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    pitch: round(cell),
    land,
    points,
  };
}
