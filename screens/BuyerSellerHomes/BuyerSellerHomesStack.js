import React from 'react';
import { View, Platform } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack';
import { tw } from 'react-native-tailwindcss';

import BuyerSellerHomes from './BuyerSellerHomes';
import { HomesIconOutline, HomesIconSolid } from '../../assets/images/tab-icons';
import { PropertiesOfInterestBadge } from '../../components';

const BuyerSellerHomesStack = createStackNavigator(
  {
    BuyerSellerHomes,
  },
  {
    initialRouteName: 'BuyerSellerHomes',
    defaultNavigationOptions: { headerShown: false },
  }
);

const StackWithHomes = props => <BuyerSellerHomesStack {...props} />;

StackWithHomes.navigationOptions = navigation => ({
  tabBarLabel: <View />,
  tabBarIcon: ({ focused }) => {
    const { propertiesOfInterestNotSeen, setPropertiesOfInterestNotSeen, user } = navigation.screenProps;

    let icon = <HomesIconOutline width={28} height={28} stroke="#424242" />;

    if (Platform.OS === 'android') {
      icon = <HomesIconOutline width={28} height={28} stroke="#424242" />;
    }

    if (focused) {
      icon = <HomesIconSolid width={28} height={28} />;
    }

    return (
      <View style={[tw.relative, tw.flexCol, tw.itemsCenter, tw.justifyCenter, { width: 50, height: 40 }]}>
        {icon}
        {user && (
          <PropertiesOfInterestBadge
            propertiesOfInterestNotSeen={propertiesOfInterestNotSeen}
            setPropertiesOfInterestNotSeen={setPropertiesOfInterestNotSeen}
            user={user}
          />
        )}
      </View>
    );
  },
});

StackWithHomes.router = BuyerSellerHomesStack.router;

export default StackWithHomes;
