import { publishDate } from './publishDate';

const config = {
  notificationEndpoint: '',
  env: 'production',
  logLevel: 'INFO',
  experienceId: '@abouttimetours/abouttimetours-mobileapp',
  region: 'us-west-2',
  listingMediaBucket: 'listhub-integration-bucket-production',
  publishDate,
  zendesk: {
    url: 'https://abouttimetours.zendesk.com/api/v2/requests.json',
    user: 'chris.mergenthaler@abouttimetours.com/token',
    token: '675IlQCw9JQerznzKNGVqIrdClq23IT98bsFHivf',
  },
};

export default config;
