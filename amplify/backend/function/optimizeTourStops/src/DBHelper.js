const dataApiClient = require('data-api-client');
const { SSM } = require('aws-sdk');

const ssm = new SSM();

let dbClient = null;

exports.executeTransaction = updateQueries =>
  new Promise(async (resolve, reject) => {
    try {
      if (!dbClient) {
        await initDBClient();
      }

      const statement = dbClient.transaction();

      for (const updateQuery of updateQueries) {
        statement.query(updateQuery.sql, updateQuery.params);
      }

      await statement.commit();

      resolve();
    } catch (error) {
      console.log('Error executing transaction: ', error);
      reject(error);
    }
  });

async function initDBClient() {
  const { secret_arn: secretArn, resource_arn: resourceArn, database_name: database } = await getDBParameters();

  dbClient = dataApiClient({
    secretArn,
    resourceArn,
    database,
  });
}

async function getDBParameters() {
  const ssmParams = {
    Names: [
      `/AboutTimeTours/${process.env.ENV}/database/secret_arn`,
      `/AboutTimeTours/${process.env.ENV}/database/resource_arn`,
      `/AboutTimeTours/${process.env.ENV}/database/database_name`,
    ],
    WithDecryption: false,
  };

  const { Parameters } = await ssm.getParameters(ssmParams).promise();

  const result = Parameters.reduce((accum, parameter) => {
    const name = parameter.Name.split('/').pop();

    accum[name] = parameter.Value;

    return accum;
  }, {});

  return result;
}
