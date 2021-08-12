import { Auth } from 'aws-amplify';
import config from '../configs/config';
import { executeMutation, executeQuery } from '../helpers/apiHelpers';
import { logEvent, EVENT_TYPES, APP_REGIONS } from '../helpers/logHelper';
import {
  listUserNotifications as gqlListUserNotifications,
  getUserNotificationCount as gqlGetUserNotificationCount,
} from '../src/graphql/queries';

import {
  clearUserNotificationCount as gqlClearUserNotificationCount,
  updateNotification as gqlUpdateNotification,
  removeNotifications as gqlRemoveNotifications,
} from '../src/graphql/mutations';

export const getUserNotificationCount = async userId =>
  executeQuery({
    query: gqlGetUserNotificationCount,
    params: { user_id: userId },
    fieldName: 'getUserNotificationCount',
    isList: false,
    errorPrefix: `Error Getting User Notification Count for User: ${userId}: `,
  });

export const listUserNotifications = async recipientId =>
  executeQuery({
    query: gqlListUserNotifications,
    params: { recipient_id: recipientId },
    fieldName: 'listUserNotifications',
    isList: true,
    errorPrefix: `Error Getting User Notification for User: ${recipientId}: `,
  });

export const queries = { getUserNotificationCount, listUserNotifications };

export const createNotification = async ({
  userId,
  pushMessage,
  title,
  smsMessage,
  email,
  routeName,
  routeParams,
  routeKey,
}) => {
  try {
    const sessionToken = `Bearer ${(await Auth.currentSession()).getIdToken().jwtToken}`;

    const payload = {
      userId,
      title: title || null,
      body: pushMessage,
      smsMessage,
      email,
    };

    if (routeName) {
      const routeInfo = {};

      routeInfo.routeName = routeName;

      if (routeParams) {
        routeInfo.routeParams = routeParams;
      }

      if (routeKey) {
        routeInfo.routeKey = routeKey;
      }

      payload.routeInfo = routeInfo;
    }

    const notificationResponse = await fetch(config.notificationEndpoint, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: sessionToken,
      },
      body: JSON.stringify({ payload }),
    });

    if (notificationResponse.ok) {
      const resultJson = await notificationResponse.json();

      return resultJson;
    }

    const resultText = await notificationResponse.text();

    throw new Error(`Push Notification publish invocation not successful: ${resultText}`);
  } catch (error) {
    logEvent({
      message: `Error creating notification for users: ${JSON.stringify(userId)}: ${error}`,
      appRegion: APP_REGIONS.API,
      eventType: EVENT_TYPES.ERROR,
    });

    throw error;
  }
};

export const clearUserNotificationCount = async userId =>
  executeMutation({
    mutation: gqlClearUserNotificationCount,
    params: { user_id: userId },
    fieldName: 'clearUserNotificationCount',
    isList: false,
    errorPrefix: `Error Clearing Notification Count for User: ${userId} `,
  });

export const removeNotification = async id =>
  executeMutation({
    mutation: gqlUpdateNotification,
    params: { id, is_active: false },
    inputName: 'updateNotificationInput',
    fieldName: 'updateNotification',
    isList: false,
    errorPrefix: `Error Removing Notification: ${id} `,
  });

export const removeAllNotifications = async userId =>
  executeMutation({
    mutation: gqlRemoveNotifications,
    params: { user_id: userId },
    fieldName: 'removeNotifications',
    isList: true,
    errorPrefix: `Error Removing Notifications for User: ${userId} `,
  });

export const mutations = { createNotification, clearUserNotificationCount, removeNotification, removeAllNotifications };

const notificationService = {
  queries,
  mutations,
};

export default notificationService;
