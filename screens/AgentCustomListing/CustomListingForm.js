import React, { useRef, useEffect, useState } from 'react';
import { Image, SafeAreaView, View } from 'react-native';
import { tw, color } from 'react-native-tailwindcss';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { BodyText, PrimaryButton, PrimaryInput, DropdownInput } from '../../components';
import { DashboardIcon } from '../../assets/images';
import { STATES_LIST } from '../../constants/AppConstants';
import { geocodeAddress } from '../../helpers';

const CreateCustomListing = ({ navigation }) => {
  const cityField = useRef(null);

  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  const [errors, setErrors] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  useEffect(() => {
    if (fields.address) {
      validateAddress();
    }
  }, [fields.address]);

  useEffect(() => {
    if (fields.city) {
      validateCity();
    }
  }, [fields.city]);

  useEffect(() => {
    if (fields.state) {
      validateState();
    }
  }, [fields.state]);

  useEffect(() => {
    if (fields.zip) {
      validateZip();
    }
  }, [fields.zip]);

  const setField = (text, fieldName) => {
    setFields(prevState => ({ ...prevState, [fieldName]: text }));
  };

  const validateAndCalculateLocation = async () => {
    try {
      setLoading(true);

      const fieldsValid = validateFields();

      if (!fieldsValid) {
        setLoading(false);

        return;
      }

      const { latitude, longitude } = await geocodeAddress(
        `${fields.address.includes(',') ? fields.address.split(',')[0] : fields.address} ${fields.city}, ${
          fields.state
        } ${fields.zip}`
      );

      console.log('LAT: ', latitude);
      console.log('LNG: ', longitude);

      setLoading(false);

      navigation.navigate('CustomListingLocation', {
        latitude,
        longitude,
        address: fields.address.includes(',') ? fields.address.split(',')[0] : fields.address,
        city: fields.city,
        state: fields.state,
        zip: fields.zip,
        onAdd: navigation.getParam('onAdd', null),
      });
    } catch (error) {
      console.warn('Error adding custom property of interest: ', error);

      setLoading(false);
    }
  };

  const validateAddress = () => {
    if (!fields.address) {
      setErrors(prevState => ({ ...prevState, address: 'Address is required' }));

      return false;
    }

    setErrors(prevState => ({ ...prevState, address: '' }));

    return true;
  };

  const validateCity = () => {
    if (!fields.city) {
      setErrors(prevState => ({ ...prevState, city: 'City is required' }));

      return false;
    }

    setErrors(prevState => ({ ...prevState, city: '' }));

    return true;
  };

  const validateState = () => {
    if (!fields.state) {
      setErrors(prevState => ({ ...prevState, state: 'State is required' }));

      return false;
    }

    setErrors(prevState => ({ ...prevState, state: '' }));

    return true;
  };

  const validateZip = () => {
    if (!fields.zip) {
      setErrors(prevState => ({ ...prevState, zip: 'ZIP Code is required' }));

      return false;
    }
    setErrors(prevState => ({ ...prevState, zip: '' }));

    return true;
  };

  const validateFields = () => {
    const addressValid = validateAddress();
    const cityValid = validateCity();
    const stateValid = validateState();
    const zipValid = validateZip();

    return addressValid && cityValid && stateValid && zipValid;
  };

  return (
    <SafeAreaView style={[tw.flexCol, tw.flex1, tw.bgPrimary]}>
      <KeyboardAwareScrollView contentContainerStyle={[tw.flexCol, tw.pY4]}>
        <View style={[tw.flexCol, tw.pX6]}>
          <View style={[tw.flexRow, tw.itemsCenter, tw.mT4, tw.mB8]}>
            <Image
              source={DashboardIcon}
              style={[tw.h8, tw.w8, tw.mR4, { tintColor: color.blue500 }]}
              resizeMode="contain"
            />

            <BodyText style={[tw.text2xl]}>Create a Custom Listing</BodyText>
          </View>

          <BodyText style={[tw.mT2]}>Address</BodyText>

          <PrimaryInput
            placeholder=""
            autoCapitalize="words"
            onChangeText={text => setField(text, 'address')}
            onBlur={validateAddress}
            returnKeyType="next"
            errorMessage={errors.address}
            value={fields.address}
            onSubmitEditing={() => cityField.current.focus()}
          />

          <BodyText style={[tw.mT6]}>City</BodyText>

          <PrimaryInput
            placeholder=""
            autoCapitalize="words"
            onChangeText={text => setField(text, 'city')}
            onBlur={validateCity}
            returnKeyType="next"
            errorMessage={errors.city}
            value={fields.city}
            ref={cityField}
          />

          <BodyText style={[tw.mT6]}>State</BodyText>

          <DropdownInput
            options={STATES_LIST.map(state => ({ value: state.code, label: state.name }))}
            value={fields.state}
            onSelect={selection => setField(selection, 'state')}
            errorMessage={errors.state}
            lg
          />

          <BodyText style={[tw.mT6]}>Zip</BodyText>

          <PrimaryInput
            placeholder=""
            autoCapitalize="words"
            onChangeText={text => setField(text, 'zip')}
            onBlur={validateZip}
            errorMessage={errors.zip}
            value={fields.zip}
          />
        </View>
      </KeyboardAwareScrollView>

      <View style={[tw.wFull, tw.selfCenter, tw.pT4, tw.pB2, tw.pX8, tw.borderT, tw.borderGray300]}>
        <PrimaryButton title="NEXT" loading={loading} onPress={validateAndCalculateLocation} />
      </View>
    </SafeAreaView>
  );
};

export default CreateCustomListing;
