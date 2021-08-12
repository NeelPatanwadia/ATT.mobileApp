import React from 'react';
import { View } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack';

import { BuyerSellerDashboard, InviteClient } from '../../screens';
import { BuyerSellerConnect } from '../../screens/Onboarding';
import { DashboardIconOutline, DashboardIconSolid } from '../../assets/images/tab-icons';

const BuyerSellerDashboardStack = createStackNavigator(
  {
    Dashboard: BuyerSellerDashboard,
    AgentConnect: BuyerSellerConnect,
    InviteAgent: InviteClient,
  },
  {
    defaultNavigationOptions: {
      headerShown: false,
      headerForceInset: { top: 'never' },
    },
    navigationOptions: {
      tabBarLabel: <View />,
      tabBarIcon: ({ focused }) => {
        if (focused) {
          return <DashboardIconSolid width={28} height={28} />;
        }

        return <DashboardIconOutline width={28} height={28} fill="#000" />;
      },
    },
  }
);

BuyerSellerDashboardStack.path = '';

export default BuyerSellerDashboardStack;
