import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { graphqlOperation, API } from 'aws-amplify';
import Badge from './Badge';
import { showingService } from '../../services';
import { onUpdateShowingRequestStatus, onShowingRemoved } from '../../src/graphql/subscriptions';
import { EVENT_TYPES, logEvent, APP_REGIONS } from '../../helpers/logHelper';

const ShowingCountBadge = ({ user, showingBadgeCount, setShowingRequestCounts, showListingBatch }) => {
  const [updateSubscription, setUpdateSubscription] = useState(null);
  const [removeSubscription, setRemoveSubscription] = useState(null);

  const [updateSubscriptionRetryCount, setUpdateSubscriptionRetryCount] = useState(0);
  const [removeSubscriptionRetryCount, setRemoveSubscriptionRetryCount] = useState(0);

  useEffect(() => {
    getShowingBadgeCount();
    initUpdateSubscription();
    initRemoveSubscription();

    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (updateSubscription) {
        updateSubscription.unsubscribe();
      }

      if (removeSubscription) {
        removeSubscription.unsubscribe();
      }

      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, []);

  const handleUpdateSubscriptionRetry = () => {
    if (updateSubscriptionRetryCount < 5) {
      const count = updateSubscriptionRetryCount + 1;

      logEvent({
        message: `SHOWING BADGE UPDATE SUBSCRIPTION RETRY ${count}`,
        eventType: EVENT_TYPES.WARNING,
        appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
      });

      setTimeout(() => {
        setUpdateSubscriptionRetryCount(count);
        initUpdateSubscription();
      }, count * 5000);
    } else {
      logEvent({
        message: `SHOWING BADGE SUBSCRIPTION UPDATE MAX RETRY ATTEMPTS: ${updateSubscriptionRetryCount}`,
        eventType: EVENT_TYPES.ERROR,
        appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
      });
    }
  };

  const handleRemoveSubscriptionRetry = () => {
    if (removeSubscriptionRetryCount < 5) {
      const count = removeSubscriptionRetryCount + 1;

      logEvent({
        message: `SHOWING BADGE REMOVE SUBSCRIPTION RETRY ${count}`,
        eventType: EVENT_TYPES.WARNING,
        appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
      });

      setTimeout(() => {
        setRemoveSubscriptionRetryCount(count);
        initRemoveSubscription();
      }, count * 5000);
    } else {
      logEvent({
        message: `SHOWING BADGE SUBSCRIPTION REMOVE MAX RETRY ATTEMPTS: ${removeSubscriptionRetryCount}`,
        eventType: EVENT_TYPES.ERROR,
        appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
      });
    }
  };

  const handleAppStateChange = async newState => {
    if (newState === 'active') {
      if (updateSubscription) {
        try {
          await updateSubscription.unsubscribe();
        } catch (err) {
          const errMessage = err && err.error ? JSON.stringify(err.error) : 'Unknown';

          logEvent({
            message: `SHOWING BADGE COUNT UPDATE SUBSCRIPTION ERROR ON APP STATE CHANGE: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        }
      }

      if (removeSubscription) {
        try {
          await removeSubscription.unsubscribe();
        } catch (err) {
          const errMessage = err && err.error ? JSON.stringify(err.error) : 'Unknown';

          logEvent({
            message: `SHOWING BADGE COUNT REMOVE SUBSCRIPTION ERROR ON APP STATE CHANGE: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        }
      }

      await initUpdateSubscription();
      await initRemoveSubscription();

      setUpdateSubscriptionRetryCount(0);
      setRemoveSubscriptionRetryCount(0);
      getShowingBadgeCount();
    }
  };

  const initUpdateSubscription = async () => {
    try {
      const onUpdateSubscription = await API.graphql(
        graphqlOperation(onUpdateShowingRequestStatus, { listing_agent_id: user.id })
      ).subscribe({
        error: err => {
          console.error('SHOWING BADGE COUNT UPDATE SUBSCRIPTION ERROR: ', err);

          // Subscription sometimes disconnects if idle for too long
          handleUpdateSubscriptionRetry();

          const errMessage = err && err.error ? JSON.stringify(err.error) : 'Unknown';

          logEvent({
            message: `SHOWING BADGE COUNT UPDATE SUBSCRIPTION ERROR: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        },
        next: () => {
          console.log('UPDATE TRIGGERED');

          getShowingBadgeCount();
        },
      });

      setUpdateSubscription(onUpdateSubscription);
    } catch (error) {
      console.log('Error on tour subscription: ', error);
    }
  };

  const initRemoveSubscription = async () => {
    try {
      const onRemoveSubscription = await API.graphql(
        graphqlOperation(onShowingRemoved, { listing_agent_id: user.id })
      ).subscribe({
        error: err => {
          console.error('SHOWING BADGE COUNT REMOVE SUBSCRIPTION ERROR: ', err);

          // Subscription sometimes disconnects if idle for too long
          handleRemoveSubscriptionRetry();

          const errMessage = err && err.error ? JSON.stringify(err.error) : 'Unknown';

          logEvent({
            message: `SHOWING BADGE COUNT REMOVE SUBSCRIPTION ERROR: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        },
        next: () => {
          console.log('REMOVE TRIGGERED');

          getShowingBadgeCount();
        },
      });

      setRemoveSubscription(onRemoveSubscription);
    } catch (error) {
      console.log('Error on tour subscription: ', error);
    }
  };

  const getShowingBadgeCount = async () => {
    try {
      const results = await showingService.queries.getShowingActionRequiredCount(user.id);

      setShowingRequestCounts(results);
    } catch (error) {
      console.log('Error: ', error);
    }
  };

  if (showingBadgeCount) {
    return <Badge count={showingBadgeCount} absolute />;
  }
  if (showListingBatch) {
    return <Badge noCountNeeded absolute />;
  }

  return <Badge count={showingBadgeCount} absolute />;
};

export default ShowingCountBadge;
