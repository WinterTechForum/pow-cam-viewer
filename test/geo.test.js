import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { distanceMiles, sortByDistance } from '../public/geo.js';

const denver = { latitude: 39.7392, longitude: -104.9903 };

test('distance is zero for the same point', () => {
  assert.equal(distanceMiles(denver, denver), 0);
});

test('distance uses miles and is symmetric', () => {
  const boulder = { latitude: 40.015, longitude: -105.2705 };
  const distance = distanceMiles(denver, boulder);
  assert.ok(distance > 20 && distance < 30);
  assert.ok(Math.abs(distance - distanceMiles(boulder, denver)) < 1e-9);
});

test('resorts are sorted nearest first without changing the source array', () => {
  const resorts = [
    { name: 'Far', latitude: 40.4572, longitude: -106.8045 },
    { name: 'Near', latitude: 39.9372, longitude: -105.5825 }
  ];
  const sorted = sortByDistance(resorts, denver);
  assert.deepEqual(sorted.map((resort) => resort.name), ['Near', 'Far']);
  assert.equal(resorts[0].name, 'Far');
  assert.ok(sorted[0].distanceMiles < sorted[1].distanceMiles);
});


test('resort catalog includes Monarch Mountain and its official webcam page', async () => {
  const catalogUrl = new URL('../public/resorts.json', import.meta.url);
  const resorts = JSON.parse(await readFile(catalogUrl, 'utf8'));
  const monarch = resorts.find((resort) => resort.id === 'monarch');
  assert.ok(monarch);
  assert.equal(monarch.name, 'Monarch Mountain');
  assert.equal(monarch.webcamsUrl, 'https://skimonarch.com/conditions/cams/');
  assert.ok(distanceMiles(denver, monarch) > 100);
});
