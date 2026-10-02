import { sortByDistance } from './geo.js';
import { loadSnowfallEstimates } from './snow.js';

const PREVIEW_LOCATION = { latitude: 39.7392, longitude: -104.9903 };
const PREVIEW_NAME = 'Denver preview';
const MAX_COMPARE = 3;
const HDRELAY_SCRIPT_URL = 'https://manage.hdrelay.com/js/hdrelay.js';

const grid = document.querySelector('#resort-grid');
const summary = document.querySelector('#results-summary');
const status = document.querySelector('#location-status');
const locateButton = document.querySelector('#locate-button');
const searchInput = document.querySelector('#search-input');
const emptyResults = document.querySelector('#empty-results');
const compareBar = document.querySelector('#compare-bar');
const compareCount = document.querySelector('#compare-count');
const compareButton = document.querySelector('#open-compare');
const compareDialog = document.querySelector('#compare-dialog');
const compareGrid = document.querySelector('#compare-grid');
const cameraDialog = document.querySelector('#camera-dialog');
const cameraDialogTitle = document.querySelector('#camera-dialog-title');
const cameraSelect = document.querySelector('#camera-select');
const cameraStage = document.querySelector('#camera-stage');
const cameraStatus = document.querySelector('#camera-status');
const cameraOfficialLink = document.querySelector('#camera-official-link');

let resorts = [];
let nearbyResorts = [];
let locationName = PREVIEW_NAME;
let snowStatus = 'loading';
let hdRelayScriptPromise;
const selectedIds = new Set();

function formatDistance(miles) {
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

function formatSnowfall(inches) {
  return inches == null ? '—' : `${inches.toFixed(1)}″`;
}

function resortCard(resort, index) {
  const card = document.createElement('article');
  card.className = `resort-card${index === 0 ? ' is-nearest' : ''}`;

  const info = document.createElement('div');
  const kicker = document.createElement('div');
  kicker.className = 'card-kicker';
  kicker.append(document.createTextNode(index === 0 ? 'Closest resort' : `Mountain ${String(index + 1).padStart(2, '0')}`));
  if (index === 0) {
    const tag = document.createElement('span');
    tag.className = 'nearest-tag';
    tag.textContent = 'NEAREST';
    kicker.append(tag);
  }

  const name = document.createElement('h3');
  name.textContent = resort.name;
  const town = document.createElement('p');
  town.className = 'resort-town';
  town.textContent = resort.town;
  const snow = document.createElement('p');
  snow.className = 'snow-total';
  const snowLabel = document.createElement('span');
  snowLabel.textContent = 'EST. SNOW / 24H';
  const snowValue = document.createElement('strong');
  snowValue.textContent = snowStatus === 'loading' ? '…' : formatSnowfall(resort.snowfall24hInches);
  snow.append(snowLabel, snowValue);
  info.append(kicker, name, town, snow);

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const distance = document.createElement('span');
  distance.className = 'distance';
  distance.textContent = formatDistance(resort.distanceMiles);

  const bottom = document.createElement('div');
  bottom.className = 'card-bottom';
  const label = document.createElement('label');
  label.className = 'select-control';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = selectedIds.has(resort.id);
  checkbox.disabled = !checkbox.checked && selectedIds.size >= MAX_COMPARE;
  checkbox.setAttribute('aria-label', `Select ${resort.name} to compare`);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) selectedIds.add(resort.id);
    else selectedIds.delete(resort.id);
    updateCompareBar();
    renderResorts();
  });
  label.append(checkbox, document.createTextNode('Compare'));

  const camAction = resort.cameras?.length
    ? document.createElement('button')
    : document.createElement('a');
  camAction.className = 'cam-link';
  if (resort.cameras?.length) {
    camAction.type = 'button';
    camAction.textContent = 'Watch here ↗';
    camAction.addEventListener('click', () => openCameraViewer(resort));
  } else {
    camAction.href = resort.webcamsUrl;
    camAction.target = '_blank';
    camAction.rel = 'noopener noreferrer';
    camAction.textContent = 'Official cams ↗';
  }
  bottom.append(label, camAction);
  actions.append(distance, bottom);
  card.append(info, actions);
  return card;
}

function renderResorts() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const filtered = nearbyResorts.filter((resort) =>
    `${resort.name} ${resort.town}`.toLocaleLowerCase().includes(query)
  );
  grid.replaceChildren(...filtered.map(resortCard));
  emptyResults.hidden = filtered.length > 0;
  summary.textContent = `${filtered.length} RESORT${filtered.length === 1 ? '' : 'S'} · SORTED BY DISTANCE FROM ${locationName.toUpperCase()}`;
}

function updateCompareBar() {
  compareBar.hidden = selectedIds.size === 0;
  compareCount.textContent = selectedIds.size;
  compareButton.disabled = selectedIds.size < 2;
  compareButton.textContent = selectedIds.size < 2 ? 'Select 2 to compare' : 'Compare cams ↗';
}

function openComparison() {
  const selected = nearbyResorts.filter((resort) => selectedIds.has(resort.id));
  compareGrid.replaceChildren(...selected.map((resort, index) => {
    const card = document.createElement('article');
    card.className = 'compare-card';
    const number = document.createElement('span');
    number.className = 'compare-number';
    number.textContent = `0${index + 1} / COMPARE`;
    const name = document.createElement('h3');
    name.textContent = resort.name;
    const detail = document.createElement('p');
    detail.textContent = `${resort.town} · ${formatDistance(resort.distanceMiles)} away · ${formatSnowfall(resort.snowfall24hInches)} est. snow`;
    let camAction;
    if (resort.cameras?.length) {
      camAction = document.createElement('button');
      camAction.type = 'button';
      camAction.className = 'cam-link';
      camAction.textContent = 'Watch here ↗';
      camAction.addEventListener('click', () => {
        compareDialog.close();
        openCameraViewer(resort);
      });
    } else {
      camAction = document.createElement('a');
      camAction.className = 'cam-link';
      camAction.href = resort.webcamsUrl;
      camAction.target = '_blank';
      camAction.rel = 'noopener noreferrer';
      camAction.textContent = 'Official cams ↗';
    }
    card.append(number, name, detail, camAction);
    return card;
  }));
  compareDialog.showModal();
}

function loadHdRelayScript() {
  if (window.HDRelay) return Promise.resolve();
  if (hdRelayScriptPromise) return hdRelayScriptPromise;
  hdRelayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = HDRELAY_SCRIPT_URL;
    script.async = true;
    script.referrerPolicy = 'strict-origin';
    script.onload = () => window.HDRelay ? resolve() : reject(new Error('HDRelay player did not initialize.'));
    script.onerror = () => reject(new Error('Could not load the HDRelay camera player.'));
    document.head.append(script);
  });
  return hdRelayScriptPromise;
}

async function renderCamera(camera) {
  cameraStage.replaceChildren();
  cameraStatus.textContent = `Loading ${camera.name} from ${camera.provider}…`;
  const frameId = `hdrelay-target-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  if (camera.type === 'hdrelay') {
    const target = document.createElement('div');
    target.id = frameId;
    cameraStage.append(target);
    try {
      await loadHdRelayScript();
      if (!cameraStage.contains(target)) return;
      window.HDRelay.create({ target: target.id, id: camera.providerId });
      cameraStatus.textContent = `${camera.name} · player by ${camera.provider}`;
    } catch (error) {
      cameraStatus.textContent = `${error.message} Use the official cam page below.`;
    }
    return;
  }

  if (camera.type === 'image') {
    const image = document.createElement('img');
    image.src = camera.url;
    image.alt = `${camera.name} at ${cameraDialogTitle.textContent}`;
    image.loading = 'eager';
    image.addEventListener('load', () => {
      cameraStatus.textContent = `${camera.name} · current image from ${camera.provider}`;
    }, { once: true });
    image.addEventListener('error', () => {
      cameraStatus.textContent = `This camera image is unavailable. Use the official cam page below.`;
    }, { once: true });
    cameraStage.append(image);
    return;
  }

  const frame = document.createElement('iframe');
  frame.src = camera.url;
  frame.title = `${camera.name} at ${cameraDialogTitle.textContent}`;
  frame.loading = 'eager';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allow = 'autoplay; fullscreen; picture-in-picture';
  frame.allowFullscreen = true;
  cameraStage.append(frame);
  cameraStatus.textContent = `${camera.name} · player by ${camera.provider}`;
}

function openCameraViewer(resort) {
  cameraDialogTitle.textContent = resort.name;
  cameraOfficialLink.href = resort.webcamsUrl;
  cameraSelect.replaceChildren(...resort.cameras.map((camera, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = camera.name;
    return option;
  }));
  cameraSelect.onchange = () => renderCamera(resort.cameras[Number(cameraSelect.value)]);
  cameraDialog.showModal();
  renderCamera(resort.cameras[0]);
}

function setLocation(nextLocation, nextName) {
  locationName = nextName;
  nearbyResorts = sortByDistance(resorts, nextLocation);
  status.textContent = `Showing resorts near ${locationName}. Distances are approximate straight-line miles.`;
  renderResorts();
}

async function loadSnowTotals() {
  try {
    const estimates = await loadSnowfallEstimates(resorts);
    for (const resort of resorts) resort.snowfall24hInches = estimates.get(resort.id);
    snowStatus = 'loaded';
  } catch (error) {
    snowStatus = 'unavailable';
    console.warn('Snowfall estimates unavailable:', error);
  }
  renderResorts();
}

async function loadResorts() {
  try {
    const response = await fetch('/resorts.json');
    if (!response.ok) throw new Error('Resort list could not be loaded.');
    resorts = await response.json();
    setLocation(PREVIEW_LOCATION, PREVIEW_NAME);
    loadSnowTotals();
  } catch (error) {
    summary.textContent = 'RESORTS UNAVAILABLE';
    status.textContent = error.message;
  }
}

locateButton.addEventListener('click', () => {
  if (!('geolocation' in navigator)) {
    status.textContent = 'Location is not available in this browser. Showing the Denver preview.';
    return;
  }
  locateButton.disabled = true;
  status.textContent = 'Finding your location…';
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      setLocation({ latitude: coords.latitude, longitude: coords.longitude }, 'your location');
      locateButton.disabled = false;
    },
    (error) => {
      const messages = {
        1: 'Location permission was denied. Allow location access in your browser settings to see nearby resorts.',
        2: 'Your location could not be determined. Try again or use the Denver preview.',
        3: 'Location lookup timed out. Try again.'
      };
      status.textContent = messages[error.code] || 'Location lookup failed. Try again.';
      locateButton.disabled = false;
    },
    { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
  );
});

searchInput.addEventListener('input', renderResorts);
document.querySelector('#clear-compare').addEventListener('click', () => {
  selectedIds.clear();
  updateCompareBar();
  renderResorts();
});
compareButton.addEventListener('click', openComparison);
document.querySelector('#close-compare').addEventListener('click', () => compareDialog.close());
compareDialog.addEventListener('click', (event) => {
  if (event.target === compareDialog) compareDialog.close();
});
document.querySelector('#close-camera-dialog').addEventListener('click', () => cameraDialog.close());
cameraDialog.addEventListener('close', () => cameraStage.replaceChildren());
cameraDialog.addEventListener('click', (event) => {
  if (event.target === cameraDialog) cameraDialog.close();
});

loadResorts();
