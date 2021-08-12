import React, { useState } from 'react';
import { View, Image } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { tw } from 'react-native-tailwindcss';
import { Auth } from 'aws-amplify';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { BodyText, PrimaryInput, PrimaryButton, SecondaryButton } from '../components';
import { Logo } from '../assets/images';

const CustomConfirmSignUp = ({ authState, authData }) => {
  const [loading, setLoading] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [confirmationCodeError, setConfirmationCodeError] = useState('');

  const validateConfirmationCode = () => {
    if (!confirmationCode) {
      setConfirmationCodeError('Confirmation code is required to continue');

      return false;
    }
  };

  const confirmSignup = async () => {
    setLoading(true);

    try {
      await Auth.confirmSignUp(authData.username, confirmationCode);
      await Auth.signIn(authData);
      setConfirmationCode('');
      setConfirmationCodeError('');
    } catch (error) {
      console.log(error);

      setConfirmationCodeError('There was an error confirming your code. Please try again.');
    }
    setLoading(false);
  };

  if (authState !== 'confirmSignUp') return null;

  return (
    <KeyboardAwareScrollView style={[tw.bgPrimary]}>
      <SafeAreaView style={[tw.flexCol, tw.flex1, tw.pX8, tw.bgPrimary]}>
        <View style={[tw.flexRow, tw.wFull, tw.justifyCenter, tw.mT10]}>
          <Image source={Logo} style={[tw.h24, tw.wFull, tw.mB8]} resizeMode="contain" />
        </View>
        <View style={(tw.flexCol, tw.flex1)}>
          <BodyText style={[tw.textCenter, tw.mT6, tw.mB6]}>
            Please enter the confirmation code sent to the email entered on sign up.
          </BodyText>
          <PrimaryInput
            placeholder="Confirmation code"
            onChangeText={setConfirmationCode}
            value={confirmationCode}
            onBlur={validateConfirmationCode}
            errorMessage={confirmationCodeError}
            returnKeyType="default"
          />
          <BodyText style={[tw.textXs, tw.mB2, tw.mT6]}>
            If you don't receive a confirmation code within 5 minutes please request a new code by clicking "Resend
            verification code"
          </BodyText>
        </View>
        <PrimaryButton
          style={[tw.wFull, tw.selfCenter]}
          title="Verify"
          onPress={confirmSignup}
          disabled={!confirmationCode}
          loading={loading}
          loadingTitle="Verifying"
        />
        <View style={[tw.flexRow, tw.itemsCenter, tw.mB16]}>
          <SecondaryButton
            style={[tw.wFull]}
            textStyle={[tw.textLeft, tw.underline]}
            title="Resend verification code"
            onPress={() => Auth.resendSignUp(authData.username)}
          />
        </View>
      </SafeAreaView>
    </KeyboardAwareScrollView>
  );
};

export default CustomConfirmSignUp;
