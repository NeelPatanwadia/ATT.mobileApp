import React from 'react';
import { tw } from 'react-native-tailwindcss';
import { View, Platform } from 'react-native';
import { BodyText } from '../textComponents';

const Badge = ({ count, noCountNeeded, md, absolute }) => {
  if (!count && !noCountNeeded) {
    return null;
  }

  return (
    <View
      style={[
        tw.flexCol,
        tw.itemsCenter,
        tw.justifyCenter,
        tw.bgRed500,
        tw.roundedFull,
        absolute ? tw.absolute : null,
        tw.top0,
        tw.right0,
        tw.border2,
        tw.borderWhite,
        noCountNeeded ? tw.w4 : tw.wAuto,
        noCountNeeded ? tw.h4 : tw.hAuto,
      ]}
    >
      {!noCountNeeded ? (
        <BodyText
          style={[
            tw.textWhite,
            {
              marginLeft: md ? 8 : 6,
              marginRight: md ? 8 : 6,
              marginTop: md && Platform.OS === 'ios' ? 3 : 1,
              marginBottom: md ? 3 : 1,
            },
          ]}
          md={md}
          sm={!md}
        >
          {count}
        </BodyText>
      ) : null}
    </View>
  );
};

export default Badge;
