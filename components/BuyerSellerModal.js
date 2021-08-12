import React from 'react';
import { withNavigation } from 'react-navigation';

const BuyerSellerModal = ({ navigation, trigger, title, children, style }) =>
  React.cloneElement(trigger, {
    onPress: () =>
      navigation.navigate('BuyerSellerModal', {
        content: children,
        navigation,
        style,
        title,
      }),
  });

export default withNavigation(BuyerSellerModal);
