const axios = require('axios').default;
const axiosRetry = require('axios-retry');

axiosRetry(axios, {
  retries: 3,
  retryDelay: retryCount => retryCount * 250,
});

module.exports.geocodeAddress = async address => {
  try {
    const url = encodeURI(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyCgZhx2MuTbG_uK1wat7Ml2Cx6y37JMgiA`
    );

    const { data } = await axios.get(url);

    const result = data.results[0];

    const {
      geometry: {
        location: { lat, lng },
      },
    } = result;

    console.log("LAT/LNG: ", lat, lng);

    return { latitude: lat, longitude: lng };
  } catch (error) {
    console.error('Error geocoding property address: ', error);

    return { latitude: null, longitude: null };
  }
};
