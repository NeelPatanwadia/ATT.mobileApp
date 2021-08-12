import { executeMutation, executeQuery } from '../helpers/apiHelpers';
import {
  getPropertyOfInterest as gqlGetPropertyOfInterest,
  getPropertyListing as gqlGetPropertyListing,
  getPropertyOfInterestByListingKey as gqlGetPropertyOfInterestByListingKey,
  getPropertyOfInterestByPropertyListingId as gqlGetPropertyOfInterestByPropertyListingId,
  getPropertyListingByListingKey as gqlGetPropertyListingByListingKey,
  getPropertyListingFullDetails as gqlGetPropertyListingFullDetails,
  getListingByListingId as gqlGetLisitngByListingId,
  listListingsByListingAgentEmail as gqlListListingsByListingAgentEmail,
  listPropertiesOfInterest as gqlListPropertiesOfInterest,
  listLastVisitedPropertiesOfInterest as gqlListLastVisitedPropertiesOfInterest,
  listPropertyListings as gqlListPropertyListings,
  listCustomPropertyListings as gqlListCustomPropertyListings,
  listPropertyListingImages as gqlListPropertyListingImages,
  listPropertyOfInterestImages as gqlListPropertyOfInterestImages,
  getPropertiesOfInterestNotSeenCount as gqlGetPropertiesOfInterestNotSeenCount,
  checkIfPropertyOfInterestHasUpcomingTours as gqlCheckIfPropertyOfInterestHasUpcomingTours,
} from '../src/graphql/queries';

import {
  createPropertyRecords as gqlCreatePropertyRecords,
  createPropertyOfInterest as gqlCreatePropertyOfInterest,
  createPropertyOfInterestImage as gqlCreatePropertyOfInterestImage,
  createPropertyListing as gqlCreatePropertyListing,
  createPropertyListingAgentOnlyData as gqlCreatePropertyListingAgentOnlyData,
  createPropertyListingImage as gqlCreatePropertyListingImage,
  updatePropertyOfInterest as gqlUpdatePropertyOfInterest,
  updatePropertyListing as gqlUpdatePropertyListing,
  deletePropertyOfInterstImagesByPropertyOfInterestId as gqlDeletePropertyOfInterstImagesByPropertyOfInterestId,
  deletePropertyOfInterst as gqlDeletePropertyOfInterst,
} from '../src/graphql/mutations';
import { mutations as tours } from './tourService';

/* #region queries */

export const getPropertyOfInterest = async id =>
  executeQuery({
    query: gqlGetPropertyOfInterest,
    params: { id },
    fieldName: 'getPropertyOfInterest',
    isList: false,
    errorPrefix: `Error Getting Property of Interest: ${id}: `,
  });

export const getListingByListingId = async listingId =>
  executeQuery({
    query: gqlGetLisitngByListingId,
    params: { listing_id: listingId },
    fieldName: 'getListingByListingId',
    isList: true,
    errorPrefix: `Error Listing MLS Listings: `,
    usesDynamo: true,
  });

export const listListingsByListingAgentEmail = async listingAgentEmail =>
  executeQuery({
    query: gqlListListingsByListingAgentEmail,
    params: { listing_agent_email: listingAgentEmail },
    fieldName: 'listListingsByListingAgentEmail',
    isList: true,
    errorPrefix: `Error Listing MLS Listings By Email (${listingAgentEmail}): `,
    usesDynamo: true,
  });

export const getPropertyListing = async id =>
  executeQuery({
    query: gqlGetPropertyListing,
    params: { id },
    fieldName: 'getPropertyListing',
    isList: false,
    errorPrefix: `Error Getting Property Listing: ${id}: `,
  });

export const getPropertyListingByListingKey = async listingKey =>
  executeQuery({
    query: gqlGetPropertyListingByListingKey,
    params: { listing_key: listingKey },
    fieldName: 'getPropertyListingByListingKey',
    isList: false,
    errorPrefix: `Error Getting Property Listing for Listing Key: ${listingKey}: `,
  });

export const getPropertyListingFullDetails = async id =>
  executeQuery({
    query: gqlGetPropertyListingFullDetails,
    params: { id },
    fieldName: 'getPropertyListingFullDetails',
    isList: false,
    errorPrefix: `Error Getting Property Listing Full Details for id: ${id}: `,
  });

export const getPropertyOfInterestByListingKey = async ({ clientId, listingKey }) =>
  executeQuery({
    query: gqlGetPropertyOfInterestByListingKey,
    params: { client_id: clientId, listing_key: listingKey },
    fieldName: 'getPropertyOfInterestByListingKey',
    isList: false,
    errorPrefix: `Error Getting Property of Interest for Client: ${clientId}, Listing Key: ${listingKey}: `,
  });

export const getPropertyOfInterestByPropertyListingId = async ({ clientId, propertyListingId }) =>
  executeQuery({
    query: gqlGetPropertyOfInterestByPropertyListingId,
    params: { client_id: clientId, property_listing_id: propertyListingId },
    fieldName: 'getPropertyOfInterestByPropertyListingId',
    isList: false,
    errorPrefix: `Error Getting Property of Interest for Client: ${clientId}, Property Listing Id: ${propertyListingId}: `,
  });

export const listPropertiesOfInterest = async ({ clientId }) =>
  executeQuery({
    query: gqlListPropertiesOfInterest,
    params: { client_id: clientId },
    fieldName: 'listPropertiesOfInterest',
    isList: true,
    errorPrefix: `Error Listing Properties of Interest for Client: ${clientId}: `,
  });

export const listLastvisitedPropertyOfInterest = async ({ clientId }) =>
  executeQuery({
    query: gqlListLastVisitedPropertiesOfInterest,
    params: { client_id: clientId },
    fieldName: 'listLastVisitedPropertiesOfInterest',
    isList: true,
    errorPrefix: `Error Listing Last Visited Properties of Interest for Client: ${clientId}: `,
  });

export const listPropertyOfInterestImages = async propertyOfInterestId =>
  executeQuery({
    query: gqlListPropertyOfInterestImages,
    params: { property_of_interest_id: propertyOfInterestId },
    fieldName: 'listPropertyOfInterestImages',
    isList: true,
    errorPrefix: `Error Listing Property of Interest Images for POI: ${propertyOfInterestId}: `,
  });

export const listPropertyListings = async ({ listingAgentId, sellerId }) =>
  executeQuery({
    query: gqlListPropertyListings,
    params: { listing_agent_id: listingAgentId, seller_id: sellerId },
    fieldName: 'listPropertyListings',
    isList: true,
    errorPrefix: `Error Getting Property Listings for Listing Agent: ${listingAgentId}, Seller: ${sellerId}: `,
  });

export const listCustomPropertyListings = async createdByUserId =>
  executeQuery({
    query: gqlListCustomPropertyListings,
    params: { created_by_user_id: createdByUserId },
    fieldName: 'listCustomPropertyListings',
    isList: true,
    errorPrefix: `Error Getting Custom Property Listings for User: ${createdByUserId}`,
  });

export const listPropertyListingImages = async propertyListingId =>
  executeQuery({
    query: gqlListPropertyListingImages,
    params: { property_listing_id: propertyListingId },
    fieldName: 'listPropertyListingImages',
    isList: true,
    errorPrefix: `Error Listing Property Images for Property Listing: ${propertyListingId}: `,
  });

export const getPropertiesOfInterestNotSeenCount = async clientId =>
  executeQuery({
    query: gqlGetPropertiesOfInterestNotSeenCount,
    params: { client_id: clientId },
    fieldName: 'getPropertiesOfInterestNotSeenCount',
    isList: true,
    errorPrefix: `Error Getting Property of Interest Action Required Count for Buyer: ${clientId}: `,
  });

export const checkIfPropertyOfInterestHasUpcomingTours = async propertyOfInterestId =>
  executeQuery({
    query: gqlCheckIfPropertyOfInterestHasUpcomingTours,
    params: { property_of_interest_id: propertyOfInterestId },
    fieldName: 'checkIfPropertyOfInterestHasUpcomingTours',
    isList: false,
    errorPrefix: `Error Check If Property Of Interest Has Upcoming Tours: ${propertyOfInterestId}: `,
  });

export const queries = {
  getPropertyOfInterest,
  getListingByListingId,
  getPropertyListing,
  getPropertyListingByListingKey,
  getPropertyListingFullDetails,
  getPropertyOfInterestByListingKey,
  getPropertyOfInterestByPropertyListingId,
  listListingsByListingAgentEmail,
  listPropertiesOfInterest,
  listLastvisitedPropertyOfInterest,
  listPropertyListings,
  listCustomPropertyListings,
  listPropertyListingImages,
  listPropertyOfInterestImages,
  getPropertiesOfInterestNotSeenCount,
  checkIfPropertyOfInterestHasUpcomingTours,
};

/* #endregion queries */

// #region mutations

export const createPropertyRecords = async ({ listingId, agentId, clientId, fallbackPhoneNumber }) =>
  executeMutation({
    mutation: gqlCreatePropertyRecords,
    params: {
      listingId,
      clientId,
      agentId,
      fallbackPhoneNumber,
    },
    inputName: 'createPropertyRecordsInput',
    fieldName: 'createPropertyRecords',
    isList: false,
    errorPrefix: `Error Creating Property Records: `,
  });

export const createPropertyOfInterest = async propertyOfInterest =>
  executeMutation({
    mutation: gqlCreatePropertyOfInterest,
    params: propertyOfInterest,
    inputName: 'createPropertyOfInterestInput',
    fieldName: 'createPropertyOfInterest',
    isList: false,
    errorPrefix: `Error Creating Property of Interest: `,
  });

export const createPropertyOfInterestImage = propertyOfInterestImage =>
  executeMutation({
    mutation: gqlCreatePropertyOfInterestImage,
    params: propertyOfInterestImage,
    inputName: 'createPropertyOfInterestImageInput',
    fieldName: 'createPropertyOfInterestImage',
    isList: false,
    errorPrefix: `Error Creating Property of Interest Image: `,
  });

export const createPropertyListing = async propertyListing =>
  executeMutation({
    mutation: gqlCreatePropertyListing,
    params: propertyListing,
    inputName: 'createPropertyListingInput',
    fieldName: 'createPropertyListing',
    isList: false,
    errorPrefix: `Error Creating Property Listing: `,
  });

export const createPropertyListingAgentOnlyData = async propertyListingAgentOnlyData =>
  executeMutation({
    mutation: gqlCreatePropertyListingAgentOnlyData,
    params: propertyListingAgentOnlyData,
    inputName: 'createPropertyListingAgentOnlyDataInput',
    fieldName: 'createPropertyListingAgentOnlyData',
    isList: false,
    errorPrefix: `Error Creating Property Listing: `,
  });

export const createPropertyListingImage = async propertyListingImage =>
  executeMutation({
    mutation: gqlCreatePropertyListingImage,
    params: propertyListingImage,
    inputName: 'createPropertyListingImageInput',
    fieldName: 'createPropertyListingImage',
    isList: false,
    errorPrefix: `Error Creating Property Listing Image: `,
  });

export const updatePropertyOfInterest = async propertyOfInterest =>
  executeMutation({
    mutation: gqlUpdatePropertyOfInterest,
    params: propertyOfInterest,
    inputName: 'updatePropertyOfInterestInput',
    fieldName: 'updatePropertyOfInterest',
    isList: false,
    errorPrefix: `Error Updating Property of Interest: ${propertyOfInterest.id} `,
  });

export const updatePropertyListing = async propertyListing =>
  executeMutation({
    mutation: gqlUpdatePropertyListing,
    params: propertyListing,
    inputName: 'updatePropertyListingInput',
    fieldName: 'updatePropertyListing',
    isList: false,
    errorPrefix: `Error Updating Property Listing: ${propertyListing.id} `,
  });

export const removeSellerFromPropertyListing = async propertyListingId =>
  executeMutation({
    mutation: gqlUpdatePropertyListing,
    params: {
      updatePropertyListingInput: {
        id: propertyListingId,
        seller_id: null,
      },
    },
    inputName: 'updatePropertyListingInput',
    fieldName: 'updatePropertyListing',
    isList: false,
    errorPrefix: `Error Removing Seller from Property Listing: ${propertyListingId} `,
    dontSnake: true,
  });

const deletePropertyOfInterstImagesByPropertyOfInterestId = async propertyOfInterestId =>
  executeMutation({
    mutation: gqlDeletePropertyOfInterstImagesByPropertyOfInterestId,
    params: { property_of_interest_id: propertyOfInterestId },
    fieldName: 'deletePropertyOfInterstImagesByPropertyOfInterestId',
    isList: false,
    errorPrefix: `Error Deleting Tour : ${propertyOfInterestId} `,
  });

const deletePropertyOfInterst = async propertyOfInterestId =>
  executeMutation({
    mutation: gqlDeletePropertyOfInterst,
    params: { property_of_interest_id: propertyOfInterestId },
    fieldName: 'deletePropertyOfInterst',
    isList: false,
    errorPrefix: `Error Deleting Tour : ${propertyOfInterestId} `,
  });

export const deleteHomeOfInterestAndReference = async propertyOfInterestId => {
  let response;

  await tours
    .deleteTourStopByTourIdOrPropertyOfInterestId({ propertyOfInterestId })
    .then(async resTourStop => {
      await deletePropertyOfInterstImagesByPropertyOfInterestId(resTourStop.propertyOfInterestId)
        .then(async resPropertyOfInterestImages => {
          await deletePropertyOfInterst(resPropertyOfInterestImages.propertyOfInterestId)
            .then(resPropertyOfInterest => {
              response = resPropertyOfInterest;
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

export const mutations = {
  createPropertyRecords,
  createPropertyOfInterest,
  createPropertyOfInterestImage,
  createPropertyListing,
  createPropertyListingAgentOnlyData,
  createPropertyListingImage,
  updatePropertyOfInterest,
  updatePropertyListing,
  removeSellerFromPropertyListing,
  deleteHomeOfInterestAndReference,
};

// #endregion mutations

const propertyService = {
  queries,
  mutations,
};

export default propertyService;
