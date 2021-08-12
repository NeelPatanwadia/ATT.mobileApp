import templates from './templates';

const AGENT = 'agent';
const SELLER = 'seller';
const BUYER = 'buyer';

export const buildSendShowingRequest = ({ baName, laName, brokerage, address, date, phone, timeRange }) => {
  let { push, sms, email } = templates.sendShowingRequest[AGENT];

  // Need to duplicate because email is an object and objects are passed by reference in JS
  // If updated directly, the template itself will be updated
  // Because push and SMS are primitives, they get passed by value and don't need to be copied
  const emailCopy = { ...email };

  const tokens = [
    { name: 'BA_NAME', value: baName },
    { name: 'LA_NAME', value: laName },
    { name: 'BROKERAGE', value: brokerage },
    { name: 'ADDRESS', value: address },
    { name: 'DATE', value: date },
    { name: 'PHONE', value: phone },
    { name: 'TIME_RANGE', value: timeRange },
  ];

  push = replaceTokens(push, tokens);
  sms = replaceTokens(sms, tokens);
  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);

  return { push, sms, email: emailCopy };
};

export const buildApproveShowingRequest = ({ name, brokerage, address, date, timeRange }) => {
  let { push, sms, email } = templates.approveShowingRequest[AGENT];

  const emailCopy = { ...email };
  const tokens = [
    { name: 'NAME', value: name },
    { name: 'BROKERAGE', value: brokerage },
    { name: 'ADDRESS', value: address },
    { name: 'DATE', value: date },
    { name: 'TIME_RANGE', value: timeRange },
  ];

  push = replaceTokens(push, tokens);
  sms = replaceTokens(sms, tokens);
  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);

  return { push, sms, email: emailCopy };
};

export const buildSuggestAlternateTime = ({ name, brokerage, address, date, timeRange }) => {
  let { push, sms, email } = templates.suggestAlternateTime[AGENT];

  const emailCopy = { ...email };
  const tokens = [
    { name: 'NAME', value: name },
    { name: 'BROKERAGE', value: brokerage },
    { name: 'ADDRESS', value: address },
    { name: 'DATE', value: date },
    { name: 'TIME_RANGE', value: timeRange },
  ];

  push = replaceTokens(push, tokens);
  sms = replaceTokens(sms, tokens);
  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);

  return { push, sms, email: emailCopy };
};

export const buildShowingRequestComment = ({ name, brokerage, address, date, message }) => {
  let { push } = templates.showingRequestComment[AGENT];

  const tokens = [
    { name: 'NAME', value: name },
    { name: 'BROKERAGE', value: brokerage },
    { name: 'ADDRESS', value: address },
    { name: 'DATE', value: date },
    { name: 'MESSAGE', value: message },
  ];

  push = replaceTokens(push, tokens);

  return { push };
};

export const buildNextOnTour = ({ laName, baName, sellerName, brokerage, address }, forSeller) => {
  const recipient = forSeller ? SELLER : AGENT;

  let { push, sms, email } = templates.nextOnTour[recipient];

  const emailCopy = { ...email };

  const tokens = [
    { name: 'LA_NAME', value: laName },
    { name: 'BA_NAME', value: baName },
    { name: 'SELLER_NAME', value: sellerName },
    { name: 'BROKERAGE', value: brokerage },
    { name: 'ADDRESS', value: address },
  ];

  push = replaceTokens(push, tokens);
  sms = replaceTokens(sms, tokens);
  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);

  return { push, sms, email: emailCopy };
};

export const buildLeftHome = ({ sellerName, address }) => {
  let { push, sms, email } = templates.leftHome[SELLER];

  const emailCopy = { ...email };

  const tokens = [
    { name: 'SELLER_NAME', value: sellerName },
    { name: 'ADDRESS', value: address },
  ];

  push = replaceTokens(push, tokens);
  sms = replaceTokens(sms, tokens);
  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);

  return { push, sms, email: emailCopy };
};

export const buildInterested = ({ laName, baName, brokerage, address, message }) => {
  let { push, sms, email } = templates.interested[AGENT];

  const emailCopy = { ...email };

  const tokens = [
    { name: 'LA_NAME', value: laName },
    { name: 'BA_NAME', value: baName },
    { name: 'BROKERAGE', value: brokerage },
    { name: 'ADDRESS', value: address },
    { name: 'MESSAGE', value: message || `I will contact you when we're done touring.` },
  ];

  push = replaceTokens(push, tokens);
  sms = replaceTokens(sms, tokens);
  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);

  return { push, sms, email: emailCopy };
};

export const buildNotInterested = ({ laName, baName, brokerage, address, message }) => {
  let { push, sms, email } = templates.notInterested[AGENT];

  const emailCopy = { ...email };

  const tokens = [
    { name: 'LA_NAME', value: laName },
    { name: 'BA_NAME', value: baName },
    { name: 'BROKERAGE', value: brokerage },
    { name: 'ADDRESS', value: address },
    { name: 'MESSAGE', value: message || `If you would like further information, please call me.` },
  ];

  push = replaceTokens(push, tokens);
  sms = replaceTokens(sms, tokens);
  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);

  return { push, sms, email: emailCopy };
};

export const buildCustomFeedback = ({ baName, brokerage, address, message }) => {
  let { push, sms, email } = templates.customFeedback[AGENT];

  const emailCopy = { ...email };

  const tokens = [
    { name: 'BA_NAME', value: baName },
    { name: 'BROKERAGE', value: brokerage },
    { name: 'ADDRESS', value: address },
    { name: 'MESSAGE', value: message },
  ];

  push = replaceTokens(push, tokens);
  sms = replaceTokens(sms, tokens);
  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);

  return { push, sms, email: emailCopy };
};

export const buildTourCreated = ({ baName, brokerage, datetime }) => {
  let { push } = templates.tourCreated[BUYER];

  const tokens = [
    { name: 'BA_NAME', value: baName },
    { name: 'BROKERAGE', value: brokerage },
    { name: 'DATETIME', value: datetime },
  ];

  push = replaceTokens(push, tokens);

  return { push };
};

export const buildPropertyOfInterestAdded = ({ baName, brokerage, address }) => {
  let { push } = templates.propertyOfInterestAdded[BUYER];

  const tokens = [
    { name: 'BA_NAME', value: baName },
    { name: 'BROKERAGE', value: brokerage },
    { name: 'ADDRESS', value: address },
  ];

  push = replaceTokens(push, tokens);

  return { push };
};

export const buildCancelShowingRequest = ({ address }) => {
  let { push, sms, email } = templates.cancelShowingRequest[AGENT];

  const emailCopy = { ...email };
  const tokens = [{ name: 'ADDRESS', value: address }];

  push = replaceTokens(push, tokens);
  sms = replaceTokens(sms, tokens);
  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);

  return { push, sms, email: emailCopy };
};

export const buildCreateAndInviteClientRequest = ({ sellerName, agentName, brokerage }) => {
  let { sms, email } = templates.createAndInviteClientRequest[SELLER];

  const emailCopy = { ...email };

  const tokens = [
    { name: 'SELLER_NAME', value: sellerName },
    { name: 'AGENT_NAME', value: agentName },
    { name: 'BROKERAGE', value: brokerage },
  ];

  sms = replaceTokens(sms, tokens);
  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);

  return { sms, email: emailCopy };
};

export const buildCreateAndInviteAgentRequest = ({ sellerName, agentName }) => {
  let { sms, email } = templates.createAndInviteAgentRequest[AGENT];

  const emailCopy = { ...email };

  const tokens = [
    { name: 'SELLER_NAME', value: sellerName },
    { name: 'AGENT_NAME', value: agentName },
  ];

  sms = replaceTokens(sms, tokens);
  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);

  return { sms, email: emailCopy };
};

export const buildEditDeleteLAAvailabilitySlot = ({ laName, baName, address, date, timeRange }) => {
  let { email, sms, push } = templates.editDeleteLAAvailabilitySlot[BUYER];
  const emailCopy = { ...email };
  const tokens = [
    { name: 'LA_NAME', value: laName },
    { name: 'BA_NAME', value: baName },
    { name: 'ADDRESS', value: address },
    { name: 'DATE', value: date },
    { name: 'TIME_RANGE', value: timeRange },
  ];

  sms = replaceTokens(sms, tokens);
  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);
  push = replaceTokens(push, tokens);

  return { sms, email: emailCopy, push };
};

export const buildClientAddedPropertyOfInterest = ({ baName, saName, address }) => {
  let { push, email } = templates.clientAddedPropertyOfInterest[AGENT];

  const emailCopy = { ...email };
  const tokens = [
    { name: 'BA_NAME', value: baName },
    { name: 'SA_NAME', value: saName },
    { name: 'ADDRESS', value: address },
  ];

  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);
  push = replaceTokens(push, tokens);

  return { push, email: emailCopy };
};

export const buildAgentRespondsToClientRequest = ({ baName, clientName, response }) => {
  let { push, email } = templates.agentRespondsToClientRequest[BUYER];

  const emailCopy = { ...email };
  const tokens = [
    { name: 'BA_NAME', value: baName },
    { name: 'CLIENT_NAME', value: clientName },
    { name: 'RESPONSE', value: response },
  ];

  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);
  push = replaceTokens(push, tokens);

  return { push, email: emailCopy };
};

export const buildClientRequestToAgent = ({ baName, clientName }) => {
  let { push, email } = templates.clientRequestToAgent[AGENT];

  const emailCopy = { ...email };
  const tokens = [
    { name: 'BA_NAME', value: baName },
    { name: 'CLIENT_NAME', value: clientName },
  ];

  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);
  push = replaceTokens(push, tokens);

  return { push, email: emailCopy };
};

const replaceTokens = (message, tokens) => {
  let updatedMessage = message;

  for (const token of tokens) {
    updatedMessage = updatedMessage.replace(new RegExp(`{{${token.name}}}`, 'g'), token.value);
  }

  return updatedMessage;
};

export const buildDeleteShowingRequest = ({ address, date, baName, brokerage, laName }) => {
  let { push, sms, email } = templates.deleteShowingRequest[AGENT];

  const tokens = [
    { name: 'ADDRESS', value: address },
    { name: 'DATE', value: date },
    { name: 'BA_NAME', value: baName },
    { name: 'BROKERAGE', value: brokerage },
    { name: 'SELLER_NAME', value: laName },
  ];

  push = replaceTokens(push, tokens);
  sms = replaceTokens(sms, tokens);

  return { push, sms, email };
};

export const buildCancelShowingRequestByListingAgent = ({ address, date, baName, timeRange, laName }) => {
  let { push, sms, email } = templates.cancelShowingRequestByListingAgent[AGENT];

  const emailCopy = { ...email };
  const tokens = [
    { name: 'ADDRESS', value: address },
    { name: 'DATE', value: date },
    { name: 'BA_NAME', value: baName },
    { name: 'LA_NAME', value: laName },
    { name: 'TIME_RANGE', value: timeRange },
  ];

  emailCopy.subject = replaceTokens(emailCopy.subject, tokens);
  emailCopy.body = replaceTokens(emailCopy.body, tokens);
  push = replaceTokens(push, tokens);
  sms = replaceTokens(sms, tokens);

  return { push, sms, email: emailCopy };
};
