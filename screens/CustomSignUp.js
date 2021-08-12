import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Image,
  Alert,
} from 'react-native';
import { Auth } from 'aws-amplify';
import { tw } from 'react-native-tailwindcss';
import { BodyText, PrimaryButton, SecondaryButton, PhoneInput, PrimaryInput } from '../components';
import { Logo } from '../assets/images';
import { VALID_PASSWORD_LENGTH } from '../constants/AppConstants';

const CustomSignUp = ({ onStateChange, authState }) => {
  const passwordField = useRef(null);
  const confirmPasswordField = useRef(null);
  const cellPhoneField = useRef(null);

  const inputFields = { passwordField, confirmPasswordField, cellPhoneField };

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cellPhone, setCellPhone] = useState('');
  const [cellPhoneError, setCellPhoneError] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmationError, setPasswordConfirmationError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (passwordError && password && password.length >= VALID_PASSWORD_LENGTH) {
      setPasswordError('');
    }

    if (passwordConfirmationError && password === passwordConfirmation) {
      setPasswordConfirmationError('');
    }
  }, [password, passwordConfirmation]);

  const focusInput = field => {
    inputFields[field].current.focus();
  };

  const confirmEmailAndPhoneAlert = () => {
    Alert.alert(
      'Confirm Email and Phone Number',
      `Please confirm that your email and phone number are correct before continuing with sign up.\n\nEMAIL\n${username}\n\nPHONE\n${cellPhone}`,
      [
        {
          text: 'Cancel',
        },
        {
          text: 'Confirm',
          onPress: signUp,
          style: 'default',
        },
      ]
    );
  };

  const signUp = async () => {
    try {
      setLoading(true);

      const cell = `+1${cellPhone.replace(/-/g, '')}`;

      await Auth.signUp({ username: username.trim(), password: password.trim(), attributes: { phone_number: cell } });
      onStateChange('confirmSignUp', { username: username.trim(), password: password.trim() });
      clearData();
    } catch (error) {
      console.log('error', error);
      if (error.code === 'UsernameExistsException') {
        try {
          await Auth.signIn({ username: username.trim(), password: password.trim() });
          clearData();
        } catch (signInError) {
          if (signInError.message === 'User is not confirmed.') {
            Auth.resendSignUp(username.trim());
            onStateChange('confirmSignUp', { username: username.trim(), password: password.trim() });
            clearData();
          } else {
            setErrorMessage('A user with this email already exists');
          }
        }
      } else {
        setErrorMessage(error.message || 'Error Creating Account');
      }
    }

    setLoading(false);
  };

  const clearData = () => {
    setUsername('');
    setPassword('');
    setCellPhone('');
    setCellPhoneError('');
    setPasswordConfirmation('');
    setPasswordError('');
    setPasswordConfirmationError('');
    setErrorMessage('');
  };

  const validatePassword = () => {
    if (password.length < VALID_PASSWORD_LENGTH) {
      setPasswordError('Password must be at least 8 characters');
    } else {
      setPasswordError('');
    }
  };

  const validatePasswordConfirmation = () => {
    if (password !== passwordConfirmation) {
      setPasswordConfirmationError('Passwords do not match');
    } else {
      setPasswordConfirmationError('');
    }
  };

  const validateCellPhone = () => {
    if (!cellPhone) {
      setCellPhoneError('Cell Phone Number is required');

      return false;
    }

    if (cellPhone.length !== 12) {
      setCellPhoneError('Please enter phone number in this format: XXX-XXX-XXXX');

      return false;
    }

    setCellPhoneError('');

    return true;
  };

  if (authState !== 'signUp') return null;

  return (
    <KeyboardAvoidingView
      enabled
      behavior="position"
      style={[tw.wFull, tw.hFull, tw.bgPrimary]}
      keyboardVerticalOffset={-136}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView style={[tw.selfCenter, tw.pT16, tw.pX8]}>
          <View style={[tw.flexRow, tw.wFull, tw.justifyCenter]}>
            <Image source={Logo} style={[tw.h24, tw.wFull, tw.mB8]} resizeMode="contain" />
          </View>
          <BodyText xl center style={[tw.mY6]}>
            Welcome! Create an account:
          </BodyText>
          <View style={[tw.mT8]}>
            <BodyText style={[tw.mL2]}>Email</BodyText>
            <PrimaryInput
              placeholder=""
              onChangeText={newUsername => setUsername(newUsername.toLocaleLowerCase())}
              value={username}
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => focusInput('cellPhoneField')}
            />
            <BodyText style={[tw.mL2, tw.mT6]}>Cell Phone Number</BodyText>
            <PhoneInput
              placeholder=""
              onChangeText={newCellPhone => setCellPhone(newCellPhone)}
              value={cellPhone}
              keyboardType="number-pad"
              returnKeyType="next"
              errorMessage={cellPhoneError}
              onBlur={validateCellPhone}
              ref={cellPhoneField}
              onSubmitEditing={() => focusInput('passwordField')}
            />
            <Text style={[tw.textXs, tw.textGray700, tw.mL2, tw.mT4]}>
              Your number will be used solely for communication related to the app. It will not be used for unauthorized
              sales or marketing purposes.
            </Text>
            <BodyText style={[tw.mL2, tw.mT6]}>Password</BodyText>
            <PrimaryInput
              placeholder=""
              secureTextEntry
              onChangeText={newPassword => setPassword(newPassword)}
              onBlur={validatePassword}
              errorMessage={passwordError}
              value={password}
              ref={passwordField}
              returnKeyType="next"
              onSubmitEditing={() => focusInput('confirmPasswordField')}
            />
            <BodyText style={[tw.mL2, tw.mT6]}>Password Confirmation</BodyText>
            <PrimaryInput
              placeholder=""
              secureTextEntry
              onChangeText={newPasswordConfirmation => setPasswordConfirmation(newPasswordConfirmation)}
              onBlur={validatePasswordConfirmation}
              errorMessage={passwordConfirmationError}
              value={passwordConfirmation}
              ref={confirmPasswordField}
            />
            <Text style={[tw.textXs, tw.textGray700, tw.mL2, tw.mT4]}>Password must be at least 8 characters</Text>
            <View style={[tw.h8, tw.justifyCenter]}>
              <BodyText center style={[tw.textRed500]}>
                {errorMessage}
              </BodyText>
            </View>
          </View>
          <PrimaryButton
            style={[tw.wFull, tw.selfCenter]}
            title="Sign Up"
            onPress={confirmEmailAndPhoneAlert}
            disabled={!username || !password || password !== passwordConfirmation}
            loading={loading}
            loadingTitle="Signing Up"
          />
          <View style={[tw.flexRow, tw.itemsCenter, tw.mB16]}>
            <BodyText style={[tw.wAuto]}>Already have an account?</BodyText>
            <SecondaryButton
              style={[tw.w20, tw.mL2]}
              textStyle={[tw.textLeft, tw.underline]}
              title="Sign In"
              onPress={() => onStateChange('signIn', null)}
            />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default CustomSignUp;
