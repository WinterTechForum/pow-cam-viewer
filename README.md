# POW Cam

Find nearby Colorado ski resorts, open official camera players or published static snapshots in-page where available, view resort forecasts, and compare options side by side.

## Run locally

Requires Node.js 18 or newer; there are no npm dependencies.

```sh
npm start
```

Then open [http://localhost:3001](http://localhost:3001). Use **Use my location** and allow location access to sort the resorts by distance from your device. Location is only used in the browser and is not sent to a server. Without permission, the app shows a Denver preview. Search filters the resort list; select two or three resorts to compare. When a resort has an in-page camera source, the comparison dialog loads each selected mountain side by side and lets you choose camera views independently.

## Current scope

The starter catalog contains eleven Colorado resorts. Distances are straight-line estimates, not driving times. Official camera players are available for Winter Park (CamStreamer), Loveland, Arapahoe Basin (HDRelay), and Monarch (Brownrice). Published static image snapshots are available for Winter Park, Loveland, Monarch, Keystone, Breckenridge, Copper, Vail, and Crested Butte; all camera media loads only after a visitor opens the camera viewer. Eldora and Steamboat remain official-page links because no current still feed was verified. Images are loaded directly from resort/provider endpoints, never proxied or stored by POW Cam. Confirm source permissions and terms before broader public launch.

Each card shows an estimated trailing 24-hour snowfall total from Open-Meteo's hourly forecast API, converted from centimeters to inches. This is model output, not a resort-reported snow stake total. A card's expandable Snow-Forecast widget loads on demand and links back to Snow-Forecast.com; its forecast is updated by the provider every four hours. Open-Meteo attribution is shown in the app. It requires an internet connection and is fetched in one multi-location request. Location access requires a secure browser context (localhost works; a hosted version should use HTTPS).

Next product decisions: confirm public-display permission for camera snapshots, find current still feeds for Eldora and Steamboat, expand the resort catalog, and decide whether resort-reported snow totals should replace the modeled snowfall estimates.
