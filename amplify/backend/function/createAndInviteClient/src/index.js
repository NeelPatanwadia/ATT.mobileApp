//CreateAndInviteClient : Also add functionality for CreateAndInviteAgent
//CreateAndInviteAgent functionality comes in picture after CreateAndInviteClient so, add and update API for CreateAndInviteAgent in same API but have'nt change function name

const DBHelper = require("./DBHelper");
const EmailHelper = require("./EmailHelper");
const SmsHelper = require("./SmsHelper");

exports.handler = async (event) => {
  try {
    console.log("EVENT: ", event);

    const { createAndInviteClientInput } = event.arguments || {};

    const {
      first_name: firstName,
      last_name: lastName,
      email_address: email,
      cell_phone: phone,
      agent_id: agentId,
      is_agent: isAgent,
      client_id: clientId,
    } = createAndInviteClientInput;

    if (!firstName || !lastName || !email || !phone) {
      throw new Error(
        "first_name, last_name, email_address and cell_phone are all required"
      );
    }

    let user = await checkForExistingUser(email);
    let agent;
    if (!user) {
      if (!isAgent) {
        if (agentId) {
          user = await createClientUser(
            firstName,
            lastName,
            email,
            phone,
            agentId
          );
        } else {
          throw new Error("agent_id is required");
        }
      } else {
        if (clientId) {
          user = await createAgentUser(
            firstName,
            lastName,
            email,
            phone,
            clientId
          );
        } else {
          throw new Error("client_id is required");
        }
      }
    } else {
      console.log("A user already exists with email: ", email);

      if (isAgent) {
        await setRequestedAgentId(clientId, user.id);
      }

      if (user.is_agent === true) {
        throw new Error(
          "Error -- A user with this email is already registered as an agent."
        );
      }

      if (user.agent_id && user.agent_id !== agentId) {
        throw new Error(
          "Error -- A user with this email is already connected with another agent."
        );
      }

      if (!isAgent && !user.agent_id) {
        await setAgentId(user.id, agentId);
      }
    }

    if (!isAgent) {
      agent = await getUser(agentId);
    } else {
      agent = await getUser(clientId);
    }

    if (!agent || !user) {
      throw new Error("Could not fetch agent or client details");
    }

    await EmailHelper.sendInviteEmail(user, agent);
    await SmsHelper.sendInviteSMS(user, agent, phone,isAgent);

    return user;
  } catch (error) {
    console.error("Error sending invite to user: ", error);
    throw error;
  }
};

const checkForExistingUser = async (email) => {
  const {
    records,
  } = await DBHelper.executeQuery(
    "SELECT * FROM user WHERE email_address = :email",
    { email }
  );

  if (Array.isArray(records) && records.length > 0) {
    return records[0];
  }

  return null;
};

const createClientUser = async (firstName, lastName, email, phone, agentId) => {
  const now = Number.parseInt(new Date().getTime(), 10) / 1000;
  const sql = `
    INSERT INTO user (first_name, last_name, email_address, cell_phone, agent_id, created_at, updated_at,is_agent) 
    VALUES (:firstName, :lastName, :email, :phone, :agentId, :createdAt, :updatedAt,:isAgent);
  `;

  const { insertId } = await DBHelper.executeQuery(sql, {
    firstName,
    lastName,
    email,
    phone,
    agentId,
    createdAt: now,
    updatedAt: now,
    isAgent: 0,
  });

  const { records } = await DBHelper.executeQuery(
    "SELECT * FROM user WHERE id = :id",
    {
      id: insertId,
    }
  );

  return records[0];
};

const createAgentUser = async (firstName, lastName, email, phone, clientId) => {
  const now = Number.parseInt(new Date().getTime(), 10) / 1000;
  const sql = `
    INSERT INTO user (first_name, last_name, email_address, cell_phone, created_at, updated_at,is_agent) 
    VALUES (:firstName, :lastName, :email, :phone, :createdAt, :updatedAt,:isAgent);
  `;

  const { insertId } = await DBHelper.executeQuery(sql, {
    firstName,
    lastName,
    email,
    phone,
    createdAt: now,
    updatedAt: now,
    isAgent: 1,
  });

  setRequestedAgentId(clientId, insertId);

  const { records } = await DBHelper.executeQuery(
    "SELECT * FROM user WHERE id = :id",
    {
      id: insertId,
    }
  );
  return records[0];
};

const setAgentId = async (userId, agentId) => {
  const now = Number.parseInt(new Date().getTime(), 10) / 1000;
  await DBHelper.executeQuery(
    "UPDATE user SET agent_id = :agentId, updated_at = :updatedAt WHERE id = :userId;",
    { agentId, updatedAt: now, userId }
  );
};

const setRequestedAgentId = async (userId, agentId) => {
  const now = Number.parseInt(new Date().getTime(), 10) / 1000;
  await DBHelper.executeQuery(
    "UPDATE user SET requested_agent_id = :agentId,agent_request_seen=:agentRequestSeen, updated_at = :updatedAt WHERE id = :userId;",
    { agentId, agentRequestSeen: 0, updatedAt: now, userId }
  );
};

const getUser = async (agentId) => {
  const { records } = await DBHelper.executeQuery(
    "SELECT * FROM user WHERE id = :agentId",
    {
      agentId,
    }
  );

  if (Array.isArray(records) && records.length > 0) {
    return records[0];
  }

  return null;
};
