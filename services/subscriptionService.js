import { Auth } from 'aws-amplify';
import { executeMutation, executeQuery } from '../helpers/apiHelpers';
import { getSubscriptionStatus as gqlGetSubscriptionStatus } from '../src/graphql/queries';

import { createSubscription as gqlCreateSubscription } from '../src/graphql/mutations';
import config from '../configs/config';

export const getSubscriptionStatus = async userId =>
  executeQuery({
    query: gqlGetSubscriptionStatus,
    params: { user_id: userId },
    fieldName: 'getSubscriptionStatus',
    isList: false,
    errorPrefix: `Error Getting Subscription Status: ${userId}: `,
  });

export const queries = {
  getSubscriptionStatus,
};

export const createSubscription = async ({ userId, purchaseState, receipt, platform, productId, isRestore }) =>
  executeMutation({
    mutation: gqlCreateSubscription,
    params: {
      userId,
      purchaseState,
      receipt,
      platform,
      productId,
      isRestore,
    },
    inputName: 'createSubscriptionInput',
    fieldName: 'createSubscription',
    isList: false,
    errorPrefix: `Error Creating Subscription for user: ${userId}: `,
  });

export const updateRecurringSubscription = async subId => {
  try {
    const sessionToken = `Bearer ${(await Auth.currentSession()).getIdToken().jwtToken}`;

    const payload = {
      subId,
    };

    return fetch(`${config.reactAppUpdateRecurringSubscription}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: sessionToken,
      },
      body: JSON.stringify({ payload }),
    }).then(result => result.json());
  } catch (err) {
    console.log(err);

    return { response: 'Expired' };
  }
};

export const cancelSubscription = async subscriptionId => {
  try {
    const sessionToken = `Bearer ${(await Auth.currentSession()).getIdToken().jwtToken}`;
    const payload = { subId: subscriptionId };

    return fetch(config.reactAppStripeCancelSubscription, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: sessionToken,
      },
      body: JSON.stringify({ payload }),
    }).then(result => result.json());
  } catch (error) {
    console.log(error);

    return { response: 'Error' };
  }
};

export const getInvoiceList = async userId => {
  try {
    const sessionToken = `Bearer ${(await Auth.currentSession()).getIdToken().jwtToken}`;

    return fetch(`${config.reactAppStripeInvoiceList}/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: sessionToken,
      },
    }).then(result => result.json());
  } catch (err) {
    console.log(err);
  }
};

export const mutations = {
  createSubscription,
};

const tourService = {
  queries,
  mutations,
};

export default tourService;
