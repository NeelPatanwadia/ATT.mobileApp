import React, { useState, useEffect, useCallback } from 'react';
import { createStackNavigator } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import { TouchableOpacity, View, Platform, AsyncStorage, AppState } from 'react-native';
import { tw, color } from 'react-native-tailwindcss';
import { StackActions } from 'react-navigation';
import { BodyText, HeaderText } from '../components';
import { ChevronLeftIcon } from '../assets/images';
import AgentTabContext from './AgentTabContext';

import { AgentSettingsStack, AgentDashboardStack } from './stacks';

import { AgentClientsStack } from '../screens/AgentClients';
import { ScheduledToursStack } from '../screens/ScheduledTours';
import ScheduledShowingsStack from '../screens/ScheduledShowings';
import SearchListingStack from '../screens/SearchListings';
import NotificationsButton from '../components/buttons/NotificationsButton';

import { AsyncStorageKeys, SettingsCodeNames, SUBSCRIPTION_CHECK_INTERVAL } from '../constants/AppConstants';
import { logEvent, EVENT_TYPES, APP_REGIONS } from '../helpers/logHelper';
import { settingService, subscriptionService } from '../services';

const TabNavigator = createBottomTabNavigator(
  {
    DashboardStack: AgentDashboardStack,
    ScheduledToursStack,
    AgentClientsStack,
    ScheduledShowingsStack,
    SearchListingStack,
    SettingsStack: AgentSettingsStack,
  },
  {
    initialRouteName: 'DashboardStack',
    tabBarOptions: {
      safeAreaInset: { bottom: 'never', top: 'never' },
      style: { backgroundColor: color.primary },
    },
    defaultNavigationOptions: {
      headerForceInset: { top: 'never' },
    },
  }
);

const TabNavigatorWithContext = props => {
  const [navigationParams, setNavigationParams] = useState(false);

  const [headerTitle, setHeaderTitle] = useState('About Time Tours');
  const [showBackBtn, setShowBackBtn] = useState(false);
  const [showEditBtn, setShowEditBtn] = useState(true);
  const [editTitle, setEditTitle] = useState('Edit');
  const [showSettingsBtn, setShowSettingsBtn] = useState(true);
  const onEditPress = useCallback();

  const {
    navigation,
    screenProps: { deepState, setDeepState, user },
  } = props;

  useEffect(() => {
    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, []);

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
    navigation.setParams({ editTitle });
  }, [editTitle]);

  useEffect(() => {
    navigation.setParams({ showBackBtn });
  }, [showBackBtn]);

  useEffect(() => {
    navigation.setParams({ showEditBtn });
  }, [showEditBtn]);

  useEffect(() => {
    navigation.setParams({ onEditPress });
  }, [onEditPress]);

  useEffect(() => {
    navigation.setParams({ showSettingsBtn });
  }, [showSettingsBtn]);

  const handleAppStateChange = newState => {
    if (newState === 'active') {
      checkAgentSubscriptionStatus();
    }
  };

  const checkAgentSubscriptionStatus = async () => {
    try {
      if (!user) {
        return;
      }

      let needsCheck = true;

      const now = Number.parseInt(new Date().getTime());
      const lastCheckTimeStr = await AsyncStorage.getItem(AsyncStorageKeys.AgentSubscriptionCheckTime);

      console.log('LAST CHECKED TIME IS: ', lastCheckTimeStr);

      if (lastCheckTimeStr) {
        const lastTimeCheck = Number.parseInt(lastCheckTimeStr);

        console.log('IS TIME FOR NEW CHECK: ', now, lastTimeCheck, now - lastTimeCheck, SUBSCRIPTION_CHECK_INTERVAL);

        if (now - lastTimeCheck <= SUBSCRIPTION_CHECK_INTERVAL) {
          needsCheck = false;
        }
      }

      if (needsCheck) {
        await logEvent({
          message: `VERIFYING SUBSCRIPTION STATUS ON APP CHANGE`,
          appRegion: APP_REGIONS.AGENT_SUBSCRIPTION,
          eventType: EVENT_TYPES.INFO,
        });

        const subscriptionStatus = await subscriptionService.queries.getSubscriptionStatus(user.id);

        if (subscriptionStatus.isActive) {
          const checkTime = `${new Date().getTime()}`;

          console.log('SETTING LAST CHECK TIME TO: ', checkTime);

          await AsyncStorage.setItem(AsyncStorageKeys.AgentSubscriptionCheckTime, checkTime);
        } else {
          await logEvent({
            message: `SUBSCRIPTION EXPIRED WHILE APP WAS OPEN`,
            appRegion: APP_REGIONS.AGENT_SUBSCRIPTION,
            eventType: EVENT_TYPES.INFO,
          });

          const subscriptionsRequiredSetting = await settingService.queries.getSetting(
            SettingsCodeNames.SUBSCRIPTIONS_REQUIRED
          );

          if (
            subscriptionsRequiredSetting &&
            subscriptionsRequiredSetting.value &&
            subscriptionsRequiredSetting.value.toLowerCase() === 'true'
          ) {
            navigation.navigate('AgentSubscription');
          }
        }
      }
    } catch (error) {
      console.warn('Error checking ');

      await logEvent({
        message: `Error checking subscription status on interval, allowing user to continue using app. Error: ${JSON.stringify(
          error
        )}`,
        appRegion: APP_REGIONS.AGENT_SUBSCRIPTION,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  return (
    <AgentTabContext.Provider
      value={{
        headerTitle,
        setHeaderTitle,
        showBackBtn,
        setShowBackBtn,
        showEditBtn,
        setShowEditBtn,
        onEditPress,
        editTitle,
        setEditTitle,
        showSettingsBtn,
        setShowSettingsBtn,
        navigationParams,
        setNavigationParams,
      }}
    >
      <TabNavigator {...props} />
    </AgentTabContext.Provider>
  );
};

class AgentBottomTabNavigator extends React.Component {
  static navigationOptions = ({ navigation }) => {
    const { setClientRequestCount, notificationCount, setNotificationCount, user } = navigation.getScreenProps();

    const navigationParams = navigation.getParam('navigationParams', false);

    if (!navigationParams) return { headerShown: false };

    const {
      headerTitle,
      showBackBtn,
      showEditBtn,
      editTitle,
      onEditPress,
      showSettingsBtn,
      backRoute,
    } = navigationParams;
    let { headerLeft, headerRight } = navigationParams;

    if (showBackBtn) {
      headerLeft = (
        <TouchableOpacity
          title="text"
          hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
          onPress={() => {
            if (backRoute === 'ClientDetails') {
              navigation.dispatch(StackActions.pop(2));
              navigation.navigate(backRoute);
            } else if (backRoute === 'ScheduledTours') {
              navigation.navigate(backRoute);
            } else if (backRoute) {
              navigation.navigate(backRoute, { focus: false });
            } else {
              navigation.goBack(null);
            }
          }}
          style={[tw.pX4, tw.w16, tw.h12, tw.justifyCenter, Platform.select({ ios: tw.mB2, android: tw.mB0 })]}
        >
          <ChevronLeftIcon width={15} height={15} fill={color.gray700} />
        </TouchableOpacity>
      );
    }

    if (showEditBtn) {
      headerLeft = (
        <TouchableOpacity
          title="text"
          hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
          onPress={() => (onEditPress ? onEditPress() : {})}
          style={[tw.itemsCenter, tw.w16, tw.h12, tw.justifyCenter, Platform.select({ ios: tw.mB2, android: tw.mB0 })]}
        >
          <BodyText lg style={[tw.textBlue500]}>
            {editTitle}
          </BodyText>
        </TouchableOpacity>
      );
    }

    if (!headerLeft) {
      headerLeft = <View />;
    }

    if (showSettingsBtn) {
      headerRight = (
        <NotificationsButton
          link="AgentNotifications"
          user={user}
          setNotificationCount={setNotificationCount}
          notificationCount={notificationCount}
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
      headerForceInset: { top: 'never' },
      headerStyle: { backgroundColor: color.primary },
      headerShown: true,
      headerTitle: headerTitleElement,
      headerRight,
      headerLeft,
    };
  };

  render() {
    return <TabNavigatorWithContext {...this.props} />;
  }
}

AgentBottomTabNavigator.router = TabNavigator.router;

const AgentTabNavigator = createStackNavigator(
  {
    AgentBottomTabNavigator,
  },
  {
    initialRouteName: 'AgentBottomTabNavigator',
    mode: 'modal',
  }
);

export default AgentTabNavigator;
