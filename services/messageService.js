import { executeMutation, executeQuery } from '../helpers/apiHelpers';
import { listTourStopMessages as gqlListTourStopMessages } from '../src/graphql/queries';
import { createMessage as gqlCreateMessage } from '../src/graphql/mutations';

export const listTourStopMessages = async tourStopId =>
  executeQuery({
    query: gqlListTourStopMessages,
    params: { tour_stop_id: tourStopId },
    fieldName: 'listTourStopMessages',
    isList: true,
    errorPrefix: `Error Listing Tour Stop Messages for Tour Stop: ${tourStopId}: `,
  });

export const queries = { listTourStopMessages };

export const createMessage = async message =>
  executeMutation({
    mutation: gqlCreateMessage,
    params: message,
    inputName: 'createMessageInput',
    fieldName: 'createMessage',
    isList: false,
    errorPrefix: `Error Creating Message `,
  });

export const mutations = { createMessage };

const messageService = {
  queries,
  mutations,
};

export default messageService;
