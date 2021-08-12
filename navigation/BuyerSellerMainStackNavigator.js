import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import { color, tw } from 'react-native-tailwindcss';

import { View } from 'react-native';
import BuyerSellerTabNavigator from './BuyerSellerTabNavigator';
import { HomeDetails, HomeDetailsNotes, Notifications, ModalScreen } from '../screens';
import { HeaderText } from '../components';
import { HeaderBackButton } from '../components/buttons';
import NotificationsButton from '../components/buttons/NotificationsButton';

const BuyerSellerMainStack = createStackNavigator(
  {
    BuyerSellerMain: {
      screen: BuyerSellerTabNavigator,
      navigationOptions: {
        headerShown: false,
      },
    },
    BuyerSellerNotifications: {
      screen: Notifications,
      navigationOptions: ({ navigation }) => {
        const headerRight = navigation.getParam('headerRight', <View />);

        return {
          headerTitle: <HeaderText style={[tw.wFull, tw.textCenter]}>Notifications</HeaderText>,
          headerRight,
        };
      },
    },
    BuyerSellerHomeDetails: {
      screen: HomeDetails,
      navigationOptions: {
        headerTitle: <HeaderText style={[tw.wFull, tw.textCenter]}>Home Details</HeaderText>,
      },
      params: {
        isAgent: false,
      },
    },
    BuyerSellerHomeDetailsNotes: {
      screen: HomeDetailsNotes,
      navigationOptions: {
        headerTitle: <HeaderText style={[tw.wFull, tw.textCenter]}>Home Notes</HeaderText>,
      },
      params: {
        isAgent: false,
      },
    },
    BuyerSellerModal: {
      screen: ModalScreen,
      navigationOptions: ({ navigation }) => {
        const headerRight = navigation.getParam('headerRight', <View />);
        const headerTitle = navigation.getParam('headerTitle', '');

        return {
          headerTitle: <HeaderText style={[tw.wFull, tw.textCenter]}>{headerTitle}</HeaderText>,
          headerRight,
        };
      },
    },
  },
  {
    initialRouteName: 'BuyerSellerMain',
    defaultNavigationOptions: ({ navigation }) => {
      const { setClientRequestCount, notificationCount, setNotificationCount, user } = navigation.getScreenProps();

      return {
        headerForceInset: { top: 'never' },
        headerStyle: { backgroundColor: color.primary },
        headerShown: true,
        headerLeft: <HeaderBackButton />,
        headerRight: (
          <NotificationsButton
            link="BuyerSellerNotifications"
            notificationCount={notificationCount}
            setNotificationCount={setNotificationCount}
            setClientRequestCount={setClientRequestCount}
            user={user}
          />
        ),
      };
    },
  }
);

export default BuyerSellerMainStack;
