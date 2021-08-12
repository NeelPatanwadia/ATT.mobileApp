import React, { useState } from 'react';
import { View } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack';
import { tw } from 'react-native-tailwindcss';

import BuyerSellerScheduledTours from './BuyerSellerScheduledTours';
import BuyerSellerTourDetails from './BuyerSellerTourDetails';
import BuyerSellerTourContext from './BuyerSellerTourContext';
import BuyerSellerLiveTour from './LiveTour/LiveTour';
import BuyerSellerLiveTourReloading from './LiveTour/LiveTourReloading';
import { NewTourBadge } from '../../components';

import { TourIconOutline, TourIconSolid } from '../../assets/images/tab-icons';

const BuyerSellerScheduledToursStack = createStackNavigator(
  {
    BuyerSellerScheduledTours,
    BuyerSellerTourDetails,
    BuyerSellerLiveTour: {
      screen: BuyerSellerLiveTour,
    },
    BuyerSellerLiveTourReloading,
  },
  {
    initialRouteName: 'BuyerSellerScheduledTours',
    defaultNavigationOptions: { headerShown: false },
  }
);

const StackWithTours = props => {
  const [propertyId, setPropertyId] = useState(false);
  const [properties, setProperties] = useState([]);
  const [tours, setTours] = useState([]);
  const [selectedTour, setSelectedTour] = useState({
    name: '',
  });
  const [tourStops, setTourStops] = useState([]);
  const [selectedTourStop, setSelectedTourStop] = useState({});

  return (
    <BuyerSellerTourContext.Provider
      value={{
        propertyId,
        setPropertyId,
        properties,
        setProperties,
        tours,
        setTours,
        selectedTour,
        setSelectedTour,
        tourStops,
        setTourStops,
        selectedTourStop,
        setSelectedTourStop,
      }}
    >
      <BuyerSellerScheduledToursStack {...props} />
    </BuyerSellerTourContext.Provider>
  );
};

StackWithTours.navigationOptions = navigation => ({
  tabBarLabel: <View />,
  tabBarIcon: ({ focused }) => {
    const { newTourNotSeen, setNewTourNotSeen, user } = navigation.screenProps;

    let icon = <TourIconOutline width={28} height={28} fill="#000" />;

    if (focused) {
      icon = <TourIconSolid width={28} height={28} />;
    }

    return (
      <View style={[tw.relative, tw.flexCol, tw.itemsCenter, tw.justifyCenter, { width: 50, height: 40 }]}>
        {icon}
        {user && <NewTourBadge newTourNotSeen={newTourNotSeen} setNewTourNotSeen={setNewTourNotSeen} user={user} />}
      </View>
    );
  },
});
StackWithTours.router = BuyerSellerScheduledToursStack.router;

export default StackWithTours;
