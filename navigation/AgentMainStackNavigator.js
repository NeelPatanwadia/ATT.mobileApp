import React from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import { color, tw } from 'react-native-tailwindcss';

import { View } from 'react-native';
import AgentTabNavigator from './AgentTabNavigator';
import { HomeDetails, HomeDetailsNotes, Notifications, ModalScreen } from '../screens';
import AgentCustomListingsStack from './stacks/AgentCustomListingStack';
import { HeaderText } from '../components';
import { HeaderBackButton } from '../components/buttons';
import NotificationsButton from '../components/buttons/NotificationsButton';
import ChatScreen from '../screens/Chat/ChatScreen';

const AgentMainStack = createStackNavigator(
  {
    AgentMain: {
      screen: AgentTabNavigator,
      navigationOptions: {
        headerShown: false,
      },
    },
    AgentNotifications: {
      screen: Notifications,
      navigationOptions: ({ navigation }) => {
        const headerRight = navigation.getParam('headerRight', <View />);

        return {
          headerTitle: <HeaderText style={[tw.wFull, tw.textCenter]}>Notifications</HeaderText>,
          headerRight,
        };
      },
    },
    AgentHomeDetails: {
      screen: HomeDetails,
      navigationOptions: {
        headerTitle: <HeaderText style={[tw.wFull, tw.textCenter]}>Home Details</HeaderText>,
      },
      params: {
        isAgent: true,
      },
    },
    AgentHomeDetailsNotes: {
      screen: HomeDetailsNotes,
      navigationOptions: {
        headerTitle: <HeaderText style={[tw.wFull, tw.textCenter]}>Home Notes</HeaderText>,
      },
      params: {
        isAgent: true,
      },
    },
    BuyingAgentChatMessageScreen: {
      screen: ChatScreen,
      navigationOptions: {
        headerTitle: <HeaderText style={[tw.wFull, tw.textCenter]}>Chats</HeaderText>,
      },
      params: {
        isAgent: true,
      },
    },
    AgentCustomListings: {
      screen: AgentCustomListingsStack,
      navigationOptions: {
        headerTitle: <HeaderText style={[tw.wFull, tw.textCenter]}>Custom Listings</HeaderText>,
      },
    },
    AgentModal: {
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
    initialRouteName: 'AgentMain',
    defaultNavigationOptions: ({ navigation }) => {
      const { setClientRequestCount, notificationCount, setNotificationCount, user } = navigation.getScreenProps();

      return {
        headerStyle: { backgroundColor: color.primary },
        headerShown: true,
        headerForceInset: { top: 'never' },
        headerLeft: <HeaderBackButton />,
        headerRight: (
          <NotificationsButton
            link="AgentNotifications"
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

export default AgentMainStack;
