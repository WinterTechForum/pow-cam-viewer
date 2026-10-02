import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const resorts = JSON.parse(await readFile(new URL('../public/resorts.json', import.meta.url), 'utf8'));

test('each resort has an official cam page and camera embeds have provider metadata', () => {
  assert.equal(resorts.length, 11);
  for (const resort of resorts) {
    assert.match(resort.webcamsUrl, /^https:\/\//);
    assert.ok(Array.isArray(resort.cameras));
    for (const camera of resort.cameras) {
      assert.ok(camera.name);
      assert.ok(camera.provider);
      if (camera.type === 'iframe' || camera.type === 'image') assert.match(camera.url, /^https:\/\//);
      else if (camera.type === 'hdrelay') assert.ok(camera.providerId);
      else assert.fail(`Unsupported camera type: ${camera.type}`);
    }
  }
});

test('official embeds are available for the four resorts with verified player sources', () => {
  const embeddedResorts = resorts.filter((resort) => resort.cameras.some((camera) => camera.type !== 'image')).map((resort) => resort.id).sort();
  assert.deepEqual(embeddedResorts, ['arapahoe-basin', 'loveland', 'monarch', 'winter-park']);
});


test('every resort has a Snow-Forecast hosted weather widget', () => {
  assert.equal(resorts.length, 11);
  for (const resort of resorts) {
    assert.match(resort.snowForecastUrl, /^https:\/\/www\.snow-forecast\.com\/resorts\/[\w-]+\/forecasts\/widget\/mid\/i$/);
  }
});

test('static snapshots are configured only for resorts with verified image feeds', () => {
  const snapshotResorts = resorts.filter((resort) => resort.cameras.some((camera) => camera.type === 'image')).map((resort) => resort.id).sort();
  assert.deepEqual(snapshotResorts, ['breckenridge', 'copper-mountain', 'crested-butte', 'keystone', 'loveland', 'monarch', 'vail', 'winter-park']);
});
