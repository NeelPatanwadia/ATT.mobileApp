import React, { useState } from 'react';
import { View } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack';

import NewTour from './NewTour';
import LiveTour from './LiveTour';
import LiveTourReloading from './LiveTour/LiveTourReloading';
import ScheduledTours from './ScheduledTours';
import TourDetails from './TourDetailComponents/TourDetails';
import TourStopDetails from './TourDetailComponents/TourStopDetails';
import InviteClient from '../AgentClients/InviteClient';
import TourContext from './TourContext';
import NewTourNameDate from './NewTour/NewTourNameDate';
import NewTourHomes from './NewTour/NewTourHomes/NewTourHomes';
import NewTourHomeFirst from './NewTour/NewTourHomeFirst';
import NewTourHomeOrder from './NewTour/NewTourHomeOrder';
import NewTourRouteCalculation from './NewTour/NewTourRouteCalculation';
import NewTourConfirm from './NewTour/NewTourConfirm.js';

import { TourIconOutline, TourIconSolid } from '../../assets/images/tab-icons';

const ScheduledToursStack = createStackNavigator(
  {
    ScheduledTours,
    TourDetails,
    TourStopDetails,
    NewTour,
    NewTourNameDate,
    NewTourHomes,
    NewTourHomeFirst,
    NewTourHomeOrder,
    NewTourRouteCalculation,
    NewTourConfirm,
    LiveTour: {
      screen: LiveTour,
      params: {
        tourStopId: 10,
      },
    },
    LiveTourReloading,
    TourInviteClient: InviteClient,
  },
  {
    initialRouteName: 'ScheduledTours',
    defaultNavigationOptions: { headerShown: false },
  }
);

const StackWithTours = props => {
  const [client, setClient] = useState({});
  const [propertiesOfInterest, setPropertiesOfInterest] = useState([]);
  const [tours, setTours] = useState([]);
  const [tour, setTour] = useState({
    name: '',
  });
  const [tourStops, setTourStops] = useState([]);
  const [tourStop, setTourStop] = useState({});
  const [copiedTourId, setCopiedTourId] = useState(null);

  return (
    <TourContext.Provider
      value={{
        client,
        setClient,
        propertiesOfInterest,
        setPropertiesOfInterest,
        tours,
        setTours,
        tour,
        setTour,
        tourStops,
        setTourStops,
        tourStop,
        setTourStop,
        copiedTourId,
        setCopiedTourId,
      }}
    >
      <ScheduledToursStack {...props} />
    </TourContext.Provider>
  );
};

StackWithTours.navigationOptions = () => ({
  tabBarLabel: <View />,
  tabBarIcon: ({ focused }) => {
    if (focused) {
      return <TourIconSolid width={28} height={28} />;
    }

    return <TourIconOutline width={28} height={28} fill="#000" />;
  },
});
StackWithTours.router = ScheduledToursStack.router;

export default StackWithTours;
