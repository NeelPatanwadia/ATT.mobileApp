import React, { useState } from 'react';
import { View } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack';
import { tw } from 'react-native-tailwindcss';

import ScheduledShowings from './ScheduledShowings';
import ShowingDetails from './ShowingDetails';
import ListingsIndex from './ListingsIndex';
import ShowingContext from './ShowingContext';
import Listings from './AvailableShowings/Listings';
import ListAvailableShowings from './AvailableShowings/ListAvailableShowings';
import RemoveShowTimes from './AvailableShowings/RemoveShowTimes';
import AddAvailableShowingTimes from './AvailableShowings/AddAvailableShowingTimes';

import { ShowingsIconOutline, ShowingsIconSolid } from '../../assets/images/tab-icons';
import { ShowingCountBadge } from '../../components';
import ChatList from '../Chat/ChatList';
import ChatScreen from '../Chat/ChatScreen';

const ScheduledShowingsStack = createStackNavigator(
  {
    ListingsIndex,
    Listings,
    ScheduledShowings,
    ListAvailableShowings,
    RemoveShowTimes,
    ShowingDetails,
    AddAvailableShowingTimes,
    ScheduleChatList: ChatList,
    ScheduleChatScreen: ChatScreen,
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
  const [propertyListings, setPropertyListings] = useState([]);
  const [selectedPropertyListing, setSelectedPropertyListing] = useState(null);
  const [availableTimeSlotListings, setAvailableTimeSlotListings] = useState(null);
  const [propertySeller, setPropertySeller] = useState(null);

  return (
    <ShowingContext.Provider
      value={{
        selectedShowing,
        setSelectedShowing,
        showings,
        setShowings,

        messages,
        setMessages,
        propertyListings,
        setPropertyListings,
        availableTimeSlotListings,
        setAvailableTimeSlotListings,
        selectedPropertyListing,
        setSelectedPropertyListing,
        propertySeller,
        setPropertySeller,
      }}
    >
      <ScheduledShowingsStack {...props} />
    </ShowingContext.Provider>
  );
};

StackWithTours.navigationOptions = navigation => ({
  tabBarLabel: <View />,
  tabBarIcon: ({ focused }) => {
    const { showingRequestCounts, setShowingRequestCounts, user, showListingBatch } = navigation.screenProps;

    let badgeCount = 0;

    if (showingRequestCounts && showingRequestCounts.length > 0) {
      for (const showingRequest of showingRequestCounts) {
        badgeCount += showingRequest.count;
      }
    }

    let icon = <ShowingsIconOutline width={28} height={28} fill="#000" />;

    if (focused) {
      icon = <ShowingsIconSolid width={28} height={28} />;
    }

    return (
      <View style={[tw.relative, tw.flexCol, tw.itemsCenter, tw.justifyCenter, { width: 50, height: 40 }]}>
        {icon}
        {user && (
          <ShowingCountBadge
            showingBadgeCount={badgeCount}
            showListingBatch={showListingBatch}
            setShowingRequestCounts={setShowingRequestCounts}
            user={user}
          />
        )}
      </View>
    );
  },
});

StackWithTours.router = ScheduledShowingsStack.router;

export default StackWithTours;
