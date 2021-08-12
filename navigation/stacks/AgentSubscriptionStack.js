import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack';
import { FontAwesome5 } from '@expo/vector-icons';
import { color, tw } from 'react-native-tailwindcss';
import { HeaderText } from '../../components';

import { SubscriptionOptions, VerifySubscription, SubscriptionMessage } from '../../screens';

const AgentSubscriptionsStack = createStackNavigator(
  {
    SubscriptionOptions,
    VerifySubscription,
    SubscriptionMessage,
  },
  {
    initialRouteName: 'VerifySubscription',
    defaultNavigationOptions: ({ navigation }) => {
      const { signOut } = navigation.getScreenProps();

      return {
        headerForceInset: { top: 'never' },
        headerShown: true,
        headerStyle: { backgroundColor: color.primary },
        headerLeft: <View />,
        headerTitle: <HeaderText style={[tw.wFull, tw.textCenter]}>Subscription</HeaderText>,
        headerRight: (
          <TouchableOpacity onPress={signOut} style={[tw.justifyCenter, tw.itemsCenter, tw.pX4, tw.hFull]}>
            <FontAwesome5 name="sign-out-alt" style={[tw.textGray700, tw.text2xl]} />
          </TouchableOpacity>
        ),
      };
    },
  }
);

export default AgentSubscriptionsStack;
