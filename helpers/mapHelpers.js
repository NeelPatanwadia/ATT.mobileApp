const average = args => args.reduce((a, b) => a + b) / args.length;

const splitScreenRegion = newRegion => {
  const splitLatitudeDelta = newRegion.latitudeDelta * 2;
  const splitLatitude = newRegion.latitude - newRegion.latitudeDelta / 2;

  return { ...newRegion, latitude: splitLatitude, latitudeDelta: splitLatitudeDelta };
};

const calcRegion = coordinates => {
  const latitudes = coordinates.map(coo => coo.latitude);
  const longitudes = coordinates.map(coo => coo.longitude);

  const latitude = (Math.max(...latitudes) + Math.min(...latitudes)) / 2;
  const longitude = (Math.max(...longitudes) + Math.min(...longitudes)) / 2;

  const latitudeDifference = Math.max(...latitudes) - Math.min(...latitudes);
  const longitudeDifference = Math.max(...longitudes) - Math.min(...longitudes);

  const latitudeDelta = latitudeDifference > 0 ? latitudeDifference * 1.5 : 0.0065;
  const longitudeDelta = longitudeDifference > 0 ? longitudeDifference * 1.5 : 0.0185;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

export { average, calcRegion, splitScreenRegion };
