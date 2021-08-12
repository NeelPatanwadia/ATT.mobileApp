import React from 'react';
import { colors, tw } from 'react-native-tailwindcss';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { BodyText } from '../textComponents';

const SecondaryButton = ({ disabled, onPress, title, icon, loading, style = [], textStyle = [] }) => (
  <TouchableOpacity
    style={[tw.h10, tw.flexRow, tw.mY4, tw.rounded, tw.justifyCenter, tw.itemsCenter, ...style]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    {title && (
      <BodyText center style={[tw.textMd, ...textStyle]}>
        {title}
      </BodyText>
    )}
    {loading ? <ActivityIndicator size="small" color={colors.gray500} style={[tw.mL2]} /> : icon}
  </TouchableOpacity>
);

export default SecondaryButton;
