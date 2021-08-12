import { executeMutation, executeQuery } from '../helpers/apiHelpers';
import {
  getTour as gqlGetTour,
  getTourStop as gqlGetTourStop,
  listTours as gqlListTours,
  listTourStops as gqlListTourStops,
  getTourStopOfCompletedTour as gqlListTourStopOfCompletedTour,
  listTourStopsOfDeletedPropertyOfInterest as gqlListTourStopsOfDeletedPropertyOfInterest,
  getPropertyListing as gqlGetPropertyListingAutoApprove,
} from '../src/graphql/queries';

import {
  batchUpdateTourStops as gqlBatchUpdateTourStops,
  createTour as gqlCreateTour,
  deleteTour as gqldeleteTour,
  deleteTourStopByTourIdOrPropertyOfInterestId as gqlDeleteTourStopByTourIdOrPropertyOfInterestId,
  deleteMessageByTourId as gqldeleteMessageByTourId,
  deleteTourStop as gqlDeleteTourStop,
  optimizeTourStops as gqlOptimizeTourStops,
  updateTour as gqlUpdateTour,
  updateTourStop as gqlUpdateTourStop,
  updateTourStopRequestStatus as gqlUpdateTourStopRequestStatus,
} from '../src/graphql/mutations';

export const getTour = async tourId =>
  executeQuery({
    query: gqlGetTour,
    params: { id: tourId },
    fieldName: 'getTour',
    isList: false,
    errorPrefix: `Error Getting Tour: ${tourId}: `,
  });

export const getTourStop = async tourStopId =>
  executeQuery({
    query: gqlGetTourStop,
    params: { id: tourStopId },
    fieldName: 'getTourStop',
    isList: false,
    errorPrefix: `Error Getting Tour Stop: ${tourStopId}: `,
  });

export const listTours = async ({ agentId, clientId }) =>
  executeQuery({
    query: gqlListTours,
    params: { agent_id: agentId, client_id: clientId },
    fieldName: 'listTours',
    isList: true,
    errorPrefix: `Error Listing Tours for Agent: ${agentId}, Client: ${clientId}: `,
  });

export const listTourStops = async tourId =>
  executeQuery({
    query: gqlListTourStops,
    params: { tour_id: tourId },
    fieldName: 'listTourStops',
    isList: true,
    errorPrefix: `Error Getting Tour Stops for Tour: ${tourId}: `,
  });

export const listTourStopsOfDeletedPropertyOfInterest = async ({ tourId, tourStopId }) =>
  executeQuery({
    query: gqlListTourStopsOfDeletedPropertyOfInterest,
    params: { tour_id: tourId, tour_stop_id: tourStopId },
    fieldName: 'listTourStopsOfDeletedPropertyOfInterest',
    isList: true,
    errorPrefix: `Error Getting Deleted Tour Stops for Tour: ${tourId}: `,
  });

export const getPropertyListingAutoApprove = async id =>
  executeQuery({
    query: gqlGetPropertyListingAutoApprove,
    params: { id },
    fieldName: 'getPropertyListing',
    isList: false,
    errorPrefix: `Error Getting Auto approve status of property with id: ${id}: `,
  });

export const getTourStopOfCompletedTour = async tourId =>
  executeQuery({
    query: gqlListTourStopOfCompletedTour,
    params: { tour_id: tourId },
    fieldName: 'getTourStopOfCompletedTour',
    isList: false,
    errorPrefix: `Error Getting Tour Stop of completed tour: ${tourId}: `,
  });

export const queries = {
  getTour,
  getTourStop,
  listTours,
  listTourStops,
  getTourStopOfCompletedTour,
  listTourStopsOfDeletedPropertyOfInterest,
  getPropertyListingAutoApprove,
};

export const batchUpdateTourStops = async (tourId, propertiesOfInterest) =>
  executeMutation({
    mutation: gqlBatchUpdateTourStops,
    params: {
      tour_id: tourId,
      properties_of_interest: propertiesOfInterest,
    },
    inputName: 'batchUpdateTourStopsInput',
    fieldName: 'batchUpdateTourStops',
    isList: true,
    errorPrefix: `Error Updating Tour Stops Batch for Tour: ${tourId}: `,
  });

export const createTour = async tour =>
  executeMutation({
    mutation: gqlCreateTour,
    params: tour,
    inputName: 'createTourInput',
    fieldName: 'createTour',
    isList: false,
    errorPrefix: `Error Creating Tour: `,
  });

const deleteTour = async tourId =>
  executeMutation({
    mutation: gqldeleteTour,
    params: { tour_id: tourId },
    fieldName: 'deleteTour',
    isList: false,
    errorPrefix: `Error Deleting Tour : ${tourId} `,
  });

const deleteTourStopByTourIdOrPropertyOfInterestId = async ({ tourId, propertyOfInterestId }) =>
  executeMutation({
    mutation: gqlDeleteTourStopByTourIdOrPropertyOfInterestId,
    params: { tour_id: tourId, property_of_interest_id: propertyOfInterestId },
    fieldName: 'deleteTourStopByTourIdOrPropertyOfInterestId',
    isList: false,
    errorPrefix: `Error Deleting Tour Stop: ${tourId} `,
  });

const deleteMessageByTourId = async tourId =>
  executeMutation({
    mutation: gqldeleteMessageByTourId,
    params: { tour_id: tourId, tour_stop_id: tourId },
    fieldName: 'deleteMessageByTourId',
    isList: false,
    errorPrefix: `Error Deleting Message: ${tourId} `,
  });

export const deleteTourAndReferences = async tourId => {
  let response;

  await deleteMessageByTourId(tourId)
    .then(async res => {
      await deleteTourStopByTourIdOrPropertyOfInterestId({ tourId: res.tourId })
        .then(async resTourStop => {
          await deleteTour(resTourStop.tourId)
            .then(resTour => {
              response = resTour;
            })
            .catch(error => {
              response = error;
            });
        })
        .catch(error => {
          response = error;
        });
    })
    .catch(error => {
      response = error;
    });

  return response;
};

export const deleteTourStop = async id =>
  executeMutation({
    mutation: gqlDeleteTourStop,
    params: {
      id,
    },
    fieldName: 'deleteTourStop',
    isList: false,
    errorPrefix: `Error Deleting Tour Stop: ${id} `,
  });

export const optimizeTourStops = async (optimizeTourStopsInput, tourId) =>
  executeMutation({
    mutation: gqlOptimizeTourStops,
    params: optimizeTourStopsInput,
    inputName: 'optimizeTourStopsInput',
    fieldName: 'optimizeTourStops',
    isList: true,
    errorPrefix: `Error Optimizing Tour Stops for Tour: ${tourId} `,
  });

export const updateTour = async tour =>
  executeMutation({
    mutation: gqlUpdateTour,
    params: tour,
    inputName: 'updateTourInput',
    fieldName: 'updateTour',
    isList: false,
    errorPrefix: `Error Updating Tour: ${tour.id} `,
  });

export const updateTourStop = async tourStop =>
  executeMutation({
    mutation: gqlUpdateTourStop,
    params: tourStop,
    inputName: 'updateTourStopInput',
    fieldName: 'updateTourStop',
    isList: false,
    errorPrefix: `Error Updating Tour Stop: ${tourStop.id} `,
  });

export const updateTourStopRequestStatus = async tourStopInput =>
  executeMutation({
    mutation: gqlUpdateTourStopRequestStatus,
    params: tourStopInput,
    inputName: 'updateTourStopRequestStatusInput',
    fieldName: 'updateTourStopRequestStatus',
    isList: false,
    errorPrefix: `Error Updating Tour Stop Request Status: ${tourStopInput.id} `,
  });

export const mutations = {
  batchUpdateTourStops,
  createTour,
  deleteTourAndReferences,
  deleteTourStop,
  optimizeTourStops,
  updateTour,
  updateTourStop,
  updateTourStopRequestStatus,
  deleteMessageByTourId,
  deleteTourStopByTourIdOrPropertyOfInterestId,
};

const tourService = {
  queries,
  mutations,
};

export default tourService;
