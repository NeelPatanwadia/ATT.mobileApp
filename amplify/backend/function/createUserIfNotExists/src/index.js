const DBHelper = require("./DBHelper");

exports.handler = async (event) => {
  try {
    console.log("EVENT: ", event);

    const { createUserIfNotExistsInput } = event.arguments || {};

    const {
      cognito_sub: sub,
      cognito_identity: identity,
      email_address: email,
      is_listing_agent: isListingAgent,
      first_name: firstName,
      last_name: lastName,
      cell_phone: cellPhone,
    } = createUserIfNotExistsInput;

    if (!isListingAgent && (!sub || !email || !identity)) {
      throw new Error(
        "cognito_sub, cognito_identity, and email_address for non-listing agents are required"
      );
    } else if (isListingAgent && !email) {
      throw new Error("email_address is required");
    }

    if (!isListingAgent) {
      const existingUser = await checkForExistingUserBySub(sub);

      if (existingUser) {
        console.log("USER ALREADY EXISTS");

        existingUser.active_tour = await getActiveTour(
          existingUser.id,
          existingUser.is_agent
        );
        return existingUser;
      }

      const invitedUser = await checkForInvitedUser(email);

      if (invitedUser) {
        console.log("USER WAS INVITED, UPDATING...");
        const updatedUser = await updateExistingUser(
          invitedUser.id,
          sub,
          identity,
          cellPhone
        );

        updatedUser.active_tour = await getActiveTour(
          updatedUser.id,
          updatedUser.is_agent
        );
        return updatedUser;
      }

      console.log("NEW USER, CREATING...");

      const newUser = await createUser({
        email,
        sub,
        identity,
        firstName: null,
        lastName: null,
        isAgent: false,
        cellPhone: cellPhone || null,
      });

      newUser.active_tour = null;

      return newUser;
    } else {
      const existingUser = await checkForExistingUserByEmail(email);

      if (!existingUser) {
        console.log("LISTING AGENT DOES NOT EXIST, CREATING...");
        return await createUser({
          email,
          sub: null,
          identity: null,
          firstName: firstName || null,
          lastName: lastName || null,
          isAgent: true,
          cellPhone: cellPhone || null,
        });
      }

      if (existingUser.is_agent === false) {
        throw new Error(
          "The listing agent email associated with this listing is in use by a non-agent user"
        );
      }

      console.log("LISTING AGENT ALREADY EXISTS");

      return existingUser;
    }
  } catch (error) {
    console.log("Error processing user: ", error);
    throw error;
  }
};

const checkForExistingUserBySub = async (sub) => {
  const {
    records,
  } = await DBHelper.executeQuery(
    "SELECT * FROM user WHERE cognito_sub = :sub",
    { sub }
  );

  if (Array.isArray(records) && records.length > 0) {
    return records[0];
  }

  return null;
};

const checkForExistingUserByEmail = async (email) => {
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

const checkForInvitedUser = async (email) => {
  const { records } = await DBHelper.executeQuery(
    "SELECT * FROM user WHERE email_address = :email AND cognito_sub IS NULL",
    {
      email,
    }
  );

  if (Array.isArray(records) && records.length > 0) {
    return records[0];
  }

  return null;
};

const updateExistingUser = async (id, sub, identity,cellPhone) => {
  await DBHelper.executeQuery(
    "UPDATE user SET cognito_sub = :sub, cognito_identity = :identity,cell_phone=:cellPhone ,updated_at = :updatedAt WHERE id = :id",
    {
      sub,
      identity,
      updatedAt: Number.parseInt(new Date().getTime(), 10) / 1000,
      cellPhone,
      id,
    }
  );

  const {
    records,
  } = await DBHelper.executeQuery("SELECT * FROM user WHERE id = :id", { id });

  return records[0];
};

const createUser = async ({
  email,
  sub,
  identity,
  isAgent,
  firstName,
  lastName,
  cellPhone,
}) => {
  const now = Number.parseInt(new Date().getTime(), 10) / 1000;

  const sql = `
    INSERT INTO user (email_address, cognito_sub, cognito_identity, is_agent, first_name, last_name, cell_phone, created_at, updated_at) 
    VALUES (:email, :sub, :identity, :isAgent, :firstName, :lastName, :cellPhone, :createdAt, :updatedAt);
  `;

  const { insertId } = await DBHelper.executeQuery(sql, {
    email,
    sub,
    identity,
    isAgent,
    firstName,
    lastName,
    cellPhone,
    createdAt: now,
    updatedAt: now,
  });
  const {
    records,
  } = await DBHelper.executeQuery("SELECT * FROM user WHERE id = :id", {
    id: insertId,
  });

  return records[0];
};

const getActiveTour = async (userId, isAgent) => {
  try {
    let sql = "SELECT  * FROM tour WHERE ";

    if (isAgent) {
      sql += "agent_id ";
    } else {
      sql += "client_id ";
    }

    sql += `= :userId AND status = 'in-progress' ORDER BY id DESC;`;

    const { records } = await DBHelper.executeQuery(sql, { userId });

    if (Array.isArray(records) && records.length > 0) {
      return records[0];
    }

    return null;
  } catch (error) {
    console.log("Error fetching active tour: ", error);

    return null;
  }
};
