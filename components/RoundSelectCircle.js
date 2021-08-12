import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { tw } from 'react-native-tailwindcss';

const RoundSelectCircle = ({
  selected,
  borderColor = tw.borderBlue400,
  color = tw.bgBlue400,
  style = {},
  onPress,
  sm,
  md,
  lg,
  xl,
}) => {
  let width = tw.w6;
  let height = tw.w6;

  if (sm) {
    width = tw.w4;
    height = tw.h4;
  }

  if (md) {
    width = tw.w5;
    height = tw.h5;
  }

  if (lg) {
    width = tw.w8;
    height = tw.h8;
  }

  if (xl) {
    width = tw.w12;
    height = tw.h12;
  }

  const cardIcon = selected ? (
    <View
      style={[
        width,
        height,
        tw.roundedFull,
        tw.bgWhite,
        color,
        tw.border,
        borderColor,
        tw.itemsCenter,
        tw.justifyCenter,
      ]}
    />
  ) : (
    <View
      style={[
        width,
        height,
        tw.roundedFull,
        tw.bgWhite,
        tw.border,
        tw.border2,
        borderColor,
        tw.itemsCenter,
        tw.justifyCenter,
      ]}
    />
  );

  return (
    <TouchableOpacity onPress={onPress} style={style}>
      {cardIcon}
    </TouchableOpacity>
  );
};

export default RoundSelectCircle;
