import React from 'react';
import { View } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack';

import { AgentDashboard } from '../../screens';
import { DashboardIconOutline, DashboardIconSolid } from '../../assets/images/tab-icons';

const AgentDashboardStack = createStackNavigator(
  {
    Dashboard: AgentDashboard,
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

AgentDashboardStack.path = '';

export default AgentDashboardStack;
