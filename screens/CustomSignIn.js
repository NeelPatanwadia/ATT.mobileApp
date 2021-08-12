import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Switch,
  AsyncStorage,
  Image,
} from 'react-native';

import { Auth } from 'aws-amplify';
import { tw, color } from 'react-native-tailwindcss';
import { BodyText, PrimaryButton, SecondaryButton, PrimaryInput } from '../components';
import { Logo } from '../assets/images';

let isMounted = false;

const CustomSignIn = ({ onStateChange, authState }) => {
  const passwordField = useRef(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    isMounted = true;
    checkRememberMe();

    return () => (isMounted = false);
  }, []);

  const checkRememberMe = async () => {
    if (!isMounted) {
      return;
    }

    const rememberMeSavedOption = await AsyncStorage.getItem('rememberMe');

    if (rememberMeSavedOption === 'true' && isMounted) {
      setRememberMe(true);

      const savedUsername = await AsyncStorage.getItem('savedUsername');

      if (savedUsername && isMounted) {
        setUsername(savedUsername);
      }
    }
  };

  const toggleRememberMe = async value => {
    if (!isMounted) {
      return;
    }

    setRememberMe(value);

    await AsyncStorage.setItem('rememberMe', value.toString());

    if (value) {
      await AsyncStorage.setItem('savedUsername', username);
    } else {
      await AsyncStorage.setItem('savedUsername', '');
    }
  };

  const updateSavedUsername = async () => {
    if (rememberMe) {
      await AsyncStorage.setItem('savedUsername', username);
    }
  };

  const signIn = async () => {
    setLoading(true);

    try {
      await Auth.signIn({ username: username.trim(), password: password.trim() });
      setUsername('');
      setPassword('');
    } catch (error) {
      console.log('ERROR: ', error);
      if (error.message === 'User is not confirmed.') {
        Auth.resendSignUp(username.trim());
        onStateChange('confirmSignUp', { username: username.trim(), password: password.trim() });
        setUsername('');
        setPassword('');
      } else {
        setErrorMessage(error.message || 'Error Signing In');
      }
    }

    setLoading(false);
  };

  const focusPassword = () => {
    passwordField.current.focus();
  };

  if (authState !== 'signIn') return null;

  return (
    <KeyboardAvoidingView
      enabled
      behavior="position"
      keyboardVerticalOffset={-200}
      style={[tw.wFull, tw.hFull, tw.bgPrimary]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView style={[tw.selfCenter, tw.pT16, tw.pX8]}>
          <View style={[tw.flexRow, tw.wFull, tw.justifyCenter]}>
            <Image source={Logo} style={[tw.h24, tw.wFull, tw.mB8]} resizeMode="contain" />
          </View>
          <BodyText xl center style={[tw.mY6]}>
            We're glad you are here!
          </BodyText>
          <View style={[tw.mT8]}>
            <BodyText style={[tw.mL2]}>Email</BodyText>
            <PrimaryInput
              placeholder=""
              onChangeText={newUsername => setUsername(newUsername.toLocaleLowerCase())}
              keyboardType="email-address"
              returnKeyType="next"
              value={username}
              onSubmitEditing={focusPassword}
              onBlur={updateSavedUsername}
            />
            <BodyText style={[tw.mL2, tw.mT6]}>Password</BodyText>
            <PrimaryInput
              ref={passwordField}
              placeholder=""
              secureTextEntry
              secureText={secureText}
              setSecureText={setSecureText}
              onChangeText={newPassword => setPassword(newPassword)}
              value={password}
            />
            <View style={[tw.flexRow, tw.justifyBetween, tw.itemsCenter, tw.mX2, tw.mT6]}>
              <BodyText>Remember Me</BodyText>
              <Switch value={rememberMe} onValueChange={toggleRememberMe} trackColor={{ true: color.blue500 }} />
            </View>
            <View style={[tw.h6, tw.justifyCenter]}>
              <BodyText center style={[tw.textBlue500]}>
                {errorMessage}
              </BodyText>
            </View>
          </View>

          <PrimaryButton
            title="Next"
            style={[tw.wFull, tw.selfCenter]}
            onPress={signIn}
            disabled={!username || !password}
            loading={loading}
          />

          <View style={[tw.flexRow, tw.justifyStart]}>
            <SecondaryButton
              style={[tw.w1_2]}
              textStyle={[tw.textLeft]}
              title="Create Account"
              onPress={() => onStateChange('signUp', null)}
            />
            <SecondaryButton
              style={[tw.w1_2]}
              textStyle={[tw.textRight]}
              title="Forgot Password"
              onPress={() => onStateChange('forgotPassword', null)}
            />
          </View>
          <View style={[tw.h24]} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default CustomSignIn;
