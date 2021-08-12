import React from 'react';

const ShowingContext = React.createContext({
  showings: [],
  setShowings: () => {},
  propertyListings: [],
  setPropertyListings: () => {},
  propertyListing: {},
  availableTimeSlotListings: [],
  setAvailableTimeSlotListings: () => {},
});

export default ShowingContext;
