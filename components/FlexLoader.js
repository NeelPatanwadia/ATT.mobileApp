import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { colors, tw } from 'react-native-tailwindcss';
import { BodyText } from './textComponents';

export default function FlexLoader({ loadingText }) {
  return (
    <View style={[tw.flexCol, tw.flex1, tw.justifyCenter, tw.itemsCenter, tw.bgPrimary]}>
      {loadingText ? <BodyText style={[tw.textCenter, tw.wFull, tw.mB8]}>{loadingText}</BodyText> : null}
      <ActivityIndicator size="large" color={colors.gray500} />
    </View>
  );
}
