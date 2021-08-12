import React, { useEffect, useState } from 'react';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { View, Alert, TouchableOpacity, RefreshControl, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import dateformat from 'dateformat';
import { tw, color } from 'react-native-tailwindcss';
import Swipeable from 'react-native-swipeable-row';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ExpoNotifications from 'expo-notifications';
import { BodyText, FlexLoader } from '../components';
import { notificationService } from '../services';
import { ChevronRightIcon } from '../assets/images';

const Notifications = ({ isFocused, navigation, screenProps: { user, setNotificationCount } }) => {
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isFocused) {
      onRefresh();
    }
  }, [isFocused]);

  useEffect(() => {
    getNotifications();
  }, []);

  const getNotifications = async () => {
    try {
      const latestNotifications = await notificationService.queries.listUserNotifications(user.id);

      setNotifications(latestNotifications);
      setNotificationCount(0);
      await notificationService.mutations.clearUserNotificationCount(user.id);

      await ExpoNotifications.setBadgeCountAsync(0);
    } catch (error) {
      console.log("Error getting user's notifications: ", error);
    }

    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    getNotifications();
  };

  const routeToNotification = routeInfo => {
    try {
      const routeObj = JSON.parse(routeInfo);

      if (routeObj && routeObj.routeName) {
        const { routeName, routeParams: params, routeKey: key } = routeObj;

        const navigationOptions = {
          routeName,
          params: params || {},
        };

        if (key) {
          navigationOptions.key = key;
        }

        navigation.navigate(navigationOptions);
      }
    } catch (error) {
      console.log('Error routing to notification: ', error);
    }
  };

  const removeNotification = async id => {
    try {
      setDeleting(prevState => ({ ...prevState, [id]: true }));

      await notificationService.mutations.removeNotification(id);

      const updatedNotification = notifications.filter(notification => notification.id !== id);

      setNotifications(updatedNotification);
    } catch (error) {
      console.log('Error removing notification: ', error);
    }

    setDeleting(prevState => ({ ...prevState, [id]: false }));
  };

  const promptRemoveAll = () => {
    Alert.alert('Delete All Notifications', 'Are you sure you want to delete all of your notifications?', [
      {
        text: 'Cancel',
      },
      {
        text: 'Delete All',
        onPress: removeAllNotifications,
        style: 'destructive',
      },
    ]);
  };

  const removeAllNotifications = async () => {
    try {
      await notificationService.mutations.removeAllNotifications(user.id);

      setNotifications([]);
      setNotificationCount(0);
    } catch (error) {
      console.log('Error removing notification: ', error);
    }
  };

  const renderNotificationCard = ({ item: notification }) => {
    let date;

    if (notification.createdAt) {
      date = new Date(notification.createdAt * 1000).toLocaleString();
    } else {
      date = new Date().toLocaleString();
    }

    const createdStr = dateformat(date, 'mm/dd/yyyy h:MMtt');

    return (
      <Swipeable
        rightButtons={[
          <TouchableOpacity
            onPress={() => removeNotification(notification.id)}
            style={[tw.w20, tw.hFull, tw.flexCol, tw.itemsCenter, tw.justifyCenter, tw.bgRed500]}
          >
            {deleting && deleting[notification.id] ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <FontAwesome5 name="trash" color="white" style={[tw.text2xl]} />
            )}
          </TouchableOpacity>,
        ]}
      >
        <TouchableOpacity
          onPress={() => routeToNotification(notification.routeInfo)}
          disabled={!notification.routeInfo}
          style={[tw.shadow, tw.wFull, tw.minH18, tw.bgGray100, tw.mY1, tw.pX6, tw.flexRow]}
        >
          <View style={[tw.wFull, tw.minH16, tw.flexRow, tw.itemsCenter]}>
            <View style={[tw.flex1, tw.pY2]}>
              <BodyText style={[tw.mB1]} bold>
                {notification.title ? `${notification.title} - ${createdStr}` : createdStr}
              </BodyText>
              <BodyText>{notification.body}</BodyText>
            </View>
            <View>
              {notification.routeInfo ? (
                <ChevronRightIcon width={18} height={18} fill={color.blue400} stroke={color.white} />
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <>
      <NavigationEvents
        onWillFocus={() => {
          if (navigation) {
            navigation.setParams({
              headerRight: (
                <TouchableOpacity
                  onPress={promptRemoveAll}
                  style={[tw.flexCol, tw.justifyCenter, tw.itemsCenter, tw.pR5]}
                >
                  <FontAwesome5 name="trash" color={color.gray900} style={[tw.textXl]} />
                </TouchableOpacity>
              ),
            });
          }
        }}
      />
      {loading ? (
        <FlexLoader />
      ) : (
        <SafeAreaView style={[tw.bgPrimary, tw.hFull]}>
          <FlatList
            data={notifications}
            renderItem={renderNotificationCard}
            keyExtractor={notification => `notification-${notification.id}`}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={[tw.flexCol, tw.mT16, tw.itemsCenter, tw.justifyCenter]}>
                <BodyText>No Notifications</BodyText>
              </View>
            }
          />
        </SafeAreaView>
      )}
    </>
  );
};

export default withNavigationFocus(Notifications);
