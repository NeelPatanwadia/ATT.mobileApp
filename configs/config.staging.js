import { publishDate } from './publishDate';

const config = {
  notificationEndpoint: 'https://3hyb8g9k83.execute-api.us-west-2.amazonaws.com/staging/notification',
  env: 'staging',
  listingAgentDefaultPhone: '5416781534',
  loggingEndpoint: 'https://ysb5l9yg17.execute-api.us-west-2.amazonaws.com/log',
  logLevel: 'INFO',
  experienceId: '@abouttimetours/abouttimetours-mobileapp',
  region: 'us-west-2',
  listingMediaBucket: 'listhub-integration-bucket-staging',
  publishDate,
  zendesk: {
    url: 'https://abouttimetours.zendesk.com/api/v2/requests.json',
    user: 'chris.mergenthaler@abouttimetours.com/token',
    token: '675IlQCw9JQerznzKNGVqIrdClq23IT98bsFHivf',
  },
};

export default config;
