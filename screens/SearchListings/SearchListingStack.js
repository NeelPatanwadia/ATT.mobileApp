import React, { useState } from 'react';
import { View } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack';
import { color, tw } from 'react-native-tailwindcss';
import SearchListingContex from './SearchListingContex';
import SearchIndex from './SearchIndex';
import ListingDetails from './ListingDetails';
import { SearchIcon } from '../../assets/images';

const SearchListingStack = createStackNavigator(
  {
    SearchIndex,
    ListingDetails,
  },
  {
    initialRouteName: 'SearchIndex',
    defaultNavigationOptions: { headerShown: false },
  }
);

const StackWithSearchListing = props => {
  const [searchListing, setSearchListing] = useState([]);

  return (
    <SearchListingContex.Provider value={{ searchListing, setSearchListing }}>
      <SearchListingStack {...props} />
    </SearchListingContex.Provider>
  );
};

StackWithSearchListing.navigationOptions = () => ({
  tabBarLabel: <View />,
  tabBarIcon: ({ focused }) => {
    let icon = <SearchIcon width={28} height={28} />;

    if (focused) {
      icon = <SearchIcon width={28} height={28} stroke={color.blue500} />;
    }

    return (
      <View style={[tw.relative, tw.flexCol, tw.itemsCenter, tw.justifyCenter, { width: 50, height: 40 }]}>{icon}</View>
    );
  },
});

StackWithSearchListing.router = SearchListingStack.router;

export default StackWithSearchListing;
