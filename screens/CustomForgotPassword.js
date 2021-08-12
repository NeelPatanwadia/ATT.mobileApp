import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableWithoutFeedback, Keyboard, ScrollView, KeyboardAvoidingView, Image } from 'react-native';
import { Auth } from 'aws-amplify';
import { tw } from 'react-native-tailwindcss';
import { BodyText, PrimaryButton, SecondaryButton, PrimaryInput } from '../components';
import { Logo } from '../assets/images';
import { VALID_PASSWORD_LENGTH } from '../constants/AppConstants';

const CustomForgotPassword = ({ onStateChange, authState }) => {
  const passwordField = useRef(null);
  const confirmPasswordField = useRef(null);

  const inputFields = { passwordField, confirmPasswordField };

  const [username, setUsername] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordConfirmationError, setPasswordConfirmationError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

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

  const sendResetCode = async () => {
    setSendingCode(true);

    try {
      await Auth.forgotPassword(username.trim());
      setResetCodeSent(true);
    } catch (error) {
      if (error.code === 'UserNotFoundException') {
        setErrorMessage('There are no registered users with this email');
      } else {
        setErrorMessage(error.message || 'Error sending reset code');
      }
    }

    setSendingCode(false);
  };

  const resetPassword = async () => {
    setResettingPassword(true);

    try {
      await Auth.forgotPasswordSubmit(username.trim(), resetCode, password.trim());

      try {
        await Auth.signIn({ username: username.trim(), password: password.trim() });
      } catch (error) {
        console.log('Error signing in after password change: ', error);
        onStateChange('signIn', null);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Error resetting password');
    }

    setResettingPassword(false);
  };

  const resetCodeForm = (
    <View>
      <View style={[tw.flexRow, tw.wFull, tw.justifyCenter]}>
        <Image source={Logo} style={[tw.h24, tw.wFull, tw.mB8]} resizeMode="contain" />
      </View>
      <BodyText xl2 center style={[tw.mY8]}>
        Dont worry! We'll send you a reset code.
      </BodyText>
      <View>
        <BodyText style={[tw.mL2]}>Email</BodyText>
        <PrimaryInput
          placeholder=""
          onChangeText={newUsername => setUsername(newUsername.toLocaleLowerCase())}
          keyboardType="email-address"
          value={username}
        />
        <View style={[tw.h8, tw.justifyCenter]}>
          <BodyText center style={[tw.textBlue500]}>
            {errorMessage}
          </BodyText>
        </View>
      </View>
      <PrimaryButton
        title="Send"
        style={[tw.wFull, tw.selfCenter]}
        onPress={sendResetCode}
        disabled={!username}
        loading={sendingCode}
        loadingTitle="Sending"
      />
    </View>
  );

  const passwordResetForm = (
    <View>
      <View style={[tw.flexRow, tw.wFull, tw.justifyCenter]}>
        <Image source={Logo} style={[tw.h24, tw.wFull, tw.mB8]} resizeMode="contain" />
      </View>
      <BodyText xl2 center style={[tw.mY8]}>
        Dont worry! We'll send you a reset code.
      </BodyText>
      <View>
        <BodyText style={[tw.mL2]}>Reset Code</BodyText>
        <PrimaryInput
          placeholder=""
          onChangeText={newResetCode => setResetCode(newResetCode)}
          value={resetCode}
          returnKeyType="next"
          onSubmitEditing={() => focusInput('passwordField')}
        />
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
        <Text style={[tw.textXS, tw.textGray700, tw.mL2, tw.mT4]}>Password must be at least 8 characters</Text>
        <View style={[tw.h8, tw.justifyCenter]}>
          <BodyText center style={[tw.textRed500]}>
            {errorMessage}
          </BodyText>
        </View>
      </View>
      <PrimaryButton
        title="Reset Password"
        style={[tw.wFull, tw.selfCenter]}
        onPress={resetPassword}
        disabled={!resetCode || !password || password !== passwordConfirmation}
        loading={resettingPassword}
        loadingTitle="Resetting Password"
      />
    </View>
  );

  const keyboardVerticalOffset = resetCodeSent ? -138 : -265;

  if (authState !== 'forgotPassword') return null;

  return (
    <KeyboardAvoidingView
      enabled
      behavior="position"
      style={[tw.wFull, tw.hFull, tw.bgPrimary]}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
          <View style={[tw.w5_6, tw.selfCenter, tw.pT16]}>
            {!resetCodeSent && resetCodeForm}
            {resetCodeSent && passwordResetForm}
            <View style={[tw.flexRow, tw.justifyStart, tw.mT2]}>
              <SecondaryButton
                style={[tw.w1_2]}
                textStyle={[tw.textLeft]}
                title="Sign In"
                onPress={() => onStateChange('signIn', null)}
              />
              <SecondaryButton
                style={[tw.w1_2]}
                textStyle={[tw.textRight]}
                title="Sign Up"
                onPress={() => onStateChange('signUp', null)}
              />
            </View>
            <View style={[tw.h12]} />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default CustomForgotPassword;
