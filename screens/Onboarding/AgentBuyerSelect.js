import React from 'react';
import { View, Image } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { BodyText, PrimaryButton } from '../../components';
import { Logo } from '../../assets/images';

const AgentBuyerSelect = ({ navigation }) => (
  <View style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
    <View style={[tw.w5_6, tw.selfCenter, tw.pT16]}>
      <View style={[tw.flexRow, tw.wFull, tw.justifyCenter]}>
        <Image source={Logo} style={[tw.h24, tw.wFull, tw.mB8]} resizeMode="contain" />
      </View>
      <BodyText xl2 center style={[tw.mY12]}>
        We are glad you are here! Let’s finish setting up your account.
      </BodyText>
      <PrimaryButton
        style={[tw.mT8, tw.mB10]}
        title="I AM AN AGENT"
        onPress={() => navigation.navigate('AgentProfile')}
      />
      <PrimaryButton title="I'M A BUYER/SELLER" onPress={() => navigation.navigate('BuyerSellerProfile')} />
    </View>
  </View>
);

export default AgentBuyerSelect;
