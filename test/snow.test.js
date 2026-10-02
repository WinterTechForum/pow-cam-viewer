import test from 'node:test';
import assert from 'node:assert/strict';
import { past24HourSnowfallInches } from '../public/snow.js';

test('converts the most recent 24 hourly snowfall values from cm to inches', () => {
  const hourly = { snowfall: [99, ...Array(24).fill(2.54)] };
  assert.ok(Math.abs(past24HourSnowfallInches(hourly) - 24) < 1e-9);
});

test('returns null when an hourly value is unavailable', () => {
  assert.equal(past24HourSnowfallInches({ snowfall: [...Array(23).fill(0), null] }), null);
  assert.equal(past24HourSnowfallInches({ snowfall: Array(23).fill(0) }), null);
});
