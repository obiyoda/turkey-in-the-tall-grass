import test from 'node:test';
import assert from 'node:assert/strict';
import { ARENA, clamp, movementVector, overlaps, roundResult, safePosition } from '../src/rules.js';
import { SETTINGS } from '../src/settings.js';

test('diagonal and horizontal movement have the same speed', () => {
  assert.equal(Math.hypot(...Object.values(movementVector(1, 0))), 1);
  assert.ok(Math.abs(Math.hypot(...Object.values(movementVector(1, 1))) - 1) < 0.000001);
  assert.deepEqual(movementVector(0, 0), { x: 0, y: 0 });
});
test('player remains inside the arena', () => {
  assert.equal(clamp(-20, 32, 928), 32);
  assert.equal(clamp(1000, 32, 928), 928);
  assert.equal(clamp(480, 32, 928), 480);
});
test('round has win, time-out, lost-lives and continued-play outcomes', () => {
  assert.equal(roundResult(12, 3, 12, 12), 'won');
  assert.equal(roundResult(5, 3, 0, 12), 'lost');
  assert.equal(roundResult(5, 0, 20, 12), 'lost');
  assert.equal(roundResult(5, 3, 20, 12), 'playing');
  assert.equal(roundResult(12, 0, 0, 12), 'lost');
});
test('collision uses distance rather than bounding rectangles', () => {
  assert.equal(overlaps({x:0,y:0},{x:3,y:4},6), true);
  assert.equal(overlaps({x:0,y:0},{x:3,y:4},4), false);
});
test('spawn positions stay inside the arena and away from the player', () => {
  let seed = 123;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 100; i++) {
    const p = safePosition(random, {x:480,y:310});
    assert.ok(p.x > ARENA.left && p.x < ARENA.right);
    assert.ok(p.y > ARENA.top && p.y < ARENA.bottom);
    assert.ok(Math.hypot(p.x-480,p.y-310) >= 85);
  }
});
test('spawn terminates even with a degenerate random source', () => {
  const p = safePosition(() => .5, {x:480,y:310}, 1000);
  assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
});
test('starter settings are playable', () => {
  assert.ok(SETTINGS.roundSeconds > 0);
  assert.ok(SETTINGS.targetScore > 0);
  assert.ok(SETTINGS.startingLives > 0);
  assert.ok(SETTINGS.playerSpeed > SETTINGS.droneSpeed);
  assert.ok(SETTINGS.sparkCount >= 1);
});
