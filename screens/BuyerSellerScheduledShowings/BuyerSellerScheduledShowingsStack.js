import React, { useState } from 'react';
import { View } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack';

import BuyerSellerScheduledShowings from './BuyerSellerScheduledShowings';
import BuyerSellerShowingDetails from './BuyerSellerShowingDetails';
import ListingsIndex from './BuyerSellerListingsIndex';
import BuyerSellerShowingContext from './BuyerSellerShowingContext';

import { ShowingsIconOutline, ShowingsIconSolid } from '../../assets/images/tab-icons';

const BuyerSellerScheduledShowingsStack = createStackNavigator(
  {
    ListingsIndex,
    BuyerSellerScheduledShowings,
    BuyerSellerShowingDetails,
  },
  {
    initialRouteName: 'ListingsIndex',
    defaultNavigationOptions: { headerShown: false },
  }
);

const StackWithTours = props => {
  const [showings, setShowings] = useState([]);
  const [selectedShowing, setSelectedShowing] = useState({
    name: '',
  });
  const [messages, setMessages] = useState([]);
  const [selectedPropertyListing, setSelectedPropertyListing] = useState(false);
  const [propertyListings, setPropertyListings] = useState([]);

  return (
    <BuyerSellerShowingContext.Provider
      value={{
        selectedShowing,
        setSelectedShowing,
        showings,
        setShowings,
        messages,
        setMessages,
        selectedPropertyListing,
        setSelectedPropertyListing,
        propertyListings,
        setPropertyListings,
      }}
    >
      <BuyerSellerScheduledShowingsStack {...props} />
    </BuyerSellerShowingContext.Provider>
  );
};

StackWithTours.navigationOptions = () => ({
  tabBarLabel: <View />,
  tabBarIcon: ({ focused }) => {
    if (focused) {
      return <ShowingsIconSolid width={28} height={28} />;
    }

    return <ShowingsIconOutline width={28} height={28} fill="#000" />;
  },
});
StackWithTours.router = BuyerSellerScheduledShowingsStack.router;

export default StackWithTours;
