import {
  RotateCcw, Droplet, Scissors, Link2, Sprout, Bug, Leaf, CalendarDays,
} from "lucide-react";

/* ---------- theme tokens ---------- */
/* spanDays = default window length when a task is given without an end date */
export const CATS = {
  repot:     { label: "Repot",      color: "#C97A3D", icon: RotateCcw,    spanDays: 21 },
  feed:      { label: "Feed",       color: "#8FA876", icon: Droplet,      spanDays: 90 },
  prune:     { label: "Prune",      color: "#D9A441", icon: Scissors,     spanDays: 30 },
  wire:      { label: "Wire",       color: "#C1552E", icon: Link2,        spanDays: 60 },
  propagate: { label: "Propagate",  color: "#5B8C7B", icon: Sprout,       spanDays: 30 },
  seed:      { label: "Seed",       color: "#B08968", icon: Leaf,         spanDays: 21 },
  pest:      { label: "Pest watch", color: "#B4483A", icon: Bug,          spanDays: 90 },
  other:     { label: "General",    color: "#8A9086", icon: CalendarDays, spanDays: 14 },
};

export function defaultSpanDays(category) {
  return (CATS[category] || CATS.other).spanDays;
}

export function catOf(t) {
  return CATS[t.category] ? t.category : "other";
}
