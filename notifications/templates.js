const DEFAULT_SMS_SUFFIX = 'Brought to you by AboutTimeTours.com';
const DEFAULT_EMAIL_SUFFIX =
  '<br><br><b>Note:</b> This message was sent from an unmonitored email address. Please do not respond directly to this message.';

// "Notifications"
const sendShowingRequest = {
  agent: {
    push: '{{BA_NAME}} with {{BROKERAGE}} would like to show {{ADDRESS}}, on {{DATE}}, {{TIME_RANGE}}',
    sms: `Hi {{LA_NAME}}, this is {{BA_NAME}} with {{BROKERAGE}}. I would like to show {{ADDRESS}}, on {{DATE}}, from {{TIME_RANGE}}. Please contact me at {{PHONE}} \n\nThank you, \n{{BA_NAME}} \n\n(Download the AboutTimeTours app at https://AboutTimeTours.com/agents/) \nReply STOP to stop receiving messages. Msg&Data Rates may apply.`,
    email: {
      subject: `Showing Request for {{ADDRESS}}`,
      body: `Hi {{LA_NAME}}, <br><br>This is {{BA_NAME}} with {{BROKERAGE}}. I would like to show {{ADDRESS}}, on {{DATE}}, from {{TIME_RANGE}}. Please contact me at {{PHONE}} <br><br>Thank you, <br>{{BA_NAME}} <br><br><a href="https://AboutTimeTours.com/agents/">Download the AboutTimeTours app</a> ${DEFAULT_EMAIL_SUFFIX}`,
    },
  },
  seller: {
    push: '',
    sms: '',
    email: {},
  },
};

const approveShowingRequest = {
  agent: {
    push: '{{NAME}} with {{BROKERAGE}} has confirmed an appointment to show {{ADDRESS}}, on {{DATE}}, {{TIME_RANGE}}',
    sms: '{{NAME}} with {{BROKERAGE}} has confirmed an appointment to show {{ADDRESS}}, on {{DATE}}, {{TIME_RANGE}}',
    email: {
      subject: 'Approve Showing Request',
      body:
        'Hi, <br><br>{{NAME}} with {{BROKERAGE}} has confirmed an appointment to show {{ADDRESS}}, on {{DATE}}, {{TIME_RANGE}}. <br><br>Thank you',
    },
  },
  seller: {
    push: '',
    sms: '',
    email: {},
  },
};

const suggestAlternateTime = {
  agent: {
    push:
      '{{NAME}} with {{BROKERAGE}} has suggested an alternate time to show {{ADDRESS}}, on {{DATE}}, {{TIME_RANGE}}',
    sms: '{{NAME}} with {{BROKERAGE}} has suggested an alternate time to show {{ADDRESS}}, on {{DATE}}, {{TIME_RANGE}}',
    email: {
      subject: 'Suggested New Time',
      body:
        'Hi, <br><br>{{NAME}} with {{BROKERAGE}} has suggested an alternate time to show {{ADDRESS}}, on {{DATE}}, {{TIME_RANGE}}. <br><br>Thank you',
    },
  },
  seller: {
    push: '',
    sms: '',
    email: {},
  },
};

const showingRequestComment = {
  agent: {
    push: `{{NAME}} with {{BROKERAGE}} added a comment to the showing request for {{ADDRESS}}, on {{DATE}}: \n{{MESSAGE}}`,
    sms: '',
    email: {},
  },
  seller: {
    push: '',
    sms: '',
    email: {},
  },
};

// "Alerts"
const nextOnTour = {
  agent: {
    push: 'Hi {{LA_NAME}}, this is {{BA_NAME}} with {{BROKERAGE}}.  {{ADDRESS}} is next on tour.',
    sms: `Hi {{LA_NAME}}, this is {{BA_NAME}} with {{BROKERAGE}}.  {{ADDRESS}} is next on tour. ${DEFAULT_SMS_SUFFIX}`,
    email: {
      subject: `{{ADDRESS}} is Next on Tour`,
      body: `Hi {{LA_NAME}}, <br><br>This is {{BA_NAME}} with {{BROKERAGE}}.  {{ADDRESS}} is next on tour. ${DEFAULT_EMAIL_SUFFIX}`,
    },
  },
  seller: {
    push: 'Hi {{SELLER_NAME}}, Your home at {{ADDRESS}} is next on tour. Thank you.',
    sms: `Hi {{SELLER_NAME}}, Your home at {{ADDRESS}} is next on tour. Thank you. ${DEFAULT_SMS_SUFFIX}`,
    email: {
      subject: `{{ADDRESS}} is Next on Tour`,
      body: `Hi {{SELLER_NAME}}, <br><br>Your home at {{ADDRESS}} is next on tour. Thank you. ${DEFAULT_EMAIL_SUFFIX}`,
    },
  },
};

const leftHome = {
  agent: {
    push: '',
    sms: '',
    email: {},
  },
  seller: {
    push: `Hi {{SELLER_NAME}}, we've left {{ADDRESS}}. Thanks for letting us tour your home.`,
    sms: `Hi {{SELLER_NAME}}, we've left {{ADDRESS}}. Thanks for letting us tour your home. ${DEFAULT_SMS_SUFFIX}`,
    email: {
      subject: `Thanks for letting us tour {{ADDRESS}}`,
      body: `Hi {{SELLER_NAME}}, <br><br>We've left {{ADDRESS}}. Thanks for letting us tour your home. ${DEFAULT_EMAIL_SUFFIX}`,
    },
  },
};

// "Feedback"
const interested = {
  agent: {
    push: `Hi {{LA_NAME}}, this is {{BA_NAME}}, with {{BROKERAGE}}, my client is interested in {{ADDRESS}}. {{MESSAGE}}`,
    sms: `Hi {{LA_NAME}}, this is {{BA_NAME}}, with {{BROKERAGE}}. My client is interested in {{ADDRESS}}. {{MESSAGE}} ${DEFAULT_SMS_SUFFIX}`,
    email: {
      subject: `My Client is Interested in {{ADDRESS}}`,
      body: `Hi {{LA_NAME}}, <br><br>This is {{BA_NAME}}, with {{BROKERAGE}}. My client is interested in {{ADDRESS}}. {{MESSAGE}} ${DEFAULT_EMAIL_SUFFIX}`,
    },
  },
  seller: {
    push: '',
    sms: '',
    email: {},
  },
};

const notInterested = {
  agent: {
    push: `Hi {{LA_NAME}}, this is {{BA_NAME}}, with {{BROKERAGE}}. My client is not interested in {{ADDRESS}}. {{MESSAGE}}`,
    sms: `Hi {{LA_NAME}}, this is {{BA_NAME}}, with {{BROKERAGE}}. My client is not interested in {{ADDRESS}}. {{MESSAGE}} ${DEFAULT_SMS_SUFFIX}`,
    email: {
      subject: `My Client is Not Interested in {{ADDRESS}}`,
      body: `Hi {{LA_NAME}}, <br><br>This is {{BA_NAME}}, with {{BROKERAGE}}. My client is not interested in {{ADDRESS}}. {{MESSAGE}} ${DEFAULT_EMAIL_SUFFIX}`,
    },
  },
  seller: {
    push: '',
    sms: '',
    email: {},
  },
};

const customFeedback = {
  agent: {
    push: `{{BA_NAME}} with {{BROKERAGE}} made a comment about their showing for {{ADDRESS}}: \n{{MESSAGE}}`,
    sms: `{{BA_NAME}} with {{BROKERAGE}} made a comment about their showing for {{ADDRESS}}: \n{{MESSAGE}} ${DEFAULT_SMS_SUFFIX}`,
    email: {
      subject: `Comment About Showing for {{ADDRESS}}`,
      body: `{{BA_NAME}} with {{BROKERAGE}} made a comment about their showing for {{ADDRESS}}: <br><br>{{MESSAGE}} ${DEFAULT_EMAIL_SUFFIX}`,
    },
  },
  seller: {
    push: '',
    sms: '',
    email: {},
  },
};

// Buyer notifications
const tourCreated = {
  agent: {
    push: '',
    sms: '',
    email: '',
  },
  seller: {
    push: '',
    sms: '',
    email: {},
  },
  buyer: {
    push: `{{BA_NAME}} with {{BROKERAGE}} has scheduled a new home tour for you on {{DATETIME}}.`,
    sms: '',
    email: '',
  },
};

const propertyOfInterestAdded = {
  agent: {
    push: '',
    sms: '',
    email: '',
  },
  seller: {
    push: '',
    sms: '',
    email: {},
  },
  buyer: {
    push: `{{BA_NAME}} with {{BROKERAGE}} has added {{ADDRESS}} to your homes of interest.`,
    sms: '',
    email: '',
  },
};

const cancelShowingRequest = {
  agent: {
    push: `The Buying Agent has removed the home at {{ADDRESS}} from their client's tour. The previously requested showing has been cancelled.`,
    sms: `The Buying Agent has removed the home at {{ADDRESS}} from their client's tour. The previously requested showing has been cancelled. ${DEFAULT_SMS_SUFFIX}`,
    email: {
      subject: 'Cancelled Showing Request',
      body: `Hi, <br><br>The Buying Agent has removed the home at {{ADDRESS}} from their client's tour. The previously requested showing has been cancelled. <br><br>Thank you`,
    },
  },
  seller: {
    push: '',
    sms: '',
    email: {},
  },
  buyer: {
    push: '',
    sms: '',
    email: '',
  },
};

const createAndInviteClientRequest = {
  agent: {
    push: '',
    sms: '',
    email: '',
  },
  seller: {
    push: ``,
    sms: `Hello {{SELLER_NAME}}, \n{{AGENT_NAME}} from {{BROKERAGE}} wants to connect with you on About Time Tours. \n\n(Download the AboutTimeTours app at https://AboutTimeTours.com/agents/ and create a free account to start planning your property tours).`,
    email: {
      subject: `About Time Tour app invitation`,
      body: `Hello {{SELLER_NAME}}, <br><br>{{AGENT_NAME}} from {{BROKERAGE}} wants to connect with you on About Time Tours. <br><br><a href="https://AboutTimeTours.com/agents/">Download the AboutTimeTours app</a> and create a free account to start planning your property tours. ${DEFAULT_EMAIL_SUFFIX}`,
    },
  },
  buyer: {
    push: '',
    sms: '',
    email: '',
  },
};
const createAndInviteAgentRequest = {
  agent: {
    push: '',
    sms: `Hello {{AGENT_NAME}}, \n{{SELLER_NAME}} wants to connect with you on About Time Tours. \n\n(Download the AboutTimeTours app at https://AboutTimeTours.com/agents/ and create a free account to start planning your property tours).`,
    email: {
      subject: `About Time Tour app invitation`,
      body: `Hello {{AGENT_NAME}}, <br><br>{{SELLER_NAME}} wants to connect with you on About Time Tours. <br><br><a href="https://AboutTimeTours.com/agents/">Download the AboutTimeTours app</a> and create a free account to start planning your property tours. ${DEFAULT_EMAIL_SUFFIX}`,
    },
  },
  seller: {
    push: ``,
    sms: ``,
    email: '',
  },
  buyer: {
    push: '',
    sms: '',
    email: '',
  },
};

const editDeleteLAAvailabilitySlot = {
  agent: {
    push: '',
    sms: '',
    email: '',
  },
  seller: {
    push: '',
    sms: '',
    email: '',
  },
  buyer: {
    push:
      'Hi {{BA_NAME}}, Due to unforeseen circumstances, we had to cancel your showing at {{ADDRESS}}, on {{DATE}}, from {{TIME_RANGE}}',
    sms: `Hi {{BA_NAME}}, Due to unforeseen circumstances, we had to cancel your showing at {{ADDRESS}}, on {{DATE}}, from {{TIME_RANGE}}. Please check the calendar for other available times. Please contact me with questions. \n\nThank you, \n{{LA_NAME}} \n`,
    email: {
      subject: `Canceled Showing Request for {{ADDRESS}}`,
      body: `Hi {{BA_NAME}}, <br><br> Due to unforeseen circumstances, we had to cancel your showing at {{ADDRESS}}, on {{DATE}}, from {{TIME_RANGE}}. Please check the calendar for other available times. Please contact me with questions. <br><br>Thank you, <br>{{LA_NAME}} <br>`,
    },
  },
};

const clientAddedPropertyOfInterest = {
  agent: {
    push: `{{SA_NAME}} has added {{ADDRESS}} into his homes of interest.`,
    sms: '',
    email: {
      subject: `Home Added client's home of interest`,
      body: `Hi {{BA_NAME}}, <br><br> {{SA_NAME}} has added {{ADDRESS}} into his homes of interest. ${DEFAULT_EMAIL_SUFFIX}`,
    },
  },
  seller: {
    push: '',
    sms: '',
    email: {},
  },
  buyer: {
    push: '',
    sms: '',
    email: '',
  },
};

const agentRespondsToClientRequest = {
  agent: {
    push: '',
    sms: '',
    email: '',
  },
  seller: {
    push: '',
    sms: '',
    email: {},
  },
  buyer: {
    push: `Your request to connect with {{BA_NAME}} has been {{RESPONSE}}.`,
    sms: '',
    email: {
      subject: `Agent {{RESPONSE}} your request`,
      body: `Hello {{CLIENT_NAME}}, <br><br>Your request to connect with {{BA_NAME}} has been {{RESPONSE}}. <br><br><a href="https://AboutTimeTours.com/agents/">Download the AboutTimeTours app</a> and create a free account to start planning your property tours. ${DEFAULT_EMAIL_SUFFIX}`,
    },
  },
};

const clientRequestToAgent = {
  agent: {
    push: `{{CLIENT_NAME}} has added the request to be your client.`,
    sms: '',
    email: {
      subject: `New client request arrived`,
      body: `Hello {{BA_NAME}}, <br><br>{{CLIENT_NAME}} has added the request to be your client. <br><br><a href="https://AboutTimeTours.com/agents/">Download the AboutTimeTours app</a> and create a free account to start planning your property tours. ${DEFAULT_EMAIL_SUFFIX}`,
    },
  },
  seller: {
    push: '',
    sms: '',
    email: {},
  },
  buyer: {
    push: '',
    sms: '',
    email: '',
  },
};

const deleteShowingRequest = {
  agent: {
    push: `The showing at {{DATE}} for your listing at {{ADDRESS}} has been cancelled by {{BA_NAME}} {{BROKERAGE}}.`,
    sms: `The showing at {{DATE}} for your listing at {{ADDRESS}} has been cancelled by {{BA_NAME}} {{BROKERAGE}}. ${DEFAULT_SMS_SUFFIX}`,
    email: {
      subject: `Showing Cancelled`,
      body: `Hello {{SELLER_NAME}}, <br><br>The showing at {{DATE}} for your listing at {{ADDRESS}} has been cancelled by {{BA_NAME}} {{BROKERAGE}}. <br><br><a href="https://AboutTimeTours.com/agents/">Download the AboutTimeTours app</a> and create a free account to start planning your property tours. ${DEFAULT_EMAIL_SUFFIX}`,
    },
  },
  seller: {
    push: '',
    sms: '',
    email: {},
  },
  buyer: {
    push: '',
    sms: '',
    email: '',
  },
};

const cancelShowingRequestByListingAgent = {
  agent: {
    push: '{{LA_NAME}} has cancelled an appointment to show {{ADDRESS}}, on {{DATE}}, {{TIME_RANGE}}',
    sms: 'Hi {{BA_NAME}}, {{LA_NAME}} has cancelled an appointment to show {{ADDRESS}}, on {{DATE}}, {{TIME_RANGE}}.',
    email: {
      subject: 'Cancelled Showing Request',
      body: `Hi {{BA_NAME}}, <br><br>{{LA_NAME}} has cancelled an appointment to show {{ADDRESS}}, on {{DATE}}, {{TIME_RANGE}}.${DEFAULT_EMAIL_SUFFIX}`,
    },
  },
  seller: {
    push: '',
    sms: '',
    email: {},
  },
  buyer: {
    push: '',
    sms: '',
    email: '',
  },
};

export default {
  sendShowingRequest,
  approveShowingRequest,
  suggestAlternateTime,
  showingRequestComment,
  nextOnTour,
  leftHome,
  interested,
  notInterested,
  customFeedback,
  tourCreated,
  propertyOfInterestAdded,
  cancelShowingRequest,
  cancelShowingRequestByListingAgent,
  createAndInviteClientRequest,
  createAndInviteAgentRequest,
  editDeleteLAAvailabilitySlot,
  clientAddedPropertyOfInterest,
  agentRespondsToClientRequest,
  clientRequestToAgent,
  deleteShowingRequest,
};
