const { DynamoDB, SSM } = require('aws-sdk');

const ssm = new SSM();
const dynamo = new DynamoDB.DocumentClient({ convertEmptyValues: true });

module.exports.queryDB = async params => {
  const dynamoContents = [];
  let items;
  let lastEvaluatedKey;

  do {
    items = await dynamo.query(params).promise();

    items.Items.forEach(item => dynamoContents.push(item));

    lastEvaluatedKey = items.LastEvaluatedKey;

    params.ExclusiveStartKey = lastEvaluatedKey;
  } while (typeof lastEvaluatedKey !== 'undefined');

  return { results: dynamoContents };
};

module.exports.getListingTableName = async () => {
  const ssmParams = {
    Name: `/AboutTimeTours/${process.env.ENV}/appsync/apiId`,
    WithDecryption: false,
  };

  const { Parameter: { Value: appSyncId } } = await ssm.getParameter(ssmParams).promise();

  return `Listing-${appSyncId}-${process.env.ENV}`;
};