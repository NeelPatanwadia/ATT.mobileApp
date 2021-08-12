import React from 'react';
import { View, Image } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack';

import { BuyerSellerSettings, Account, EditName, EditPhone, Support, Verification } from '../../screens';
import { EllipsisIconOutline, EllipsisIconSolid } from '../../assets/images/tab-icons';

const BuyerSellerSettingsStack = createStackNavigator(
  {
    BuyerSellerSettings,
    Account,
    EditName,
    EditPhone,
    Verification,
    Support,
  },
  {
    initialRouteName: 'BuyerSellerSettings',
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

export default BuyerSellerSettingsStack;
