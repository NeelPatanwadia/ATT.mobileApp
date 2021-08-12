import { AsyncStorage } from 'react-native';
import * as Location from 'expo-location';
import { notificationService, tourService } from '../services';
import { buildNextOnTour, buildLeftHome } from '../notifications/messageBuilder';
import { logEvent, EVENT_TYPES, APP_REGIONS } from './logHelper';
import { AsyncStorageKeys } from '../constants/AppConstants';

export const geocodeAddress = async address => {
  try {
    const url = encodeURI(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyCgZhx2MuTbG_uK1wat7Ml2Cx6y37JMgiA`
    );

    const response = await fetch(url);
    const responseObject = await response.json();

    const result = responseObject.results[0];

    const {
      geometry: {
        location: { lat, lng },
      },
    } = result;

    return { latitude: lat, longitude: lng };
  } catch (error) {
    console.warn('Error geocoding property address: ', error);

    await logEvent({
      message: `Error attempting to geocode address: ${address}: ${JSON.stringify(error)}`,
      appRegion: APP_REGIONS.LOCATION,
      eventType: EVENT_TYPES.ERROR,
    });

    return { latitude: null, longitude: null };
  }
};

export const geoFenceHandler = async ({ data: { eventType, region }, error }) => {
  try {
    if (error) {
      logEvent({
        message: `Error on GeoFence Task: ${JSON.stringify(error)}`,
        appRegion: APP_REGIONS.LOCATION,
        eventType: EVENT_TYPES.ERROR,
      });

      return;
    }

    if (!region) return;

    const { Enter, Exit } = Location.GeofencingEventType;

    const storeTourStops = await AsyncStorage.getItem(AsyncStorageKeys.StoreTourStops).then(resp => JSON.parse(resp));
    const storeGeoState = await AsyncStorage.getItem(AsyncStorageKeys.StoreGeoState).then(
      resp => JSON.parse(resp) || {}
    );
    const storeUser = await AsyncStorage.getItem(AsyncStorageKeys.CurrentUser).then(resp => JSON.parse(resp) || {});

    const newGeoState = { ...storeGeoState };

    newGeoState[region.identifier] = eventType;

    if (storeGeoState[region.identifier] === eventType) return;
    if (!storeGeoState[region.identifier]) return setGeoState(newGeoState);

    setGeoState(newGeoState);

    const tourStopId = parseInt(region.identifier);
    const regionTourStop = await tourService.queries.getTourStop(tourStopId);

    const nextStop = storeTourStops.find(ts => ts.order === Number.parseInt(regionTourStop.order) + 1);

    if (nextStop) {
      let upToDateNextStop = { ...nextStop };

      try {
        upToDateNextStop = await tourService.queries.getTourStop(nextStop.id);
      } catch (error) {
        logEvent({
          message: `Error fetching latest data for next stop, continuing with whats in local storage: ${JSON.stringify(
            error
          )}`,
          appRegion: APP_REGIONS.LOCATION,
          eventType: EVENT_TYPES.WARNING,
        });
      }

      if (
        (eventType === Enter && upToDateNextStop && upToDateNextStop.notifyBefore) ||
        (eventType === Exit && upToDateNextStop && upToDateNextStop.notifyAfter)
      ) {
        await notifyNextOnTour(upToDateNextStop, storeUser);
      }
    }

    if (eventType === Exit && regionTourStop) {
      await notifySellerOfDeparture(regionTourStop);
    }
  } catch (error) {
    logEvent({
      message: `Error processing GeoFence Event: ${JSON.stringify(error)}`,
      appRegion: APP_REGIONS.LOCATION,
      eventType: EVENT_TYPES.ERROR,
    });
  }
};

const setGeoState = (newGeoState = {}) => {
  AsyncStorage.setItem('storeGeoState', JSON.stringify(newGeoState));
};

const notifyNextOnTour = async (nextTourStop, user) => {
  try {
    if (nextTourStop.propertyOfInterest.propertyListing.isCustomListing) {
      logEvent({
        message: `Skipping up next notifications from geo-fence trigger Tour Stop: ${nextTourStop.id} -- property is a custom listing`,
        appRegion: APP_REGIONS.LOCATION,
        eventType: EVENT_TYPES.INFO,
      });

      return;
    }

    if (nextTourStop.nextUpSent) {
      logEvent({
        message: `Skipping up next notifications from geo-fence trigger Tour Stop: ${nextTourStop.id} -- notifications already sent`,
        appRegion: APP_REGIONS.LOCATION,
        eventType: EVENT_TYPES.INFO,
      });

      return;
    }

    const nextPropertyListing = nextTourStop.propertyOfInterest.propertyListing;
    const nextPropertyListingAgent = nextPropertyListing.listingAgent;

    const laName = `${nextPropertyListingAgent.firstName} ${nextPropertyListingAgent.lastName}`;

    const templateTokens = {
      laName,
      baName: `${user.firstName} ${user.lastName}`,
      brokerage: user.brokerage,
      address: nextPropertyListing.address,
    };

    let nextUpSent = false;

    if (nextTourStop.notifyListingAgent) {
      try {
        const { push: agentPushMessage, sms: agentSmsMessage, email: agentEmail } = buildNextOnTour(
          templateTokens,
          false
        );

        await notificationService.mutations.createNotification({
          userId: nextPropertyListingAgent.id,
          pushMessage: agentPushMessage,
          smsMessage: agentSmsMessage,
          email: agentEmail,
        });

        nextUpSent = true;
      } catch (error) {
        logEvent({
          message: `Error Sending Next Up GeoFence Notification to Listing Agent: ${JSON.stringify(error)}`,
          appRegion: APP_REGIONS.LOCATION,
          eventType: EVENT_TYPES.ERROR,
        });
      }
    } else {
      logEvent({
        message: `Skipping next up notification from geo-fence trigger on Tour Stop: ${nextTourStop.id} -- notifications disabled by listing agent`,
        appRegion: APP_REGIONS.LOCATION,
        eventType: EVENT_TYPES.INFO,
      });
    }

    const nextPropertySeller = nextPropertyListing.seller;

    if (nextPropertySeller && nextTourStop.notifySeller) {
      try {
        templateTokens.sellerName = `${nextPropertySeller.firstName} ${nextPropertySeller.lastName}`;

        const { push: sellerPushMessage, sms: sellerSmsMessage, email: sellerEmail } = buildNextOnTour(
          templateTokens,
          true
        );

        await notificationService.mutations.createNotification({
          userId: nextPropertySeller.id,
          pushMessage: sellerPushMessage,
          smsMessage: sellerSmsMessage,
          email: sellerEmail,
        });

        nextUpSent = true;
      } catch (error) {
        logEvent({
          message: `Error Sending Next Up GeoFence Notification to Seller: ${JSON.stringify(error)}`,
          appRegion: APP_REGIONS.LOCATION,
          eventType: EVENT_TYPES.ERROR,
        });
      }
    }

    if (nextUpSent) {
      await tourService.mutations.updateTourStop({
        id: nextTourStop.id,
        nextUpSent: true,
        nextUpSentBy: 'Geo-fence Trigger',
      });
    }
  } catch (error) {
    logEvent({
      message: `Error notifying next property from GeoFence Event: ${JSON.stringify(error)}`,
      appRegion: APP_REGIONS.LOCATION,
      eventType: EVENT_TYPES.ERROR,
    });
  }
};

const notifySellerOfDeparture = async currentTourStop => {
  try {
    if (currentTourStop.propertyOfInterest.propertyListing.isCustomListing) {
      logEvent({
        message: `Skipping departure notification from geo-fence trigger Tour Stop: ${currentTourStop.id} -- property is a custom listing`,
        appRegion: APP_REGIONS.LOCATION,
        eventType: EVENT_TYPES.INFO,
      });

      return;
    }

    if (currentTourStop.haveLeftSent) {
      logEvent({
        message: `Skipping departure notification from geo-fence trigger on Tour Stop: ${currentTourStop.id} -- notification already sent`,
        appRegion: APP_REGIONS.LOCATION,
        eventType: EVENT_TYPES.INFO,
      });

      return;
    }

    if (!currentTourStop.notifySeller) {
      logEvent({
        message: `Skipping departure notification from geo-fence trigger on Tour Stop: ${currentTourStop.id} -- notifications disabled by seller`,
        appRegion: APP_REGIONS.LOCATION,
        eventType: EVENT_TYPES.INFO,
      });

      return;
    }

    const currentProperty = currentTourStop.propertyOfInterest.propertyListing;
    const currentPropertySeller = currentProperty.seller;

    if (!currentPropertySeller) {
      logEvent({
        message: `Skipping departure notification from geo-fence trigger on Tour Stop: ${currentTourStop.id} -- no seller set`,
        appRegion: APP_REGIONS.LOCATION,
        eventType: EVENT_TYPES.INFO,
      });

      return;
    }

    const sellerName = `${currentPropertySeller.firstName} ${currentPropertySeller.lastName}`;

    const { push, sms, email } = buildLeftHome({
      sellerName,
      address: currentProperty.address,
    });

    await notificationService.mutations.createNotification({
      userId: currentPropertySeller.id,
      pushMessage: push,
      smsMessage: sms,
      email,
    });

    await tourService.mutations.updateTourStop({
      id: currentTourStop.id,
      haveLeftSent: true,
      haveLeftSentBy: 'Geo-fence Trigger',
    });
  } catch (error) {
    logEvent({
      message: `Error Notifying Seller of Departure on GeoFence Event: ${JSON.stringify(error)}`,
      appRegion: APP_REGIONS.LOCATION,
      eventType: EVENT_TYPES.ERROR,
    });
  }
};
