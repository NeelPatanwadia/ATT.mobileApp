import { executeQuery } from '../helpers/apiHelpers';
import {
  getShowingActionRequiredCount as gqlGetShowingActionRequiredCount,
  listPropertyShowings as gqlListPropertyShowings,
} from '../src/graphql/queries';

export const getShowingActionRequiredCount = async agentId =>
  executeQuery({
    query: gqlGetShowingActionRequiredCount,
    params: { agent_id: agentId },
    fieldName: 'getShowingActionRequiredCount',
    isList: true,
    errorPrefix: `Error Getting Showing Action Required Count for Agent: ${agentId}: `,
  });

export const listPropertyListingShowings = async propertyListingId =>
  executeQuery({
    query: gqlListPropertyShowings,
    params: { property_listing_id: propertyListingId },
    fieldName: 'listPropertyShowings',
    isList: true,
    errorPrefix: `Error Listing Showings for Property Listing: ${propertyListingId}: `,
  });

export const queries = { getShowingActionRequiredCount, listPropertyListingShowings };

const showingService = {
  queries,
};

export default showingService;
