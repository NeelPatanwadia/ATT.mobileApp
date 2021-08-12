import { Platform } from 'react-native';
import Constants from 'expo-constants';
import authHelper from './authHelper';
import config from '../configs/config';

export const EVENT_TYPES = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
};

export const APP_REGIONS = {
  API: 'API',
  LOCATION: 'LOCATION',
  LIVE_TOUR: 'LIVE_TOUR',
  MLS_PROPERTY: 'MLS_PROPERTY',
  NOTIFICATION: 'NOTIFICATION',
  GQL_SUBSCRIPTION: 'GQL_SUBSCRIPTION',
  AGENT_SUBSCRIPTION: 'AGENT_SUBSCRIPTION',
  AGENT_UI: 'AGENT_UI',
  CLIENT_UI: 'CLIENT_UI',
  IMAGES: 'IMAGES',
  VALIDATION: 'VALIDATION',
  EXPO: 'EXPO',
};

export const logEvent = async ({ message, appRegion, eventType = EVENT_TYPES.DEBUG }) => {
  try {
    if (eventType === EVENT_TYPES.DEBUG) {
      console.log(eventType, appRegion, message);

      return;
    }

    const shouldLog = checkIfShouldLog(eventType);

    if (!shouldLog) {
      return;
    }

    const formattedMessage = await addMetaDataToLog(message, eventType, appRegion);

    console.log('EVENT LOG: ', formattedMessage);

    await fetch(`${config.publicServiceEndpoint}/log`, {
      method: 'POST',
      body: formattedMessage,
    });
  } catch (error) {
    console.error('Well uh oh... there was an error logging an event: ', error);
  }
};

const checkIfShouldLog = eventType => {
  switch (eventType) {
    case EVENT_TYPES.ERROR:
      return true;
    case EVENT_TYPES.WARNING:
      return config.logLevel === EVENT_TYPES.WARNING || config.logLevel === EVENT_TYPES.INFO;
    case EVENT_TYPES.INFO:
      return config.logLevel === EVENT_TYPES.INFO;
    default:
      return false;
  }
};

const addMetaDataToLog = async (message, eventType, appRegion) => {
  const os = Platform.OS;
  const osVersion = Platform.Version;
  const { deviceName, nativeAppVersion, nativeBuildVersion } = Constants;

  let formattedMessage = `${eventType} -- `;

  if (appRegion) {
    formattedMessage += `${appRegion} -- `;
  }

  try {
    const { email, sub } = await authHelper.getUserAttributes();

    formattedMessage += `USER: ${email} ${sub} -- `;
  } catch (error) {
    formattedMessage += `UNKNOWN USER -- `;
  }

  formattedMessage += `${message} \n\nDEVICE NAME: ${deviceName} | OS: ${os} | OS VERSION: ${osVersion} | APP VERSION: ${nativeAppVersion} | BUILD VERSION: ${nativeBuildVersion} | RELEASE DATE: ${config.publishDate}`;

  return formattedMessage;
};
