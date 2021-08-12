const DBHelper = require('./DBHelper');
const { CognitoIdentityServiceProvider } = require('aws-sdk');
const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();

exports.handler = async event => {
  try {
    const { id } = event.arguments || {};
    
    if(!id) {
      console.error("Invalid Id Provided");
      throw new Error("Invalid Id Provided");
    }
    
    console.log("Approving user: ", id);

    const user = await approveAndGetUserById(id);

    if (!user) {
      throw new Error(`Could not approve and update user with id: ${id} user not found`);
    }

    const { cognito_sub: sub } = user;

    if (sub) {
      await addUserToAgentsGroup(sub);
    }

    return user;
  } catch (error) {
    console.error('Error approving agent: ', error);
    throw error;
  }
};

const approveAndGetUserById = async id => {
  await DBHelper.executeQuery('UPDATE user SET validated = true, locked_out = false, updated_at = UNIX_TIMESTAMP() WHERE id = :id', { id });

  const { records } = await DBHelper.executeQuery("SELECT * FROM user WHERE id = :id", { id });

  if (Array.isArray(records) && records.length > 0) {
    return records[0];
  }

  return null;
};

const addUserToAgentsGroup = async sub => {
  console.log("Adding user to Agents group: ", sub);

  const params = {
    GroupName: "Agents",
    UserPoolId: process.env.USERPOOL,
    Username: sub,
  };
  
  await cognitoIdentityServiceProvider
    .adminAddUserToGroup(params)
    .promise();
};
