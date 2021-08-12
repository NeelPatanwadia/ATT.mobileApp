import React, { useState, useEffect } from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import { View } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { HeaderText } from '../components';
import BuyerSellerTabContext from './BuyerSellerTabContext';

import { BuyerSellerDashboardStack, BuyerSellerSettingsStack } from './stacks';
import BuyerSellerScheduledTours from '../screens/BuyerSellerScheduledTours';
import BuyerSellerScheduledShowings from '../screens/BuyerSellerScheduledShowings';
import SearchListingStack from '../screens/SearchListings';
import BuyerSellerHomesStack from '../screens/BuyerSellerHomes/BuyerSellerHomesStack';
import { HeaderBackButton, NotificationsButton } from '../components/buttons';

const TabNavigator = createBottomTabNavigator(
  {
    DashboardStack: BuyerSellerDashboardStack,
    BuyerSellerScheduledTours,
    BuyerSellerHomesStack,
    BuyerSellerScheduledShowings,
    SearchListingStack,
    SettingsStack: BuyerSellerSettingsStack,
  },
  {
    initialRouteName: 'DashboardStack',
    tabBarOptions: {
      safeAreaInset: { bottom: 'never', top: 'never' },
      style: { backgroundColor: color.primary },
    },
  }
);

const TabNavigatorWithContext = props => {
  const [navigationParams, setNavigationParams] = useState(false);

  const [headerTitle, setHeaderTitle] = useState('About Time Tours');
  const [showBackBtn, setShowBackBtn] = useState(false);
  const [showSettingsBtn, setShowSettingsBtn] = useState(true);

  const {
    navigation,
    screenProps: { deepState, setDeepState },
  } = props;

  useEffect(() => {
    if (deepState) {
      const { path, queryParams } = deepState;

      setDeepState(false);
      navigation.navigate(path, queryParams);
    }
  }, [deepState]);

  useEffect(() => {
    navigation.setParams({ navigationParams });
  }, [navigationParams]);

  useEffect(() => {
    navigation.setParams({ headerTitle });
  }, [headerTitle]);

  useEffect(() => {
    navigation.setParams({ showBackBtn });
  }, [showBackBtn]);

  useEffect(() => {
    navigation.setParams({ showSettingsBtn });
  }, [showSettingsBtn]);

  return (
    <BuyerSellerTabContext.Provider
      value={{
        headerTitle,
        setHeaderTitle,
        showBackBtn,
        setShowBackBtn,
        showSettingsBtn,
        setShowSettingsBtn,
        navigationParams,
        setNavigationParams,
      }}
    >
      <TabNavigator {...props} />
    </BuyerSellerTabContext.Provider>
  );
};

class BuyerSellerBottomTabNavigator extends React.Component {
  static navigationOptions = ({ navigation }) => {
    const { setClientRequestCount, notificationCount, setNotificationCount, user } = navigation.getScreenProps();
    const navigationParams = navigation.getParam('navigationParams', false);

    if (!navigationParams) return { headerShown: false };

    const { headerTitle, showBackBtn, showSettingsBtn } = navigationParams;
    let { headerLeft, headerRight } = navigationParams;

    if (showBackBtn) {
      headerLeft = <HeaderBackButton />;
    } else if (!headerLeft) {
      headerLeft = <View />;
    }

    if (showSettingsBtn) {
      headerRight = (
        <NotificationsButton
          link="BuyerSellerNotifications"
          user={user}
          notificationCount={notificationCount}
          setNotificationCount={setNotificationCount}
          setClientRequestCount={setClientRequestCount}
        />
      );
    } else if (!headerRight) {
      headerRight = <View />;
    }

    const headerTitleElement = React.isValidElement(headerTitle) ? (
      headerTitle
    ) : (
      <HeaderText style={[tw.wFull, tw.textCenter]}>{headerTitle}</HeaderText>
    );

    return {
      headerShown: true,
      headerStyle: { backgroundColor: color.primary },
      headerTitle: headerTitleElement,
      headerRight,
      headerLeft,
    };
  };

  render() {
    return <TabNavigatorWithContext {...this.props} />;
  }
}

BuyerSellerBottomTabNavigator.router = TabNavigator.router;

const BuyerSellerTabNavigator = createStackNavigator(
  {
    BuyerSellerBottomTabNavigator,
  },
  {
    initialRouteName: 'BuyerSellerBottomTabNavigator',
    mode: 'modal',
    defaultNavigationOptions: {
      headerForceInset: { top: 'never' },
    },
  }
);

export default BuyerSellerTabNavigator;
