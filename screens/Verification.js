import React, { useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { tw } from 'react-native-tailwindcss';
import { Auth } from 'aws-amplify';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { transformPhoneToCognito } from '../helpers';
import { userService } from '../services';
import { BodyText, PrimaryButton, PhoneInput, SecondaryButton, PrimaryInput } from '../components';
import { Logo } from '../assets/images';

const Verification = ({ navigation, screenProps: { user, setUser } }) => {
  const [loading, setLoading] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(navigation.getParam('phoneNumber') || '');
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [isEditable, setIsEditable] = useState(!navigation.getParam('phoneNumber'));
  const [codeSent, setCodeSent] = useState(false);
  const [currentUserPhoneVerified, setCurrentUserPhoneVerified] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    fetchAuthUser();
  }, []);

  const fetchAuthUser = async () => {
    const userPoolUser = await Auth.currentUserPoolUser();

    if (userPoolUser && userPoolUser.attributes && userPoolUser.attributes.phone_number_verified) {
      setCurrentUserPhoneVerified(userPoolUser.attributes.phone_number_verified);
    }
    setAuthUser(userPoolUser);
  };

  const validatePhoneNumber = () => {
    if (!phoneNumber) {
      setPhoneNumberError('Cell Phone Number is required');

      return false;
    }

    if (phoneNumber.length !== 12) {
      setPhoneNumberError('Please enter phone number in this format: XXX-XXX-XXXX');

      return false;
    }

    setPhoneNumberError('');

    return true;
  };

  const validateCode = () => {
    if (!code) {
      setCodeError('Verification code is required to continue');

      return false;
    }
  };

  const onEditClick = () => {
    setIsEditable(!isEditable);
  };

  const onCancelClick = () => {
    setIsEditable(!isEditable);
  };

  const verifyPhoneNumber = async () => {
    Auth.verifyUserAttribute(authUser, 'phone_number')
      .then(res => {
        setCodeSent(true);
      })
      .catch(error => {
        console.error(error);
      });

    setPhoneNumber(phoneNumber);
  };

  const confirmAttribute = async () => {
    setLoading(true);

    try {
      await Auth.verifyUserAttributeSubmit(authUser, 'phone_number', code);

      setCurrentUserPhoneVerified(true);

      setLoading(false);
      navigation.navigate(navigation.getParam('returnScreen') || 'UserLoading');
    } catch (error) {
      setLoading(false);
      setCodeError(error.message || 'There was an error confirming your code. Please try again.');
    }
  };

  const onUpdateClick = async () => {
    setLoading(true);
    try {
      const res = await Auth.updateUserAttributes(authUser, {
        phone_number: transformPhoneToCognito(phoneNumber),
      });

      setLoading(false);
      setIsEditable(false);
      if (res === 'SUCCESS') {
        setCodeSent(true);

        const updatedUser = {
          id: user.id,
          cellPhone: phoneNumber,
        };

        const dbUser = await userService.mutations.updateUser(updatedUser);

        setUser(dbUser);
        verifyPhoneNumber();
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
      setIsEditable(true);
    }
  };

  return (
    <KeyboardAwareScrollView style={[tw.hFull, tw.bgPrimary]}>
      <SafeAreaView style={[tw.flexCol, tw.flex1, tw.pX8, tw.mT10, tw.bgPrimary]}>
        <View style={[tw.flexCol, tw.justifyEnd, tw.alignCenter, tw.wFull]}>
          <Image source={Logo} style={[tw.h32, tw.wFull, tw.mB10]} resizeMode="contain" />
        </View>
        <View style={[tw.flexCol]}>
          <BodyText>
            We need to verify your phone number for app functionality. Please enter your phone number then press the
            Verify button and enter your verification code.
          </BodyText>
          <View style={[tw.flexRow, tw.pR12]}>
            <PhoneInput
              editable={isEditable}
              placeholder="Phone number"
              onChangeText={setPhoneNumber}
              value={phoneNumber}
              onBlur={validatePhoneNumber}
              errorMessage={phoneNumberError}
              returnKeyType="default"
            />
            <SecondaryButton
              onPress={isEditable ? onCancelClick : onEditClick}
              style={[tw.mL4]}
              title={isEditable ? 'Cancel' : 'Edit'}
            />
          </View>
          {isEditable && (
            <PrimaryButton
              onPress={onUpdateClick}
              title="Update"
              disabled={!phoneNumber}
              loading={loading}
              loadingTitle="Updating"
            />
          )}
          {codeSent && !isEditable && (
            <View style={[tw.w100]}>
              <BodyText>Verification Code</BodyText>
              <PrimaryInput
                placeholder="Code"
                onChangeText={setCode}
                value={code}
                onBlur={validateCode}
                errorMessage={codeError}
                keyboardType="numeric"
                returnKeyType="default"
              />
              <BodyText style={[tw.textXs, tw.mB2, tw.mT6]}>
                If you don't receive a confirmation code within 5 minutes please request a new code by clicking "Resend
                verification code"
              </BodyText>
            </View>
          )}
        </View>
        {!isEditable && !codeSent && (
          <>
            <PrimaryButton
              style={[tw.wFull, tw.selfCenter]}
              title="Verify"
              onPress={verifyPhoneNumber}
              disabled={currentUserPhoneVerified || !phoneNumber}
              loading={loading}
              loadingTitle="Verifying"
            />
            {currentUserPhoneVerified && (
              <BodyText medium center style={[tw.textBlue500, tw.flex1]}>
                Your current phone number is verified
              </BodyText>
            )}
            <BodyText style={[tw.textXs, tw.mB2, tw.mT2]}>
              If you don't receive a confirmation code within 5 minutes after pressing "Verify" please request a new
              code by pressing "Resend verification code"
            </BodyText>
          </>
        )}
        {codeSent && !isEditable && (
          <>
            <PrimaryButton
              style={[tw.wFull, tw.selfCenter]}
              title="Confirm"
              onPress={confirmAttribute}
              disabled={!code}
              loading={loading}
              loadingTitle="Confirming"
            />
            <View style={[tw.flexRow, tw.itemsCenter, tw.mB16]}>
              <SecondaryButton
                style={[tw.wFull, tw.mL2]}
                textStyle={[tw.textLeft, tw.underline]}
                title="Resend verification code"
                onPress={() => verifyPhoneNumber()}
              />
            </View>
          </>
        )}
      </SafeAreaView>
    </KeyboardAwareScrollView>
  );
};

export default Verification;
