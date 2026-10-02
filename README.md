# POW Cam

Find nearby Colorado ski resorts, open official camera players or published static snapshots in-page where available, view resort forecasts, and compare options side by side.

## Run locally

Requires Node.js 18 or newer; there are no npm dependencies.

```sh
npm start
```

Then open [http://localhost:3001](http://localhost:3001). Use **Use my location** and allow location access to sort the resorts by distance from your device. Location is only used in the browser and is not sent to a server. Without permission, the app shows all resorts alphabetically. Search filters the resort list; select two or three resorts to compare. When a resort has an in-page camera source, the comparison dialog loads each selected mountain side by side and lets you choose camera views independently.

## Current scope

The catalog contains fifteen Colorado resorts, including Aspen Mountain, Aspen Highlands, Buttermilk, and Snowmass. Distances are straight-line estimates, not driving times. Official camera players are available for Winter Park (CamStreamer), Loveland, Arapahoe Basin (HDRelay), Monarch (Brownrice), and all four Aspen Snowmass mountains. Published static image snapshots are available for Winter Park, Loveland, Monarch, Keystone, Breckenridge, Copper, Vail, and Crested Butte; all camera media loads only after a visitor opens the camera viewer. Eldora and Steamboat remain official-page links because no current still feed was verified. Images are loaded directly from resort/provider endpoints, never proxied or stored by POW Cam. Confirm source permissions and terms before broader public launch.

Each resort card links to that resort’s published snow report. POW Cam does not automatically scrape or republish resort totals: pages use inconsistent reporting windows and formats, and several resort groups restrict automated aggregation or republication. The report links let riders check the source values directly. A card’s expandable Snow-Forecast widget loads on demand and links back to Snow-Forecast.com; its forecast is updated by the provider every four hours. Location is opt-in: before permission is granted, resorts are shown alphabetically with no assumed location or distance ranking. Location access requires a secure browser context (localhost works; a hosted version should use HTTPS).

Next product decisions: confirm public-display permission for camera snapshots and pursue licensed machine-readable resort snow feeds if numeric totals should be aggregated in the app. Eldora and Steamboat still have no verified current static image feeds.
