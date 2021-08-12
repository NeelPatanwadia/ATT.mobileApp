import React from 'react';

const AgentTabContext = React.createContext({
  navigationParams: {},
  setNavigationParams: () => {},
});

export default AgentTabContext;
