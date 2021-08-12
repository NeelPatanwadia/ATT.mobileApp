import { publishDate } from './publishDate';

const config = {
  notificationEndpoint: 'https://********.execute-api.us-west-2.amazonaws.com/<YOUR_ENV>/notification',
  env: '<YOUR_ENV>',
  listingAgentDefaultPhone: '<YOUR_PHONE_NUMBER>',
  publicServiceEndpoint: 'https://*******.execute-api.us-west-2.amazonaws.com/<YOUR_ENV>',
  logLevel: 'INFO',
  experienceId: '@<YOUR_EXPO_ACCOUNT>/abouttimetours-mobileapp',
  region: 'us-west-2',
  listingMediaBucket: 'listhub-integration-bucket-<YOUR_ENVIRONMENT>',
  publishDate,
  zendesk: {
    url: 'https://abouttimetours.zendesk.com/api/v2/requests.json',
    user: 'chris.mergenthaler@abouttimetours.com/token',
    token: '675IlQCw9JQerznzKNGVqIrdClq23IT98bsFHivf',
  },
  reactAppUpdateRecurringSubscription:
    'https://*******.execute-api.us-west-2.amazonaws.com/<YOUR_ENV>/att/updateRecurringSubscription',
  reactAppStripeCancelSubscription:
    'https://*******.execute-api.us-west-2.amazonaws.com/<YOUR_ENV>/att/cancelSubscription',
  reactAppStripeInvoiceList:
    'https://*******.execute-api.us-west-2.amazonaws.com/<YOUR_ENV>/att/getSubscriptionInvoicesList',
};

export default config;
