import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import { View } from 'react-native';
import { color } from 'react-native-tailwindcss';
import { LocationMarkerIcon } from '../../../assets/images';

import NewTourClientSelect from './NewTourClientSelect';
import NewTourNameDate from './NewTourNameDate';
import NewTourHomes from './NewTourHomes/NewTourHomes';
import NewTourHomeFirst from './NewTourHomeFirst';
import NewTourHomeOrder from './NewTourHomeOrder';
import NewTourRouteCalculation from './NewTourRouteCalculation';
import NewTourConfirm from './NewTourConfirm.js';
import InviteClient from '../../AgentClients/InviteClient';

const NewTourStack = createStackNavigator(
  {
    NewTourClientSelect,
    NewTourNameDate,
    NewTourHomes,
    NewTourHomeFirst,
    NewTourHomeOrder,
    NewTourRouteCalculation,
    NewTourConfirm,
    TourInviteClient: InviteClient,
  },
  {
    initialRouteName: 'NewTourClientSelect',
    defaultNavigationOptions: { headerShown: false },
    navigationOptions: {
      headerShown: false,
      tabBarLabel: <View />,
      tabBarIcon: ({ focused }) => (
        <LocationMarkerIcon width={30} height={30} fill={focused ? color.blue500 : color.gray900} />
      ),
    },
  }
);

NewTourStack.navigationOptions = () => ({
  headerShown: false,
});

export default NewTourStack;
