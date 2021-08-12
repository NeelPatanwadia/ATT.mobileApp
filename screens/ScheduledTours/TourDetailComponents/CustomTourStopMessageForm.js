import React from 'react';
import { View } from 'react-native';
import { tw } from 'react-native-tailwindcss';

import { PrimaryInput } from '../../../components';

const CustomMessageForm = ({ customMessage, setCustomMessage }) => (
  <View style={[tw.mT4, tw.mB20, tw.bgPrimary]}>
    <PrimaryInput
      style={[tw.textMd, tw.pX4, tw.pY4, tw.textGray700, tw.border, tw.borderGray700, { minHeight: 150 }]}
      placeholder="Enter Message"
      onChangeText={setCustomMessage}
      value={customMessage}
      multiline
      maxLength={255}
    />
  </View>
);

export default CustomMessageForm;
