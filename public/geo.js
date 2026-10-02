const EARTH_RADIUS_MILES = 3958.8;
const toRadians = (degrees) => (degrees * Math.PI) / 180;

export function distanceMiles(from, to) {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(haversine));
}

export function sortByDistance(resorts, location) {
  return resorts
    .map((resort) => ({ ...resort, distanceMiles: distanceMiles(location, resort) }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles);
}
