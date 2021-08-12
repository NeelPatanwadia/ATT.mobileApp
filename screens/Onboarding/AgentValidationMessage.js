import React from 'react';
import { tw } from 'react-native-tailwindcss';
import { BodyText } from '../../components';

const AgentValidationMessage = ({ validated, lockedOut }) => {
  let validationMessage = '';

  if (lockedOut) {
    validationMessage = `We're sorry, we were unable to verify your information. If you have questions, please contact us at support@abouttimetours.com`;
  }

  if (!lockedOut && !validated) {
    validationMessage = `Thanks for visiting us again! We are in the process of validating your agent credentials.  Once this is compete, you'll receive an email letting you know you can login and begin saving time!`;
  }

  return (
    <>
      <BodyText style={[tw.textLg, tw.textCenter, tw.mB8]}>{validationMessage}</BodyText>
    </>
  );
};

export default AgentValidationMessage;
