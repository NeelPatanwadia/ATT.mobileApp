import React from 'react';

const TourContext = React.createContext({
  tours: [],
  setTours: () => {},
});

export default TourContext;
