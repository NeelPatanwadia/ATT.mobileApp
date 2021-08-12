const { SES, SSM } = require('aws-sdk');

const ses = new SES();
const ssm = new SSM();

exports.sendInviteEmail = async (user, agent) => {
  const { senderEmail, appStore, playStore } = await getParameters();
  
  const agentName = `${agent.first_name} ${agent.last_name}`;
  const clientName = `${user.first_name} ${user.last_name}`;

  const params = {
    Destination: {
      ToAddresses: [user.email_address],
      CcAddresses: [agent.email_address],
    },
    Template: 'ClientInvite',
    TemplateData: `{ "AgentName": "${agentName}", "ClientName": "${clientName}", "Brokerage": "${agent.brokerage}", "AppStoreLink": "${appStore}", "PlayStoreLink": "${playStore}" }`,
    Source: senderEmail,
  };

  const sendResult = await ses.sendTemplatedEmail(params).promise();

  console.log('SEND RESULT: ', sendResult);
};

async function getParameters() {
  const ssmParams = {
    Names: [
      `/AboutTimeTours/${process.env.ENV}/SES/senderEmail`,
      `/AboutTimeTours/${process.env.ENV}/download/appStore`,
      `/AboutTimeTours/${process.env.ENV}/download/playStore`,
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
