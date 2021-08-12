import { useState, useEffect } from 'react';
import { NavigationActions } from 'react-navigation';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import config from '../configs/config';
import { notificationService, userService } from '../services';
import { logEvent, EVENT_TYPES, APP_REGIONS } from '../helpers/logHelper';

const PushNotificationHandler = ({ user, appNavigator, setNotificationCount, setClientRequestCount }) => {
  const [pushToken, setPushToken] = useState(false);
  const [registrationDisabled, setRegistrationDisabled] = useState(false);

  useEffect(() => {
    if (user && !pushToken && !registrationDisabled) {
      registerForPushNotifications();
    }
  }, [user]);

  useEffect(() => {
    const notificationOpenedListener = Notifications.addNotificationResponseReceivedListener(notification => {
      logEvent({
        message: `Notification opened: ${JSON.stringify(notification)}`,
        eventType: EVENT_TYPES.INFO,
        appRegion: APP_REGIONS.NOTIFICATION,
      });

      onNotificationOpened(notification);
    });

    const notificationReceivedListener = Notifications.addNotificationReceivedListener(notification => {
      logEvent({
        message: `Notification received: ${JSON.stringify(notification)}`,
        eventType: EVENT_TYPES.INFO,
        appRegion: APP_REGIONS.NOTIFICATION,
      });

      getUserNotificationCount();
    });

    const pushTokenChangedListener = Notifications.addPushTokenListener(token => saveDeviceData(token.data));

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    return () => {
      notificationOpenedListener.remove();
      notificationReceivedListener.remove();
      pushTokenChangedListener.remove();
    };
  }, [appNavigator]);

  const getPushNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      return true;
    }

    const { status: newStatus } = await Notifications.requestPermissionsAsync();

    return newStatus === 'granted';
  };

  const registerForPushNotifications = async () => {
    try {
      if (!Constants.isDevice) {
        setRegistrationDisabled(true);
        console.log('Push notifications not supported on virtual devices');

        return;
      }

      console.log('Checking notification permissions...');

      const permissionsGranted = await getPushNotificationPermissions();

      if (!permissionsGranted) {
        await logEvent({
          message: 'Could not register for push notifications, permission was not granted',
          eventType: EVENT_TYPES.WARNING,
          appRegion: APP_REGIONS.NOTIFICATION,
        });

        return;
      }

      console.log('Push permission granted, acquiring token...');

      const { experienceId } = config;

      console.log('Experience ID: ', experienceId);
      const { data: token } = await Notifications.getExpoPushTokenAsync({ experienceId });

      console.log('PUSH TOKEN: ', token);

      setPushToken(token);

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      await saveDeviceData(token);
    } catch (error) {
      console.warn('Error registering for push notifications: ', error);

      await logEvent({
        message: `Error registering for push notifications: ${JSON.stringify(error)}`,
        eventType: EVENT_TYPES.ERROR,
        appRegion: APP_REGIONS.NOTIFICATION,
      });
    }
  };

  const saveDeviceData = async token => {
    try {
      const { OS, Version } = Platform;

      await userService.mutations.updateUser({
        id: user.id,
        push_token: token,
        operating_system: OS,
        os_version: Version ? Version.toString() : null,
      });
    } catch (error) {
      console.warn('Error saving device information: ', error);
    }
  };

  const onNotificationOpened = async notification => {
    try {
      const {
        notification: {
          request: {
            content: { data, title, body },
          },
        },
      } = notification;

      let routeInfo = null;

      if (Platform.OS === 'ios') {
        const { body: notificationData } = data;

        ({ routeInfo } = notificationData);
      } else {
        ({ routeInfo } = data);
      }

      await logEvent({
        message: `Notification Opened: ${JSON.stringify({
          title,
          body,
          routeInfo,
        })}`,
        eventType: EVENT_TYPES.INFO,
        appRegion: APP_REGIONS.NOTIFICATION,
      });

      if (routeInfo) {
        routeDeepLink(routeInfo);
      }
    } catch (error) {
      console.log('Error processing incoming notification: ', error);
    }
  };

  const routeDeepLink = async routeInfo => {
    try {
      console.log('ROUTING DEEP LINK...');

      const { routeName, routeParams, routeKey } = routeInfo;
      const options = {};

      if (!routeName) {
        return;
      }

      options.routeName = routeName;

      if (routeParams) {
        options.params = routeParams;
      }

      if (routeKey) {
        options.key = routeKey;
      }

      if (appNavigator) {
        appNavigator.dispatch(NavigationActions.navigate(options));
      }
    } catch (error) {
      console.warn('Error processing notification for deep link: ', error);

      await logEvent({
        message: `Error processing notification link: ${JSON.stringify(error)}`,
        eventType: EVENT_TYPES.ERROR,
        appRegion: APP_REGIONS.NOTIFICATION,
      });
    }
  };

  const getUserNotificationCount = async () => {
    try {
      const { count } = await notificationService.queries.getUserNotificationCount(user.id);
      const { count: requestedClientCount } = await userService.queries.requestedClientNotSeenCount(user.id);

      setClientRequestCount(requestedClientCount);
      setNotificationCount(count || 0);
      Notifications.setBadgeCountAsync(count || 0);
    } catch (error) {
      console.log('Error getting user notification count: ', error);
    }
  };

  return null;
};

export default PushNotificationHandler;
