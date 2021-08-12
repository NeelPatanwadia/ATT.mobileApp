import React from 'react';
import { View } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { BodyText } from './textComponents';

const CustomPill = ({ containerStyle }) => (
  <View style={[tw.roundedFull, tw.bgTeal500, tw.pY1, tw.w16, containerStyle]}>
    <BodyText style={[tw.textWhite, tw.wFull, tw.textCenter]} xs>
      Custom
    </BodyText>
  </View>
);

export default CustomPill;
