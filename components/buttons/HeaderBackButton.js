import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { tw, color } from 'react-native-tailwindcss';
import { withNavigation } from 'react-navigation';
import { ChevronLeftIcon } from '../../assets/images';

const HeaderBackButton = ({ navigation }) => (
  <TouchableOpacity
    title="text"
    hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
    onPress={() => navigation.goBack(null)}
    style={[tw.pX4, tw.w16, tw.h12, tw.justifyCenter, Platform.select({ ios: tw.mB2, android: tw.mB0 })]}
  >
    <ChevronLeftIcon width={15} height={15} fill={color.gray700} />
  </TouchableOpacity>
);

export default withNavigation(HeaderBackButton);
