import React from 'react';
import { View } from 'react-native';
import { tw } from 'react-native-tailwindcss';

const CheckboxCircle = ({
  checked,
  borderColor = tw.borderBlue400,
  color = tw.bgBlue400,
  style = {},
  sm,
  md,
  lg,
  xl,
}) => {
  let width = tw.w6;
  let innerWidth = tw.w6;
  let height = tw.w6;
  let innerHeight = tw.w6;

  if (sm) {
    width = tw.w4;
    height = tw.h4;
    innerWidth = tw.w3;
    innerHeight = tw.h3;
  }

  if (md) {
    width = tw.w5;
    height = tw.h5;
    innerWidth = tw.w3;
    innerHeight = tw.h3;
  }

  if (lg) {
    width = tw.w8;
    height = tw.h8;
    innerWidth = tw.w7;
    innerHeight = tw.h7;
  }
  if (xl) {
    width = tw.w12;
    height = tw.h12;
    innerWidth = tw.w11;
    innerHeight = tw.h11;
  }
  const cardIcon = checked ? (
    <View
      style={[width, height, tw.roundedFull, tw.bgPrimary, tw.border, borderColor, tw.itemsCenter, tw.justifyCenter]}
    >
      <View style={[innerWidth, innerHeight, tw.roundedFull, color, tw.border, borderColor]} />
    </View>
  ) : (
    <View
      style={[
        width,
        height,
        tw.roundedFull,
        tw.bgPrimary,
        tw.border,
        tw.border2,
        borderColor,
        tw.itemsCenter,
        tw.justifyCenter,
      ]}
    />
  );

  return <View style={style}>{cardIcon}</View>;
};

export default CheckboxCircle;
