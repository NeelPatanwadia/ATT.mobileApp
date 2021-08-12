import React from 'react';

const ClientContext = React.createContext({
  client: {},
  setClient: () => {},
  propertyOfInterest: {},
  setPropertyOfInterest: () => {},
});

export default ClientContext;
