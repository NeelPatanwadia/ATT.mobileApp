import { executeMutation, executeQuery } from '../helpers/apiHelpers';
import {
  agentTimeSlotDetails as gqlAgentTimeSlotDetails,
  getTourStopIfExists as gqlGetTourStopIfExists,
} from '../src/graphql/queries';
import {
  addListingAgentAvailbility as gqlAddListingAgentAvailbility,
  updateListingAgentAvailbility as gqlUpdateListingAgentAvailbility,
} from '../src/graphql/mutations';

export const getTourStopIfExists = async ({ propertyListingId, startTime, endTime }) =>
  executeQuery({
    query: gqlGetTourStopIfExists,
    params: {
      property_listing_id: propertyListingId,
      start_time: startTime,
      end_time: endTime,
    },
    fieldName: 'getTourStopIfExists',
    isList: true,
    errorPrefix: `Error Getting Time Slot Details of property listing id: ${propertyListingId}: `,
  });

export const agentTimeSlotDetails = async params =>
  executeQuery({
    query: gqlAgentTimeSlotDetails,
    params,
    fieldName: 'agentTimeSlotDetails',
    isList: true,
    errorPrefix: `Error Getting Agent Time Slot Details Agent of id: ${params.listing_id}: `,
  });

export const queries = { agentTimeSlotDetails, getTourStopIfExists };

/* #endregion queries */

// #region mutations

export const addListingAgentAvailbility = async ({
  listingAgentId,
  propertyListingId,
  startDatetime,
  endDatetime,
  firstSlotId,
  secondSlotId,
  firstSlotStartTime,
  secondSlotEndTime,
}) =>
  executeMutation({
    mutation: gqlAddListingAgentAvailbility,
    params: {
      listingAgentId,
      propertyListingId,
      startDatetime,
      endDatetime,
      firstSlotId,
      secondSlotId,
      firstSlotStartTime,
      secondSlotEndTime,
    },
    inputName: 'addListingAgentAvailbilityInput',
    fieldName: 'addListingAgentAvailbility',
    isList: false,
    errorPrefix: `Error Add Listing Agent Availbility Records: `,
  });

export const updateListingAgentAvailbility = async ({
  id,
  listingAgentId,
  propertyListingId,
  startDatetime,
  endDatetime,
  isActive,
  firstSlotId,
  secondSlotId,
  firstSlotStartTime,
  secondSlotEndTime,
}) =>
  executeMutation({
    mutation: gqlUpdateListingAgentAvailbility,
    params: {
      id,
      listingAgentId,
      propertyListingId,
      startDatetime,
      endDatetime,
      isActive,
      firstSlotId,
      secondSlotId,
      firstSlotStartTime,
      secondSlotEndTime,
    },
    inputName: 'updateListingAgentAvailbilityInput',
    fieldName: 'updateListingAgentAvailbility',
    isList: false,
    errorPrefix: `Error Update Listing Agent Availbility Records: `,
  });

export const mutations = {
  addListingAgentAvailbility,
  updateListingAgentAvailbility,
};

const calendarService = {
  queries,
  mutations,
};

export default calendarService;
