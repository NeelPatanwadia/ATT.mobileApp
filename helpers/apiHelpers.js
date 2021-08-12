import { API } from 'aws-amplify';
import { snakeKeys, camelKeys } from './caseHelpers';
import { EVENT_TYPES, APP_REGIONS, logEvent } from './logHelper';

export const executeQuery = async ({ query, params, fieldName, isList, errorPrefix, usesDynamo, isPublic }) => {
  try {
    const formattedParams = snakeKeys(params);

    const { data } = await API.graphql({
      query,
      variables: formattedParams,
      authMode: isPublic ? 'API_KEY' : 'AMAZON_COGNITO_USER_POOLS',
    });

    let result = data[fieldName];

    if (!result) {
      return result;
    }

    if (usesDynamo) {
      result = result.items;
    }

    if (isList) {
      return result.map(res => camelKeys(res));
    }

    return camelKeys(result);
  } catch (error) {
    logEvent({
      message: `${errorPrefix}${JSON.stringify(error)}`,
      appRegion: APP_REGIONS.API,
      eventType: EVENT_TYPES.ERROR,
    });
    throw error;
  }
};

export const executeMutation = async ({
  mutation,
  params,
  inputName,
  fieldName,
  isList,
  errorPrefix,
  dontSnake,
  isPublic,
}) => {
  try {
    let formattedParams;

    if (dontSnake) {
      formattedParams = params;
    } else {
      formattedParams = inputName ? { [inputName]: snakeKeys(params) } : snakeKeys(params);
    }

    console.log('FORMATTED MUTATION PARAMS: ', formattedParams);

    const { data } = await API.graphql({
      query: mutation,
      variables: formattedParams,
      authMode: isPublic ? 'API_KEY' : 'AMAZON_COGNITO_USER_POOLS',
    });

    const result = data[fieldName];

    if (isList) {
      return result.map(res => camelKeys(res));
    }

    return camelKeys(result);
  } catch (error) {
    logEvent({
      message: `${errorPrefix}${JSON.stringify(error)}`,
      appRegion: APP_REGIONS.API,
      eventType: EVENT_TYPES.ERROR,
    });
    throw error;
  }
};
