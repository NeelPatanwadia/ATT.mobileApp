const { SSM, S3 } = require('aws-sdk');
const DBHelper = require("./DBHelper");
const { Parser } = require('json2csv');

const ssm = new SSM();
const s3 = new S3({signatureVersion: 'v4'});

exports.handler = async (event) => {
    try {
      let signedUrl;
        const { records } = await getUserReportFromRDS();

        const todaysDate = new Date().toISOString().substring(0, 10);

        const fields = [
          "first_name",
          "last_name",
          "email_address",
          "cell_phone",
          "realtor_number",
          "validated",
          "is_test_account",
          "account_type",
          "has_signed_up",
          "finished_onboarding",
          "operating_system",
          "agent",
        ];

        const json2csvParser = new Parser({fields});
        const csv = json2csvParser.parse(records);

        const { bucketName } = await getParameters();
        const params = {
            Bucket: bucketName,
            Key: `user_reports/${todaysDate}-userReport.csv`,
            Body: csv,
            ContentType: 'text/csv',
            ACL: 'public-read', 
        }

        await s3.putObject(params).promise();
        const url = s3.getSignedUrl('getObject', {Bucket: bucketName, Key: params.Key});

        const response = {
          statusCode: 200,
          body: url
        };

        return response;
    } catch (error) {
        console.error('Error generating a user report: ', error);
        throw error;
    }
};

const getUserReportFromRDS = async () => {
    const userReportSQL = `
        SELECT
            u.first_name,  
            u.last_name, 
            u.email_address, 
            u.cell_phone, 
            u.realtor_number,
            if(u.validated = 1, "Yes", "No") as validated,
            if(u.is_test_account = 1, "Yes", "No") as is_test_account,
            if(u.is_agent = 1, "Agent", "Client") as account_type, 
            if(u.cognito_sub IS NOT NULL, "Yes", "No") as has_signed_up,
            if(u.onboarding_complete = 1, "Yes", "No") as finished_onboarding, 
            u.operating_system, 
            CONCAT(agent.first_name, CONCAT(" ", agent.last_name)) as agent
        from user u 
        left join user agent on u.agent_id = agent.id;
    `;

    const data = await DBHelper.executeQuery(userReportSQL);
    return data;
}

const getParameters = async () => {
    const ssmParams = {
        Names: [
          `/AboutTimeTours/${process.env.ENV}/s3/bucketName`,
        ],
        WithDecryption: true,
      };
    
      const { Parameters } = await ssm.getParameters(ssmParams).promise();
    
      const result = Parameters.reduce((accum, parameter) => {
        const name = parameter.Name.split('/').pop();
    
        accum[name] = parameter.Value;
    
        return accum;
      }, {});
    
      return result;
}