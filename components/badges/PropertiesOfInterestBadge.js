import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { graphqlOperation, API } from 'aws-amplify';
import Badge from './Badge';
import { propertyService } from '../../services';
import { onPropertyOfInterestChange } from '../../src/graphql/subscriptions';
import { EVENT_TYPES, logEvent, APP_REGIONS } from '../../helpers/logHelper';

const PropertiesOfInterestBadge = ({ user, propertiesOfInterestNotSeen, setPropertiesOfInterestNotSeen }) => {
  const [subscription, setSubscription] = useState(null);
  const [subscriptionRetryCount, setSubscriptionRetryCount] = useState(0);
  const [propertiesOfInterestNotSeenCount, setPropertiesOfInterestNotSeenCount] = useState(0);

  useEffect(() => {
    getPropertyBadgeCount();
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
        message: `PROPERTIES OF INTEREST BADGE SUBSCRIPTION RETRY ${count}`,
        eventType: EVENT_TYPES.WARNING,
        appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
      });

      setTimeout(() => {
        setSubscriptionRetryCount(count);
        initSubscription();
      }, count * 5000);
    } else {
      logEvent({
        message: `PROPERTIES OF INTEREST BADGE SUBSCRIPTION MAX RETRY ATTEMPTS: ${subscriptionRetryCount}`,
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
            message: `PROPERTY OF INTEREST SUBSCRIPTION ERROR ON APP STATE CHANGE: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        }
        await initSubscription();
        setSubscriptionRetryCount(0);
      }

      getPropertyBadgeCount();
    }
  };

  const initSubscription = async () => {
    try {
      const propertySubscription = await API.graphql(
        graphqlOperation(onPropertyOfInterestChange, { client_id: user.id })
      ).subscribe({
        error: err => {
          console.error('PROPERTY OF INTEREST COUNT SUBSCRIPTION ERROR: ', err);

          // Subscription sometimes disconnects if idle for too long
          handleSubscriptionRetry();

          const errMessage = err && err.error ? JSON.stringify(err.error) : 'Unknown';

          logEvent({
            message: `PROPERTY OF INTEREST COUNT SUBSCRIPTION ERROR: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        },
        next: () => {
          getPropertyBadgeCount();
        },
      });

      setSubscription(propertySubscription);
    } catch (error) {
      console.log('Error on property subscription: ', error);
    }
  };

  const getPropertyBadgeCount = async () => {
    try {
      const results = await propertyService.queries.getPropertiesOfInterestNotSeenCount(user.id);

      setPropertiesOfInterestNotSeen(results);
      setPropertiesOfInterestNotSeenCount(results.length);
    } catch (error) {
      logEvent({
        message: `Error: ${error}`,
        eventType: EVENT_TYPES.WARNING,
        appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
      });
    }
  };

  return <Badge count={propertiesOfInterestNotSeenCount} absolute />;
};

export default PropertiesOfInterestBadge;
