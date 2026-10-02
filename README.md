# POW Cam

Find nearby Colorado ski resorts, watch official camera players in-page where available, and compare resort options side by side.

## Run locally

Requires Node.js 18 or newer; there are no npm dependencies.

```sh
npm start
```

Then open [http://localhost:3001](http://localhost:3001). Use **Use my location** and allow location access to sort the resorts by distance from your device. Location is only used in the browser and is not sent to a server. Without permission, the app shows a Denver preview. Search filters the resort list; select two or three resorts to compare distance and jump to each official webcam page.

## Current scope

The starter catalog contains eleven Colorado resorts. Distances are straight-line estimates, not driving times. Official camera players are embedded in POW Cam for Winter Park (CamStreamer), Loveland, Arapahoe Basin (HDRelay), and Monarch (Brownrice). Those players load only when a visitor opens a camera view. For the other resorts, the app links to the official webcam page until an approved embed or feed is available; it does not iframe entire resort websites or proxy/rehost their media. Camera source availability and permissions should be confirmed with each resort/provider before public launch.

Each card also shows an estimated trailing 24-hour snowfall total from Open-Meteo's hourly forecast API, converted from centimeters to inches. This is model output, not a resort-reported snow stake total; Open-Meteo attribution is shown in the app. It requires an internet connection and is fetched in one multi-location request. Location access requires a secure browser context (localhost works; a hosted version should use HTTPS).

Next product decisions: obtain an authorized webcam feed source for the resorts without published embeds, expand the resort catalog, and decide whether resort-reported snow totals should replace the modeled snowfall estimates.
