import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import * as ExpoNotification from 'expo-notifications';
import Badge from './Badge';
import { notificationService, userService } from '../../services';

const NotificationCountBadge = ({ user, notificationCount, setNotificationCount, setClientRequestCount }) => {
  useEffect(() => {
    getNotificationCount();

    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, []);

  const handleAppStateChange = newState => {
    if (newState === 'active') {
      getNotificationCount();
    }
  };

  const getNotificationCount = async () => {
    try {
      const { count } = await notificationService.queries.getUserNotificationCount(user.id);
      const { count: requestedClientCount } = await userService.queries.requestedClientNotSeenCount(user.id);

      setClientRequestCount(requestedClientCount);
      setNotificationCount(count || 0);
      await ExpoNotification.setBadgeCountAsync(count || 0);
    } catch (error) {
      console.log('Error: ', error);
    }
  };

  return <Badge count={notificationCount} absolute />;
};

export default NotificationCountBadge;
