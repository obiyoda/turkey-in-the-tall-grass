export const ARENA = Object.freeze({ left: 32, right: 928, top: 100, bottom: 520 });

export function movementVector(horizontal, vertical) {
  const length = Math.hypot(horizontal, vertical);
  return length > 0 ? { x: horizontal / length, y: vertical / length } : { x: 0, y: 0 };
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function roundResult(score, lives, seconds, goal) {
  if (lives <= 0) return 'lost';
  if (score >= goal) return 'won';
  if (seconds <= 0) return 'lost';
  return 'playing';
}

export function overlaps(a, b, distance) {
  return Math.hypot(a.x - b.x, a.y - b.y) < distance;
}

export function safePosition(random, avoid, minDistance = 85) {
  const candidates = Array.from({ length: 24 }, () => ({
    x: ARENA.left + 28 + random() * (ARENA.right - ARENA.left - 56),
    y: ARENA.top + 28 + random() * (ARENA.bottom - ARENA.top - 56)
  }));
  return candidates.find(p => Math.hypot(p.x - avoid.x, p.y - avoid.y) >= minDistance)
    ?? candidates.reduce((best, p) => Math.hypot(p.x - avoid.x, p.y - avoid.y) > Math.hypot(best.x - avoid.x, best.y - avoid.y) ? p : best);
}
