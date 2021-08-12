import config from '../configs/config';
import { logEvent, EVENT_TYPES, APP_REGIONS } from '../helpers/logHelper';

export const validateAgent = async agent => {
  const request = {
    user: {
      firstName: agent.firstName,
      lastName: agent.lastName,
      brokerage: agent.brokerage,
      realtorNumber: agent.realtorNumber,
      cellPhone: agent.cellPhone,
      emailAddress: agent.emailAddress,
    },
  };

  try {
    await fetch(`${config.agentValidationEndpoint}/validate`, {
      method: 'POST',
      body: JSON.stringify(request),
    }).then(res => console.log('Validation request sent:', res));
  } catch (error) {
    console.error('Error submitting agent validation request: ', error);
    logEvent({
      message: `Error on validate agent submission: ${JSON.stringify(error)}`,
      appRegion: APP_REGIONS.VALIDATION,
      eventType: EVENT_TYPES.ERROR,
    });

    throw error;
  }
};

const validationService = {
  validateAgent,
};

export default validationService;
