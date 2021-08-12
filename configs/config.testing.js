import { publishDate } from './publishDate';

const config = {
  notificationEndpoint: 'https://pbt0uvy25k.execute-api.us-west-2.amazonaws.com/testing/notification',
  env: 'testing',
  listingAgentDefaultPhone: '5412759786',
  publicServiceEndpoint: 'https://qzj0b3cqo1.execute-api.us-west-2.amazonaws.com/testing',
  logLevel: 'INFO',
  experienceId: '@abouttimetours/abouttimetours-mobileapp',
  region: 'us-west-2',
  listingMediaBucket: 'listhub-integration-bucket-testing',
  publishDate,
  zendesk: {
    url: 'https://abouttimetours.zendesk.com/api/v2/requests.json',
    user: 'chris.mergenthaler@abouttimetours.com/token',
    token: '675IlQCw9JQerznzKNGVqIrdClq23IT98bsFHivf',
  },
};

export default config;
