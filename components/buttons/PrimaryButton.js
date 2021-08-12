import React from 'react';
import { tw } from 'react-native-tailwindcss';
import { TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { BodyText } from '../textComponents';

const PrimaryButton = ({
  activeOpacity = 0.7,
  disabled,
  onPress,
  title,
  style = [],
  textStyle = [],
  leftIcon,
  rightIcon,
  loading,
  loadingTitle,
  hideIndicator = false,
}) => (
  <TouchableOpacity
    style={[
      disabled ? tw.bgGray400 : tw.bgBlue500,
      tw.mY2,
      tw.justifyCenter,
      tw.rounded,
      tw.shadow,
      tw.h10,
      tw.wFull,
      tw.selfCenter,
      tw.flexRow,
      ...style,
    ]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={activeOpacity}
  >
    {leftIcon && <View style={[tw.w12, tw.selfCenter, tw.pL2]}>{leftIcon}</View>}
    {title && (
      <BodyText
        bold
        center
        style={[
          tw.flex1,
          tw.textWhite,
          tw.selfCenter,
          tw.trackingNormal,
          tw.textMd,
          tw.uppercase,
          tw.trackingTight,
          tw.relative,
          leftIcon && !rightIcon && tw._mL12,
          rightIcon && !leftIcon && tw._mR12,
          ...textStyle,
        ]}
      >
        {loading && loadingTitle ? loadingTitle : title}
      </BodyText>
    )}
    {rightIcon && !loading && <View style={[tw.w12, tw.selfCenter, tw.pL2]}>{rightIcon}</View>}

    {loading && !hideIndicator && (
      <View style={[tw.flexCol, tw.justifyCenter, tw.pR4, tw.hFull, tw.absolute, tw.right0]}>
        <ActivityIndicator size="small" color="white" />
      </View>
    )}
  </TouchableOpacity>
);

export default PrimaryButton;
