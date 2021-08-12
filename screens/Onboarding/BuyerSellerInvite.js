import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { BodyText, PrimaryInput, PrimaryButton, PhoneInput } from '../../components';
import { ChevronLeftIcon } from '../../assets/images';

const BuyerSellerInvite = ({ navigation, screenProps: { setUser } }) => {
  const [agentName, setAgentName] = useState('');
  const [agentCompany, setAgentCompany] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentEmail, setAgentEmail] = useState('');

  const inviteAgent = () => {
    const [firstName, ...lastNames] = agentName.split(' ');
    const lastName = lastNames.join(' ');
    const agent = {
      firstName,
      lastName,
      company: agentCompany,
      phone: agentPhone,
      email: agentEmail,
      logo: 'https://logopond.com/logos/139c9124428373a6868f08c8bdfa57ab.png',
    };
    const newUser = {
      agent,
      isAgent: false,
      onboardingComplete: true,
    };

    setUser(newUser);
    navigation.navigate('BuyerSellerConfirm');
  };

  return (
    <View style={[tw.relative]}>
      <TouchableOpacity style={[tw.mT8, tw.mL3, tw.flexRow, tw.itemsCenter]} onPress={() => navigation.goBack()}>
        <ChevronLeftIcon width={15} height={15} />
      </TouchableOpacity>
      <View style={[tw.flexRow, tw.wFull, tw.w5_6, tw.pT12, tw.pB8, tw.pL10]}>
        <BodyText>Invite Your Agent</BodyText>
      </View>
      <KeyboardAwareScrollView style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
        <View style={[tw.w5_6, tw.selfCenter]}>
          <BodyText style={[tw.mL3]}>Agent Name</BodyText>
          <PrimaryInput autoCapitalize="words" placeholder="" onChangeText={setAgentName} value={agentName} />
          <BodyText style={[tw.mL3, tw.mT6]}>Agent Company</BodyText>
          <PrimaryInput autoCapitalize="words" placeholder="" onChangeText={setAgentCompany} value={agentCompany} />
          <BodyText style={[tw.mL3, tw.mT6]}>Agent Cell Phone</BodyText>
          <PhoneInput placeholder="" value={agentPhone} onChangeText={setAgentPhone} />
          <BodyText style={[tw.mL3, tw.mT6]}>Agent Email</BodyText>
          <PrimaryInput placeholder="" onChangeText={setAgentEmail} value={agentEmail} />
          <PrimaryButton style={[tw.mT12]} title="Invite Agent" onPress={inviteAgent} />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default BuyerSellerInvite;
