import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { graphqlOperation, API } from 'aws-amplify';
import Badge from './Badge';
import { tourService } from '../../services';
import { onTourChange } from '../../src/graphql/subscriptions';
import { EVENT_TYPES, logEvent, APP_REGIONS } from '../../helpers/logHelper';

const NewTourBadge = ({ user, setNewTourNotSeen }) => {
  const [subscription, setSubscription] = useState(null);
  const [subscriptionRetryCount, setSubscriptionRetryCount] = useState(0);
  const [newTourNotSeenCount, setNewTourNotSeenCount] = useState(0);

  useEffect(() => {
    getNewTourBadgeCount();
    initSubscription();

    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }

      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, []);

  const handleSubscriptionRetry = () => {
    if (subscriptionRetryCount < 5) {
      const count = subscriptionRetryCount + 1;

      logEvent({
        message: `NEW TOUR BADGE SUBSCRIPTION RETRY ${count}`,
        eventType: EVENT_TYPES.WARNING,
        appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
      });

      setTimeout(() => {
        setSubscriptionRetryCount(count);
        initSubscription();
      }, count * 5000);
    } else {
      logEvent({
        message: `NEW TOUR BADGE SUBSCRIPTION MAX RETRY ATTEMPTS: ${subscriptionRetryCount}`,
        eventType: EVENT_TYPES.ERROR,
        appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
      });
    }
  };

  const handleAppStateChange = async newState => {
    if (newState === 'active') {
      if (subscription) {
        try {
          await subscription.unsubscribe();
        } catch (err) {
          const errMessage = err && err.error ? JSON.stringify(err.error) : 'Unknown';

          logEvent({
            message: `NEW TOUR SUBSCRIPTION ERROR UNSUBSCRIBING ON APP STATE CHANGE: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        }

        await initSubscription();
        setSubscriptionRetryCount(0);
      }

      getNewTourBadgeCount();
    }
  };

  const initSubscription = async () => {
    try {
      const tourSubscription = await API.graphql(graphqlOperation(onTourChange, { client_id: user.id })).subscribe({
        error: err => {
          console.error('NEW TOUR COUNT SUBSCRIPTION ERROR: ', err);

          // Subscription sometimes disconnects if idle for too long
          handleSubscriptionRetry();

          const errMessage = err && err.error ? JSON.stringify(err.error) : 'Unknown';

          logEvent({
            message: `NEW TOUR COUNT SUBSCRIPTION ERROR: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        },
        next: () => {
          getNewTourBadgeCount();
        },
      });

      setSubscription(tourSubscription);
    } catch (error) {
      console.log('Error on tour subscription: ', error);
    }
  };

  const getNewTourBadgeCount = async () => {
    try {
      const fetchedTours = await tourService.queries.listTours({ clientId: user.id });

      const toursNotSeen = fetchedTours.filter(tour => !tour.seenByClient);

      setNewTourNotSeen(toursNotSeen);
      setNewTourNotSeenCount(toursNotSeen.length);
    } catch (error) {
      logEvent({
        message: `Error: ${error}`,
        eventType: EVENT_TYPES.WARNING,
        appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
      });
    }
  };

  return <Badge count={newTourNotSeenCount} absolute />;
};

export default NewTourBadge;
