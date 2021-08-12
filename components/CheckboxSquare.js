import React from 'react';
import { View } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { CheckmarkIcon } from '../assets/images';

const CheckboxSquare = ({ checked, borderColor = tw.borderBlue400, style = {}, sm, lg, xl }) => {
  let width = tw.w6;
  let height = tw.w6;

  if (sm) {
    width = tw.w4;
    height = tw.h4;
  }
  if (lg) {
    width = tw.w8;
    height = tw.h8;
  }
  if (xl) {
    width = tw.w12;
    height = tw.h12;
  }
  const cardIcon = checked ? (
    <View
      style={[
        width,
        height,
        tw.rounded,
        tw.bgPrimary,
        tw.border,
        borderColor,
        tw.itemsCenter,
        tw.justifyCenter,
        tw.pB1,
        tw.pL1,
      ]}
    >
      <CheckmarkIcon width={24} height={24} fill={color.blue500} />
    </View>
  ) : (
    <View
      style={[
        width,
        height,
        tw.rounded,
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

export default CheckboxSquare;
