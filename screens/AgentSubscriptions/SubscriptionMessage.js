import React from 'react';
import { Image, SafeAreaView, View } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { LogoWithText } from '../../assets/images';
import { BodyText, PrimaryButton } from '../../components';

const SubscriptionMessage = ({ navigation, screenProps: { user, signOut } }) => {
  let message =
    'Thanks for signing up!  Please log into the web to complete your subscription. Once finished, you may log into the mobile app.';

  if (user.isFreeVersionAccount) {
    message =
      'Thanks for you interest in our mobile app.\n  Your current subscription does not offer mobile app features.  Please click on the Upgrade button below to get all of the amazing mobile features that About Time Tours offers.';
  }

  return (
    <SafeAreaView style={[tw.flexCol, tw.flex1, tw.pX8, tw.bgPrimary]}>
      <View style={[tw.flex1, tw.flexCol, tw.justifyEnd, tw.alignCenter, tw.wFull]}>
        <Image source={LogoWithText} style={[tw.h48, tw.wFull]} resizeMode="contain" />
      </View>
      <View style={(tw.flexCol, tw.flex1)}>
        <BodyText center lg>
          {message}
        </BodyText>
        {user.isFreeVersionAccount && (
          <PrimaryButton
            title="UPGRADE"
            onPress={() => navigation.replace('SubscriptionOptions')}
            style={[tw.mTAuto]}
          />
        )}
        <PrimaryButton title="CANCEL" onPress={signOut} style={[tw.mB8, tw.mT2]} />
        {/* <PrimaryButton title="SIGN OUT" onPress={signOut} style={[tw.mB8, tw.mTAuto]} /> */}
      </View>
    </SafeAreaView>
  );
};

export default SubscriptionMessage;
