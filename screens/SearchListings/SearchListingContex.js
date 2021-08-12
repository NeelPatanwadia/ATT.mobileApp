import React from 'react';

const SearchListingContex = React.createContext({
  searchListing: [],
  setSearchListing: () => {},
});

export default SearchListingContex;
