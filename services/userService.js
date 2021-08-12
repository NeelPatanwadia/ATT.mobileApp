import { executeMutation, executeQuery } from '../helpers/apiHelpers';
import {
  getUser as gqlGetUser,
  listAgents as gqlListAgents,
  listClients as gqlListClients,
  listClientsIncludeRequested as gqlListClientsIncludeRequested,
  requestedClientNotSeenCount as gqlRequestedClientNotSeenCount,
} from '../src/graphql/queries';

import {
  createAndInviteClient as gqlCreateAndInviteClient,
  createUserIfNotExists as gqlCreateUserIfNotExists,
  updateUser as gqlUpdateUser,
  unassociateClientFromAgent as gqlUnassociateClientFromAgent,
} from '../src/graphql/mutations';

export const getUser = async userId =>
  executeQuery({
    query: gqlGetUser,
    params: { id: userId },
    fieldName: 'getUser',
    isList: false,
    errorPrefix: `Error Getting User: ${userId}: `,
  });

export const listAgents = async searchKey =>
  executeQuery({
    query: gqlListAgents,
    params: { search_key: searchKey },
    fieldName: 'listAgents',
    isList: true,
    errorPrefix: `Error Listing Agents with Search Term: ${searchKey}: `,
  });

export const listClients = async agentId =>
  executeQuery({
    query: gqlListClients,
    params: { agent_id: agentId },
    fieldName: 'listClients',
    isList: true,
    errorPrefix: `Error Listing Clients for Agent: ${agentId}: `,
  });

export const listClientsIncludeRequested = async agentId =>
  executeQuery({
    query: gqlListClientsIncludeRequested,
    params: { agent_id: agentId },
    fieldName: 'listClientsIncludeRequested',
    isList: true,
    errorPrefix: `Error Listing Clients for Agent: ${agentId}: `,
  });

export const requestedClientNotSeenCount = async agentId =>
  executeQuery({
    query: gqlRequestedClientNotSeenCount,
    params: { agent_id: agentId },
    fieldName: 'requestedClientNotSeenCount',
    isList: false,
    errorPrefix: `Error getting count for Agent: ${agentId}: `,
  });

export const queries = { getUser, listClients, listAgents, listClientsIncludeRequested, requestedClientNotSeenCount };

export const createAndInviteClient = async user =>
  executeMutation({
    mutation: gqlCreateAndInviteClient,
    params: user,
    inputName: 'createAndInviteClientInput',
    fieldName: 'createAndInviteClient',
    isList: false,
    errorPrefix: `Error Creating User if Not Exists: `,
  });

export const createUserIfNotExists = async user =>
  executeMutation({
    mutation: gqlCreateUserIfNotExists,
    params: user,
    inputName: 'createUserIfNotExistsInput',
    fieldName: 'createUserIfNotExists',
    isList: false,
    errorPrefix: `Error Creating User if Not Exists: `,
  });

export const updateUser = async user =>
  executeMutation({
    mutation: gqlUpdateUser,
    params: user,
    inputName: 'updateUserInput',
    fieldName: 'updateUser',
    isList: false,
    errorPrefix: `Error Updating User: ${user.id}: `,
  });

export const unassociateClientFromAgent = async userId =>
  executeMutation({
    mutation: gqlUnassociateClientFromAgent,
    params: { user_id: userId },
    fieldName: 'unassociateClientFromAgent',
    isList: false,
    errorPrefix: `Error Unassociating Client from Agent: ${userId}: `,
  });

export const mutations = {
  createAndInviteClient,
  createUserIfNotExists,
  updateUser,
  unassociateClientFromAgent,
};

const userService = {
  queries,
  mutations,
};

export default userService;
