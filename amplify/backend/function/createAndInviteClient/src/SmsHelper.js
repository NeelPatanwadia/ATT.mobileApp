const { SNS, SES, SSM } = require("aws-sdk");

const sns = new SNS();
const ses = new SES();
const ssm = new SSM();

exports.sendInviteSMS = async (user, agent, phoneNumber, isAgent) => {
  try {
    const agentName = `${agent.first_name} ${agent.last_name}`;
    const clientName = `${user.first_name} ${user.last_name}`;
    const formattedPhoneNumber = `+1${phoneNumber.replace(/\D/g, "")}`;
    let clientMessage;
    const { appStore, playStore } = await getParameters();

    if (!isAgent) {
      clientMessage = `Hello ${clientName}, \n ${agentName} from ${agent.brokerage} wants to connect with you on About Time Tours. \n\n(Download the AboutTimeTours app from android playstore : ${playStore} or ios appstore : ${appStore} and create a free account to start planning your property tours).`;
    } else {
      clientMessage = `Hello ${clientName}, \n ${agentName} wants to connect with you on About Time Tours. \n\n(Download the AboutTimeTours app from android playstore : ${playStore} or ios appstore : ${appStore} and create a free account to start planning your property tours).`;
    }
    const smsResult = await sendSMS(formattedPhoneNumber, clientMessage);
    console.log("Sms send Result : ", smsResult);
    return smsResult ? "SMS Sent" : "Error Sending SMS";
  }
  catch (error) {
    console.log("Error sending sms invite to user: ", error);
    throw error;
  }
};

const sendSMS = async (phoneNumber, message) => {
  const messageParams = {
    Message: `${message}`,
    MessageStructure: "raw",
    PhoneNumber: phoneNumber,
    MessageAttributes: {
      "AWS.SNS.SMS.SMSType": {
        DataType: "String",
        StringValue: "Transactional",
      },
    },
  };

  try {
    const data = await sns.publish(messageParams).promise();

    console.log("SMS Send Result: ", data);

    return true;
  } catch (error) {
    console.log("SMS Send Error: ", error);

    return false;
  }
};

async function getParameters() {
  const ssmParams = {
    Names: [
      `/AboutTimeTours/${process.env.ENV}/download/appStore`,
      `/AboutTimeTours/${process.env.ENV}/download/playStore`,
    ],
    WithDecryption: false,
  };

  const { Parameters } = await ssm.getParameters(ssmParams).promise();

  const result = Parameters.reduce((accum, parameter) => {
    const name = parameter.Name.split("/").pop();

    accum[name] = parameter.Value;

    return accum;
  }, {});

  return result;
}
