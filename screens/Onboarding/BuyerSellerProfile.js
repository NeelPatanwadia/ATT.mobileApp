import React, { useState, useEffect, useRef } from 'react';
import { View, Image } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { PrimaryButton, PrimaryInput, BodyText } from '../../components';
import { Logo } from '../../assets/images';
import { userService } from '../../services';

const BuyerSellerProfile = ({ navigation, screenProps: { user, setUser } }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');

  const lastNameField = useRef(null);

  const inputFields = { lastNameField };

  const [validationErrors, setValidationErrors] = useState({
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    if (firstName) {
      validateFirstName();
    }
  }, [firstName]);

  useEffect(() => {
    if (lastName) {
      validateLastName();
    }
  }, [lastName]);

  const focusInput = field => {
    inputFields[field].current.focus();
  };

  const validateFirstName = () => {
    if (!firstName) {
      setValidationErrors(prevState => ({ ...prevState, firstName: 'First Name is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, firstName: '' }));

    return true;
  };

  const validateLastName = () => {
    if (!lastName) {
      setValidationErrors(prevState => ({ ...prevState, lastName: 'Last Name is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, lastName: '' }));

    return true;
  };

  const saveNavigate = async () => {
    try {
      setError('');

      if (!validateFirstName() || !validateLastName()) {
        setError('Please correct all errors before submitting');

        return;
      }
      setLoading(true);
      const { id } = user;

      await userService.mutations.updateUser({
        id,
        firstName,
        lastName,
        isAgent: false,
        onboardingComplete: true,
      });

      setUser({ ...user, firstName, lastName, isAgent: false, onboardingComplete: true });
      setLoading(false);
      navigation.navigate('BuyerSeller');
    } catch (error) {
      setLoading(false);
      setError('Error Saving Profile');
      console.warn('Error saving user information: ', error);
    }
  };

  return (
    <KeyboardAwareScrollView style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
      <View style={[tw.w5_6, tw.selfCenter, tw.pT16]}>
        <View style={[tw.flexRow, tw.wFull, tw.justifyCenter]}>
          <Image source={Logo} style={[tw.h24, tw.wFull, tw.mB8]} resizeMode="contain" />
        </View>
        <View style={[tw.mY8]}>
          <BodyText style={[tw.mL2]}>First Name</BodyText>
          <PrimaryInput
            placeholder=""
            onChangeText={setFirstName}
            value={firstName}
            onBlur={validateFirstName}
            errorMessage={validationErrors.firstName}
            returnKeyType="next"
            onSubmitEditing={() => focusInput('lastNameField')}
          />

          <BodyText style={[tw.mL2, tw.mT6]}>Last Name</BodyText>
          <PrimaryInput
            placeholder=""
            onChangeText={setLastName}
            value={lastName}
            onBlur={validateLastName}
            errorMessage={validationErrors.lastName}
            returnKeyType="next"
            ref={lastNameField}
          />

          <View style={[tw.mY8]}>
            <PrimaryButton
              title="Next"
              loading={loading}
              loadingTitle="UPDATING"
              onPress={saveNavigate}
              disabled={!firstName || !lastName}
            />
          </View>

          <View>
            <BodyText style={[tw.textRed500]} medium>
              {error}
            </BodyText>
          </View>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default BuyerSellerProfile;
