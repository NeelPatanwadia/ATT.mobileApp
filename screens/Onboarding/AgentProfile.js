import { View, Platform, Image, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Storage } from 'aws-amplify';
import { tw } from 'react-native-tailwindcss';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import { PrimaryButton, PrimaryInput, SecondaryButton, BodyText } from '../../components';
import { dig } from '../../helpers';
import { validationService, userService } from '../../services';

const AgentProfile = ({ navigation, screenProps: { user, setUser } }) => {
  const [image, setImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    firstName: '',
    lastName: '',
    brokerage: '',
    realtorNumber: '',
  });

  useEffect(() => {
    getPermissionAsync();
  }, []);

  useEffect(() => {
    if (user.firstName) {
      validateFirstName();
    }
  }, [user.firstName]);

  useEffect(() => {
    if (user.lastName) {
      validateLastName();
    }
  }, [user.lastName]);

  useEffect(() => {
    if (user.brokerage) {
      validateBrokerage();
    }
  }, [user.brokerage]);

  useEffect(() => {
    if (user.realtorNumber) {
      validateRealtorNumber();
    }
  }, [user.realtorNumber]);

  useEffect(() => {
    if (user.logo && !image) {
      getLogo();
    }
  }, [user]);

  const validateFirstName = () => {
    if (!user.firstName) {
      setValidationErrors(prevState => ({ ...prevState, firstName: 'First Name is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, firstName: '' }));

    return true;
  };

  const validateLastName = () => {
    if (!user.lastName) {
      setValidationErrors(prevState => ({ ...prevState, lastName: 'Last Name is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, lastName: '' }));

    return true;
  };

  const validateBrokerage = () => {
    if (!user.brokerage) {
      setValidationErrors(prevState => ({ ...prevState, brokerage: 'Brokerage is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, brokerage: '' }));

    return true;
  };

  const validateRealtorNumber = () => {
    if (!user.realtorNumber) {
      setValidationErrors(prevState => ({ ...prevState, realtorNumber: 'Realtor Number is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, realtorNumber: '' }));

    return true;
  };

  const getPermissionAsync = async () => {
    if (Platform.OS === 'ios') {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);

      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    }
  };

  const getLogo = async () => {
    const access = { level: 'public' };
    const newImage = await Storage.get(user.logo, access);

    setImage(newImage);
  };

  const saveNavigate = async () => {
    if (!(validateFirstName() && validateLastName() && validateBrokerage() && validateRealtorNumber())) {
      return;
    }

    setLoading(true);
    if (image) {
      const fileExt = dig(
        user.logo,
        uri => uri.match(/\.(.*)$/),
        '1',
        ext => (ext === 'jpg' ? 'jpeg' : ext)
      );
      const contentType = `image/${fileExt}`;
      const access = { level: 'public', contentType };

      const response = await fetch(image);
      const blob = await response.blob();

      await Storage.put(user.logo, blob, access).catch(console.log);
    }

    await userService.mutations.updateUser({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      brokerage: user.brokerage,
      realtorNumber: user.realtorNumber,
      isAgent: true,
      onboardingComplete: true,
    });

    setUser({ ...user, isAgent: true, onboardingComplete: true });
    try {
      await validateAgent();
      setLoading(false);
      navigation.navigate('AgentValidation');
    } catch (error) {
      setLoading(false);
      console.log('Error sending validation request: ', error);
      setErrorMessage('An error occurred. Please try again.');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      setImage(result.uri);
      const fileExt = dig(result.uri, uri => uri.match(/\.(.*)$/), '1');
      const logo = `${user.id}-logo.${fileExt}`;

      setUser({ ...user, logo });
    }
  };

  const validateAgent = async () => {
    await validationService.validateAgent(user);
  };

  return (
    <KeyboardAwareScrollView style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
      <View style={[tw.w5_6, tw.selfCenter, tw.pT8]}>
        <View style={[tw.w5_6, tw.selfCenter, tw.mY8]}>
          <BodyText style={[tw.mL2, tw.mT6]}>First Name</BodyText>
          <PrimaryInput
            placeholder=""
            onChangeText={firstName => setUser({ ...user, firstName })}
            value={user.firstName}
            onBlur={validateFirstName}
            errorMessage={validationErrors.firstName}
          />
          <BodyText style={[tw.mL2, tw.mT6]}>Last Name</BodyText>
          <PrimaryInput
            placeholder=""
            onChangeText={lastName => setUser({ ...user, lastName })}
            value={user.lastName}
            onBlur={validateLastName}
            errorMessage={validationErrors.lastName}
          />
          <BodyText style={[tw.mL2, tw.mT6]}>Agency Name</BodyText>
          <PrimaryInput
            placeholder=""
            onChangeText={brokerage => setUser({ ...user, brokerage })}
            value={user.brokerage}
            onBlur={validateBrokerage}
            errorMessage={validationErrors.brokerage}
          />
          <BodyText style={[tw.mL2, tw.mT6]}>License Number</BodyText>
          <PrimaryInput
            placeholder=""
            onChangeText={realtorNumber => setUser({ ...user, realtorNumber })}
            value={user.realtorNumber}
            onBlur={validateRealtorNumber}
            errorMessage={validationErrors.realtorNumber}
          />
          <View style={[tw.h24, tw.justifyCenter]}>
            {!image && (
              <SecondaryButton
                title="Upload Logo"
                onPress={pickImage}
                style={[tw.selfStart]}
                textStyle={[tw.underline, tw.textBlue400]}
              />
            )}
            {image && (
              <TouchableOpacity style={[tw.flexRow, tw.itemsCenter]}>
                <Image source={{ uri: image }} style={{ width: 50, height: 50 }} />
                <SecondaryButton
                  title="Update Logo"
                  onPress={pickImage}
                  style={[tw.mL4]}
                  textStyle={[tw.underline, tw.textBlue400]}
                />
              </TouchableOpacity>
            )}
          </View>
          <PrimaryButton
            style={[tw.mT24]}
            title="Next"
            loading={loading}
            loadingTitle="UPDATING"
            onPress={saveNavigate}
          />
          {errorMessage ? (
            <View style={[tw.justifyCenter, tw.itemsCenter]}>
              <BodyText style={[tw.textRed500, tw.textcenter]}>{errorMessage}</BodyText>
            </View>
          ) : null}
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default AgentProfile;
