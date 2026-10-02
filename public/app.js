import { sortByDistance } from './geo.js';
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
let hasLocation = false;
let locationName = 'your location';
let hdRelayScriptPromise;
const selectedIds = new Set();

function formatDistance(miles) {
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

function resortCard(resort, index) {
  const card = document.createElement('article');
  const isNearest = hasLocation && index === 0;
  card.className = `resort-card${isNearest ? ' is-nearest' : ''}`;

  const info = document.createElement('div');
  const kicker = document.createElement('div');
  kicker.className = 'card-kicker';
  kicker.append(document.createTextNode(isNearest ? 'Closest resort' : `Mountain ${String(index + 1).padStart(2, '0')}`));
  if (isNearest) {
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
  snowLabel.textContent = 'SNOW REPORT';
  const snowLink = document.createElement('a');
  snowLink.href = resort.snowReportUrl;
  snowLink.target = '_blank';
  snowLink.rel = 'noopener noreferrer';
  snowLink.textContent = 'Official report ↗';
  snow.append(snowLabel, snowLink);
  info.append(kicker, name, town, snow);

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const distance = document.createElement('span');
  distance.className = 'distance';
  distance.textContent = hasLocation ? formatDistance(resort.distanceMiles) : '';
  distance.hidden = !hasLocation;

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
    camAction.textContent = 'Open cams ↗';
    camAction.addEventListener('click', () => openCameraViewer(resort));
  } else {
    camAction.href = resort.webcamsUrl;
    camAction.target = '_blank';
    camAction.rel = 'noopener noreferrer';
    camAction.textContent = 'Official cams ↗';
  }
  bottom.append(label, camAction);
  actions.append(distance, bottom);

  const forecast = document.createElement('details');
  forecast.className = 'forecast-details';
  const forecastLabel = document.createElement('summary');
  forecastLabel.textContent = 'Weather forecast';
  const forecastPanel = document.createElement('div');
  forecastPanel.className = 'forecast-panel';
  forecast.addEventListener('toggle', () => {
    if (!forecast.open || forecastPanel.childElementCount > 0) return;
    const frame = document.createElement('iframe');
    frame.src = resort.snowForecastUrl;
    frame.title = `${resort.name} snow and weather forecast by Snow-Forecast.com`;
    frame.loading = 'lazy';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    forecastPanel.append(frame);
    const attribution = document.createElement('a');
    attribution.href = resort.snowForecastUrl;
    attribution.target = '_blank';
    attribution.rel = 'noopener noreferrer';
    attribution.textContent = 'Forecast by Snow-Forecast.com ↗';
    forecastPanel.append(attribution);
  });
  forecast.append(forecastLabel, forecastPanel);
  card.append(info, actions, forecast);
  return card;
}

function renderResorts() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const filtered = nearbyResorts.filter((resort) =>
    `${resort.name} ${resort.town}`.toLocaleLowerCase().includes(query)
  );
  grid.replaceChildren(...filtered.map(resortCard));
  emptyResults.hidden = filtered.length > 0;
  summary.textContent = hasLocation
    ? `${filtered.length} RESORT${filtered.length === 1 ? '' : 'S'} · SORTED BY DISTANCE FROM ${locationName.toUpperCase()}`
    : `${filtered.length} RESORT${filtered.length === 1 ? '' : 'S'} · BROWSE ALL · ENABLE LOCATION TO SORT BY DISTANCE`;
}

function updateCompareBar() {
  compareBar.hidden = selectedIds.size === 0;
  compareCount.textContent = selectedIds.size;
  compareButton.disabled = selectedIds.size < 2;
  compareButton.textContent = selectedIds.size < 2 ? 'Select 2 to compare' : 'Compare cams ↗';
}

function renderCompareCard(resort, index) {
  const card = document.createElement('article');
  card.className = 'compare-card';
  const number = document.createElement('span');
  number.className = 'compare-number';
  number.textContent = `0${index + 1} / COMPARE`;
  const name = document.createElement('h3');
  name.textContent = resort.name;
  const detail = document.createElement('p');
  detail.textContent = hasLocation ? `${resort.town} · ${formatDistance(resort.distanceMiles)} away` : resort.town;
  card.append(number, name, detail);

  if (!resort.cameras?.length) {
    const unavailable = document.createElement('p');
    unavailable.className = 'compare-camera-unavailable';
    unavailable.textContent = 'No in-page camera feed is available for this resort yet.';
    const officialLink = document.createElement('a');
    officialLink.className = 'cam-link';
    officialLink.href = resort.webcamsUrl;
    officialLink.target = '_blank';
    officialLink.rel = 'noopener noreferrer';
    officialLink.textContent = 'Official cams ↗';
    card.append(unavailable, officialLink);
    return card;
  }

  const toolbar = document.createElement('div');
  toolbar.className = 'compare-camera-toolbar';
  const label = document.createElement('label');
  const select = document.createElement('select');
  select.setAttribute('aria-label', `Camera view at ${resort.name}`);
  select.replaceChildren(...resort.cameras.map((camera, cameraIndex) => {
    const option = document.createElement('option');
    option.value = String(cameraIndex);
    option.textContent = camera.name;
    return option;
  }));
  label.append(document.createTextNode('View '), select);
  toolbar.append(label);

  const status = document.createElement('p');
  status.className = 'camera-status';
  status.setAttribute('role', 'status');
  const stage = document.createElement('div');
  stage.className = 'camera-stage compare-camera-stage';
  const officialLink = document.createElement('a');
  officialLink.className = 'official-source compare-official-source';
  officialLink.href = resort.webcamsUrl;
  officialLink.target = '_blank';
  officialLink.rel = 'noopener noreferrer';
  officialLink.textContent = 'Official resort cams ↗';
  const cameraOptions = { stage, status, resortName: resort.name };
  select.addEventListener('change', () => renderCamera(resort.cameras[Number(select.value)], cameraOptions));
  card.append(toolbar, status, stage, officialLink);
  renderCamera(resort.cameras[0], cameraOptions);
  return card;
}

function openComparison() {
  const selected = nearbyResorts.filter((resort) => selectedIds.has(resort.id));
  compareGrid.replaceChildren(...selected.map(renderCompareCard));
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

async function renderCamera(camera, options = {}) {
  const stage = options.stage || cameraStage;
  const status = options.status || cameraStatus;
  const resortName = options.resortName || cameraDialogTitle.textContent;
  stage.replaceChildren();
  status.textContent = `Loading ${camera.name} from ${camera.provider}…`;
  const frameId = `hdrelay-target-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  if (camera.type === 'hdrelay') {
    const target = document.createElement('div');
    target.id = frameId;
    stage.append(target);
    try {
      await loadHdRelayScript();
      if (!stage.contains(target)) return;
      window.HDRelay.create({ target: target.id, id: camera.providerId });
      status.textContent = `${camera.name} · player by ${camera.provider}`;
    } catch (error) {
      status.textContent = `${error.message} Use the official cam page below.`;
    }
    return;
  }

  if (camera.type === 'image') {
    const image = document.createElement('img');
    image.src = camera.url;
    image.alt = `${camera.name} at ${resortName}`;
    image.loading = 'eager';
    image.addEventListener('load', () => {
      if (stage.contains(image)) status.textContent = `${camera.name} · static snapshot from ${camera.provider}`;
    }, { once: true });
    image.addEventListener('error', () => {
      if (stage.contains(image)) status.textContent = 'This camera image is unavailable. Use the official cam page below.';
    }, { once: true });
    stage.append(image);
    return;
  }

  const frame = document.createElement('iframe');
  frame.src = camera.url;
  frame.title = `${camera.name} at ${resortName}`;
  frame.loading = 'eager';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allow = 'autoplay; fullscreen; picture-in-picture';
  frame.allowFullscreen = true;
  stage.append(frame);
  status.textContent = `${camera.name} · player by ${camera.provider}`;
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
  hasLocation = true;
  nearbyResorts = sortByDistance(resorts, nextLocation);
  status.textContent = `Showing resorts near ${locationName}. Distances are approximate straight-line miles.`;
  renderResorts();
}

async function loadResorts() {
  try {
    const response = await fetch('/resorts.json');
    if (!response.ok) throw new Error('Resort list could not be loaded.');
    resorts = await response.json();
    nearbyResorts = [...resorts].sort((a, b) => a.name.localeCompare(b.name));
    renderResorts();
  } catch (error) {
    summary.textContent = 'RESORTS UNAVAILABLE';
    status.textContent = error.message;
  }
}

locateButton.addEventListener('click', () => {
  if (!('geolocation' in navigator)) {
    status.textContent = 'Location is not available in this browser. Browse all resorts alphabetically.';
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
        2: 'Your location could not be determined. Try again or continue browsing all resorts.',
        3: 'Location lookup timed out. Try again or continue browsing all resorts.'
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
compareDialog.addEventListener('close', () => compareGrid.replaceChildren());
document.querySelector('#close-camera-dialog').addEventListener('click', () => cameraDialog.close());
cameraDialog.addEventListener('close', () => cameraStage.replaceChildren());
cameraDialog.addEventListener('click', (event) => {
  if (event.target === cameraDialog) cameraDialog.close();
});

loadResorts();
