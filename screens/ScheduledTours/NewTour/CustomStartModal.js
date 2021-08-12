import React, { useState, useEffect, useRef } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { View } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { BodyText, PrimaryInput, PrimaryButton } from '../../../components';
import { MapPinIcon } from '../../../assets/images';
import { geocodeAddress } from '../../../helpers';

const CustomStartModal = ({ title, onSubmit }) => {
  const nameField = useRef(null);
  const addressField = useRef(null);
  const cityField = useRef(null);
  const stateField = useRef(null);
  const zipField = useRef(null);

  const inputFields = {
    nameField,
    addressField,
    cityField,
    stateField,
    zipField,
  };

  const [customStartName, setCustomStartName] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [customState, setCustomState] = useState('');
  const [customZip, setCustomZip] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [cityError, setCityError] = useState('');
  const [stateError, setStateError] = useState('');
  const [zipError, setZipError] = useState('');

  useEffect(() => {
    if (customStartName && customAddress && customCity && customState && customZip) {
      setNameError('');
      setAddressError('');
      setCityError('');
      setStateError('');
      setZipError('');
    }
  }, [customStartName, customAddress, customCity, customState, customZip]);

  const focusInput = field => {
    inputFields[field].current.focus();
  };

  const validateName = () => {
    setNameError(customStartName !== '' ? '' : 'Please enter a name');
  };

  const validateAddress = () => {
    setAddressError(customAddress !== '' ? '' : 'Please enter a street address');
  };

  const validateCity = () => {
    setCityError(customCity !== '' ? '' : 'Please enter a city');
  };

  const validateState = () => {
    setStateError(customState !== '' ? '' : 'Please enter a state name');
  };

  const validateZip = () => {
    setZipError(customZip !== '' ? '' : 'Please enter a zip code');
  };

  const submitForm = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const addressStr = `${customAddress} ${customCity}, ${customState} ${customZip}`;

      const { latitude, longitude } = await geocodeAddress(addressStr);

      if (!latitude || !longitude) {
        setIsLoading(false);
        setErrorMsg('Could not validate address');

        return;
      }

      setIsLoading(false);
      onSubmit({ addressStr, latitude, longitude, customStartName });
    } catch (error) {
      console.log('Error creating tour stop: ', error);
      setIsLoading(false);
      setErrorMsg('Could not verify address');

      return false;
    }
  };

  return (
    <KeyboardAwareScrollView style={[tw.wFull, tw.hFull]}>
      <View style={[tw.flexRow, tw.justifyCenter, tw.mY4]}>
        <MapPinIcon width={30} height={30} fill={color.blue500} />
      </View>
      <BodyText style={[tw.textXl, tw.textCenter]}>{title}</BodyText>
      <View style={[tw.flexCol, tw.pY4]}>
        <BodyText style={[tw.mL2, tw.mT6]}>Name</BodyText>

        <PrimaryInput
          placeholder=""
          autoCapitalize="words"
          onChangeText={newName => setCustomStartName(newName)}
          onBlur={validateName}
          returnKeyType="next"
          errorMessage={nameError}
          value={customStartName}
          onSubmitEditing={() => focusInput('nameField')}
          ref={nameField}
        />

        <BodyText style={[tw.mL2, tw.mT6]}>Address</BodyText>

        <PrimaryInput
          placeholder=""
          autoCapitalize="words"
          onChangeText={newAddress => setCustomAddress(newAddress)}
          onBlur={validateAddress}
          returnKeyType="next"
          errorMessage={addressError}
          value={customAddress}
          onSubmitEditing={() => focusInput('addressField')}
          ref={addressField}
        />

        <BodyText style={[tw.mL2, tw.mT6]}>City</BodyText>

        <PrimaryInput
          placeholder=""
          autoCapitalize="words"
          onChangeText={newCity => setCustomCity(newCity)}
          onBlur={validateCity}
          returnKeyType="next"
          errorMessage={cityError}
          value={customCity}
          onSubmitEditing={() => focusInput('stateField')}
          ref={cityField}
        />

        <BodyText style={[tw.mL2, tw.mT6]}>State</BodyText>

        <PrimaryInput
          placeholder=""
          autoCapitalize="words"
          onChangeText={newState => setCustomState(newState)}
          onBlur={validateState}
          returnKeyType="next"
          errorMessage={stateError}
          value={customState}
          onSubmitEditing={() => focusInput('zipField')}
          ref={stateField}
        />

        <BodyText style={[tw.mL2, tw.mT6]}>Zip Code</BodyText>

        <PrimaryInput
          placeholder=""
          autoCapitalize="words"
          onChangeText={newZip => setCustomZip(newZip)}
          onBlur={validateZip}
          returnKeyType="next"
          errorMessage={zipError}
          value={customZip}
          ref={zipField}
        />
      </View>
      <View style={[tw.flexCol, tw.pT2]}>
        {errorMsg !== '' && <BodyText style={[tw.textRed500, tw.textCenter]}>{errorMsg}</BodyText>}
        <PrimaryButton
          disabled={!customStartName || !customAddress || !customCity || !customState || !customZip}
          loading={isLoading}
          loadingTitle="Verifying"
          title="Submit"
          onPress={() => submitForm()}
          style={[tw.mTAuto]}
        />
      </View>
    </KeyboardAwareScrollView>
  );
};

CustomStartModal.navigationOptions = () => ({
  headerShown: false,
});

export default CustomStartModal;
