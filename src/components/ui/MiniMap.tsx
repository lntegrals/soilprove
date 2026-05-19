"use client";

// Lightweight static map without external dependencies.
// Renders an OSM tile via tile.openstreetmap.org/{z}/{x}/{y}.png cropped around a coordinate.
// (No JS map library to keep bundle small. Pure <img> tiles.)

function lonLatToTile(lon: number, lat: number, z: number) {
  const x = Math.floor(((lon + 180) / 360) * Math.pow(2, z));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, z)
  );
  return { x, y };
}

export function MiniMap({
  lat,
  lon,
  zoom = 12,
  size = 3,
  className = "",
}: {
  lat: number;
  lon: number;
  zoom?: number;
  size?: number; // tile grid (3 => 3x3)
  className?: string;
}) {
  const { x, y } = lonLatToTile(lon, lat, zoom);
  const half = Math.floor(size / 2);
  const tiles: Array<{ tx: number; ty: number; dx: number; dy: number }> = [];
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      tiles.push({ tx: x + dx, ty: y + dy, dx, dy });
    }
  }
  const tilePx = 256;
  const widthPx = size * tilePx;
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-ink-100 bg-ink-50 ${className}`}
    >
      <div
        className="relative"
        style={{
          width: widthPx,
          height: widthPx,
          maxWidth: "100%",
          aspectRatio: "1 / 1",
        }}
      >
        <div className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            gridTemplateRows: `repeat(${size}, 1fr)`,
          }}
        >
          {tiles
            .sort((a, b) => (a.dy === b.dy ? a.dx - b.dx : a.dy - b.dy))
            .map((t, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={`https://tile.openstreetmap.org/${zoom}/${t.tx}/${t.ty}.png`}
                alt=""
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover opacity-95"
              />
            ))}
        </div>
        {/* desaturate / overlay */}
        <div className="pointer-events-none absolute inset-0 bg-loam-50/30 mix-blend-multiply" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-canvas/30" />
        {/* center marker */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <span className="absolute -inset-3 animate-ping rounded-full bg-moss-500/30" />
            <span className="block h-3 w-3 rounded-full bg-moss-600 ring-4 ring-paper/95" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-1 right-2 text-[10px] text-ink-500/70">
        © OpenStreetMap
      </div>
    </div>
  );
}
