/* Amplify Params - DO NOT EDIT
You can access the following resource attributes as environment variables from your Lambda function
var environment = process.env.ENV
var region = process.env.REGION
var apiAbouttimetoursGraphQLAPIIdOutput = process.env.API_ABOUTTIMETOURS_GRAPHQLAPIIDOUTPUT
var apiAbouttimetoursGraphQLAPIEndpointOutput = process.env.API_ABOUTTIMETOURS_GRAPHQLAPIENDPOINTOUTPUT
var authAbouttimetourse62b2403UserPoolId = process.env.AUTH_ABOUTTIMETOURSE62B2403_USERPOOLID

Amplify Params - DO NOT EDIT */
const AWS = require('aws-sdk');
const ssm = new AWS.SSM();


const getDatabaseParam = async () => {
  const path = `/AboutTimeTours/${process.env.ENV}/database/`;
  return await ssm.getParametersByPath({
    Path: path,
    WithDecryption: true
  }).promise()
  .then(data => {
    const params = {};
    data.Parameters.forEach(param => {
      const name = param.Name.replace(path, '');
      params[name] = param.Value;
    });
    return params;
  });
};

exports.handler = async (event) => {
  const { secret_arn, resource_arn, database_name } = await getDatabaseParam();
  const data = require('data-api-client')({
    secretArn: secret_arn,
    resourceArn: resource_arn,
    database: database_name,
  });
  
  console.log("INPUT: ", event.arguments.batchUpdateTourStopsInput);

  const { tour_id, properties_of_interest } = event.arguments.batchUpdateTourStopsInput;
  const { records: dbTourStops } = await data.query(`SELECT * FROM tourStop where tour_id=${tour_id} AND is_active = true ORDER BY \`order\``);
  const dbTourStopIds = dbTourStops.map(ts => ts.property_of_interest_id);

  const deleted = dbTourStopIds.filter(dbId => !properties_of_interest.find(prop => prop.property_of_interest_id === dbId));
  const updated = dbTourStopIds.filter(dbId => !!properties_of_interest.find(prop => prop.property_of_interest_id === dbId));

  const addedList = properties_of_interest.filter(prop => !dbTourStopIds.includes(prop.property_of_interest_id));
  const added = addedList.map(prop => prop.property_of_interest_id);

  console.log('deleted --->', deleted);
  console.log('updated ---> ', updated);
  console.log('added --->', added);
  
  if ( deleted.length > 0 ) {
    await data.query(`UPDATE tourStop SET is_active = false, updated_at = UNIX_TIMESTAMP() WHERE tour_id=${tour_id} AND property_of_interest_id IN (${deleted.join(',')})`).catch(console.error);
  }

  if ( updated.length > 0 ) {
    await Promise.all(updated.map((updatedId, idx) => {
      console.log(`UPDATE tourStop set \`order\`=${idx + 1}, updated_at = UNIX_TIMESTAMP() WHERE tour_id=${tour_id} and property_of_interest_id=${updatedId} AND is_active = true;`);
      return data.query(`UPDATE tourStop set \`order\`=${idx + 1}, updated_at = UNIX_TIMESTAMP() WHERE tour_id=${tour_id} and property_of_interest_id=${updatedId} and is_active = true;`);
    }));
  }
  
  if ( added.length > 0 ) {
    const addedStr = added.map((propId, idx) => {
      const propOfInterest = properties_of_interest.find(prop => prop.property_of_interest_id === propId);

      return `(${tour_id}, ${propId}, ${idx + updated.length + 1}, ${propOfInterest.is_custom_listing ? "\'approved\'" : null}, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())`;
    }).join(',');
  
    await data.query(`INSERT INTO tourStop (tour_id, property_of_interest_id,\`order\`, status, created_at, updated_at) VALUES ${addedStr}`).catch(console.error);
  }

  const { records: updatedTourStops } = await data.query(`SELECT * FROM tourStop where tour_id=${tour_id}`);

  return updatedTourStops;
};
