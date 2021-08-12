import { executeMutation, executeQuery } from '../helpers/apiHelpers';
import {
  getListOfChatsByPropertyIdAndListingAgentId as gqlGetListOfChatsByPropertyIdAndListingAgentId,
  getNewReceivedChatByUserId as gqlGetNewReceivedChatByUserId,
} from '../src/graphql/queries';
import { chatSendMessage as gqlChatSendMessage, chatGetMessages as gqlChatGetMessages } from '../src/graphql/mutations';

const getListOfChatsByPropertyIdAndListingAgentId = async ({ listingAgentId, propertyListingId, userId }) =>
  executeQuery({
    query: gqlGetListOfChatsByPropertyIdAndListingAgentId,
    params: { listingAgentId, propertyListingId, userId },
    fieldName: 'getListOfChatsByPropertyIdAndListingAgentId',
    isList: true,
    errorPrefix: `Error listing chats for listing agent: ${listingAgentId}: `,
  });

const getNewReceivedChatByUserId = async ({ userId }) =>
  executeQuery({
    query: gqlGetNewReceivedChatByUserId,
    params: { userId },
    fieldName: 'getNewReceivedChatByUserId',
    isList: true,
    errorPrefix: `Error getting list of new chats for user: ${userId}: `,
  });

export const queries = { getListOfChatsByPropertyIdAndListingAgentId, getNewReceivedChatByUserId };

export const chatGetMessages = async ({ listingAgentId, propertyListingId, buyingAgentId, clientId, chatId, userId }) =>
  executeMutation({
    mutation: gqlChatGetMessages,
    params: {
      listingAgentId,
      propertyListingId,
      buyingAgentId,
      clientId,
      chatId,
      userId,
    },
    inputName: 'chatGetMessagesInput',
    fieldName: 'chatGetMessages',
    isList: true,
    errorPrefix: `Error getting chat messages for chat for property: ${propertyListingId}: `,
  });

export const chatSendMessage = async ({
  message,
  senderId,
  receiverId,
  senderName,
  sendTime,
  chatId,
  clientId,
  buyingAgentId,
  chatTitle,
  listingAgentId,
  propertyListingId,
}) =>
  executeMutation({
    mutation: gqlChatSendMessage,
    params: {
      message,
      senderId,
      receiverId,
      senderName,
      sendTime,
      chatId,
      clientId,
      buyingAgentId,
      chatTitle,
      listingAgentId,
      propertyListingId,
    },
    inputName: 'chatSendMessageInput',
    fieldName: 'chatSendMessage',
    errorPrefix: `Error sending chat messages for chat: ${chatId}`,
  });

export const mutations = { chatGetMessages, chatSendMessage };

const chatService = {
  queries,
  mutations,
};

export default chatService;
