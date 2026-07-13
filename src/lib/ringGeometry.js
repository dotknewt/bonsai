export function arcPath(cx, cy, r, startAngle, sweep) {
  const rad = (a) => (a * Math.PI) / 180;
  const p1 = { x: cx + r * Math.cos(rad(startAngle)), y: cy + r * Math.sin(rad(startAngle)) };
  const p2 = { x: cx + r * Math.cos(rad(startAngle + sweep)), y: cy + r * Math.sin(rad(startAngle + sweep)) };
  const large = sweep > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y}`;
}

/* Pack task arcs into "lanes" (concentric radii) so overlapping windows don't
   draw on top of each other. Mutates each item's .lane and returns the number
   of lanes used. Intervals are in degrees and may wrap 360. */
export function packLanes(items, padding = 6) {
  const segs = (iv) => {
    const s = ((iv.start % 360) + 360) % 360;
    const e = s + (iv.end - iv.start);
    return e <= 360 ? [[s, e]] : [[s, 360], [0, e - 360]];
  };
  const overlaps = (a, b) => segs(a).some(([s1, e1]) => segs(b).some(([s2, e2]) => s1 < e2 && s2 < e1));
  const lanes = [];
  [...items].sort((a, b) => a.startAngle - b.startAngle).forEach((item) => {
    const iv = { start: item.startAngle, end: item.startAngle + item.sweep + padding };
    let lane = lanes.findIndex((l) => l.every((o) => !overlaps(iv, o)));
    if (lane === -1) { lanes.push([]); lane = lanes.length - 1; }
    lanes[lane].push(iv);
    item.lane = lane;
  });
  return lanes.length;
}
