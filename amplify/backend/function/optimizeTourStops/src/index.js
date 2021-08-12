const fetch = require('node-fetch');
const { SSM } = require('aws-sdk');
const DBHelper = require('./DBHelper');

const ssm = new SSM();

exports.handler = async event => {
  try {
    console.log('EVENT: ', event);

    const { optimizeTourStopsInput } = event.arguments || {};
    const { tour_stops: tourStops } = optimizeTourStopsInput;

    const updatedTourStops = await getPotentialRoutes(tourStops);

    return updatedTourStops;
  } catch (error) {
    console.log('Error processing user: ', error);
    throw error;
  }
};

const getPotentialRoutes = async tourStops => {
  const orderedTourStops = tourStops.sort((a, b) => a.order > b.order);

  const startingProperty = orderedTourStops.shift();

  const promiseArray = [];

  for (let i = 0; i < orderedTourStops.length; i += 1) {
    const waypoints = [...orderedTourStops];

    const endingProperty = waypoints[i];

    waypoints.splice(i, 1);

    promiseArray.push(optimizePotentialPath(startingProperty, endingProperty, waypoints));
  }

  const potentialRoutes = await Promise.all(promiseArray);

  const updatedRoutes = await processPotentialRoutes(potentialRoutes);

  return updatedRoutes;
};

const processPotentialRoutes = async routes => {
  let shortestTime = Number.MAX_VALUE;
  let shortestDistance = Number.MAX_VALUE;
  let bestRouteIndex = -1;

  for (let i = 0; i < routes.length; i++) {
    const potentialRoute = routes[i];

    if (potentialRoute.time && potentialRoute.time < shortestTime) {
      shortestTime = potentialRoute.time;
      shortestDistance = potentialRoute.distance || Number.MAX_VALUE;
      bestRouteIndex = i;
    } else if (
      potentialRoute.time &&
      potentialRoute.distance &&
      potentialRoute.time === shortestTime &&
      potentialRoute.distance < shortestDistance
    ) {
      shortestTime = potentialRoute.time;
      shortestDistance = potentialRoute.distance || Number.MAX_VALUE;
      bestRouteIndex = i;
    }
  }

  if (bestRouteIndex === -1) {
    throw new Error('Could not parse potential routes');
  }

  const optimalRoute = routes[bestRouteIndex];

  const optimizedTourStops = optimalRoute.order.map((tourStopId, index) => ({ id: tourStopId, order: index + 1 }));

  await updateTourStopOrders(optimizedTourStops);

  return optimizedTourStops;
};

const optimizePotentialPath = async (startingLocation, endingLocation, waypoints) => {
  try {
    const origin = `${startingLocation.latitude},${startingLocation.longitude}`;
    const destination = `${endingLocation.latitude},${endingLocation.longitude}`;
    
    const key = await getGoogleApiKey();

    let mapsEndpoint = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=optimize:true`;

    for (let i = 0; i < waypoints.length; i += 1) {
      const tourStop = waypoints[i];

      mapsEndpoint += `|${tourStop.latitude},${tourStop.longitude}`;
    }

    mapsEndpoint += "&key=" + key;

    const directionsResult = await (await fetch(mapsEndpoint)).json();

    // routes object also has an encoded overview_polyine and legs object contains directions / sub polylines
    const {
      routes: [{ legs, waypoint_order: waypointOrder }],
    } = directionsResult;

    let totalDistance = 0;
    let totalTime = 0;

    for (const leg of legs) {
      totalDistance += leg.distance.value;
      totalTime += leg.duration.value;
    }

    const stopOrder = [startingLocation.id];

    for (const optimizedWaypointPosition of waypointOrder) {
      stopOrder.push(waypoints[optimizedWaypointPosition].id);
    }

    stopOrder.push(endingLocation.id);

    const result = {
      time: totalTime,
      distance: totalDistance,
      order: stopOrder,
    };

    return result;
  } catch (error) {
    console.log('Error calculating potention path: ', error);
  }
};

const getGoogleApiKey = async () => {
  const ssmParams = {
    Names: [`/AboutTimeTours/${process.env.ENV}/googleApiKey`],
    WithDecryption: true,
  };

  const { Parameters } = await ssm.getParameters(ssmParams).promise();

  const result = Parameters.reduce((accum, parameter) => {
    const name = parameter.Name.split('/').pop();

    accum[name] = parameter.Value;

    return accum;
  }, {});

  return result.googleApiKey;
};

const updateTourStopOrders = async tourStops => {
  try {
    const queries = [];

    for (const tourStop of tourStops) {
      queries.push({
        sql: 'UPDATE tourStop SET `order` = :order, updated_at = UNIX_TIMESTAMP() WHERE id = :id',
        params: { order: tourStop.order, id: tourStop.id },
      });
    }

    return await DBHelper.executeTransaction(queries);
  } catch (error) {
    console.log('Error saving updated tour stops: ', error);
    throw error;
  }
};
