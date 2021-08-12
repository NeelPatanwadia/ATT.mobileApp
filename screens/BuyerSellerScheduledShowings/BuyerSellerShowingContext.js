import React from 'react';

const BuyerSellerShowingContext = React.createContext({
  showings: [],
  setShowings: () => {},
});

export default BuyerSellerShowingContext;
