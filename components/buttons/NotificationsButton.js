import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { tw, color } from 'react-native-tailwindcss';
import { withNavigation } from 'react-navigation';
import { BellIcon } from '../../assets/images';
import NotificationCountBadge from '../badges/NotificationCountBadge';

const NotificationsButton = ({
  navigation,
  link,
  user,
  notificationCount,
  setNotificationCount,
  setClientRequestCount,
}) => (
  <TouchableOpacity
    title="text"
    onPress={() => navigation.navigate(link)}
    hitSlop={{ top: 10, right: 10, left: 10, bottom: 10 }}
    style={[
      tw.pY2,
      tw.w12,
      tw.pR3,
      tw.mR2,
      tw.flexRow,
      tw.relative,
      tw.justifyEnd,
      Platform.select({ ios: tw.mB1, android: tw.mB0 }),
    ]}
  >
    <BellIcon width={26} height={26} fill={color.gray700} />
    {user && (
      <NotificationCountBadge
        notificationCount={notificationCount}
        setNotificationCount={setNotificationCount}
        setClientRequestCount={setClientRequestCount}
        user={user}
      />
    )}
  </TouchableOpacity>
);

export default withNavigation(NotificationsButton);
