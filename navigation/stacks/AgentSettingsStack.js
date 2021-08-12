import React from 'react';
import { View, Image } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack';

import {
  AgentSettings,
  Account,
  Support,
  EditName,
  EditPhone,
  EditBrokerage,
  EditRealtorNumber,
  Verification,
  SubscriptionHistory,
} from '../../screens';
import { EllipsisIconOutline, EllipsisIconSolid } from '../../assets/images/tab-icons';

const AgentSettingsStack = createStackNavigator(
  {
    AgentSettings,
    Account,
    EditName,
    EditPhone,
    EditBrokerage,
    EditRealtorNumber,
    Verification,
    Support,
    SubscriptionHistory,
  },
  {
    initialRouteName: 'AgentSettings',
    defaultNavigationOptions: {
      headerShown: false,
      headerForceInset: { top: 'never' },
    },
    navigationOptions: {
      tabBarLabel: <View />,
      tabBarIcon: ({ focused }) => (
        <Image
          source={focused ? EllipsisIconSolid : EllipsisIconOutline}
          style={{ height: 28, width: 28 }}
          resizeMode="contain"
        />
      ),
    },
  }
);

export default AgentSettingsStack;
