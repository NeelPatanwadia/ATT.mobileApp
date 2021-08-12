import React, { useState, useEffect, useContext, useRef } from 'react';
import { NavigationEvents } from 'react-navigation';
import { View } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { BodyText, PrimaryButton, PrimaryInput } from '../../components';
import { userService } from '../../services';
import AgentTabContext from '../../navigation/AgentTabContext';
import BuyerSellerTabContext from '../../navigation/BuyerSellerTabContext';

const EditName = ({ navigation, screenProps: { user, setUser } }) => {
  const firstNameField = useRef(null);
  const lastNameField = useRef(null);

  const inputFields = { firstNameField, lastNameField };

  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [updatingUser, setUpdatingUser] = useState(false);
  const [error, setError] = useState();
  const [validationErrors, setValidationErrors] = useState({
    firstName: '',
    lastName: '',
  });

  const { setNavigationParams } = useContext(user.isAgent ? AgentTabContext : BuyerSellerTabContext);

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

  const focusInput = field => {
    inputFields[field].current.focus();
  };

  const handleUpdateUser = async () => {
    setUpdatingUser(true);

    if (!(validateFirstName() && validateLastName())) {
      setUpdatingUser(false);

      return;
    }

    const updatedUser = {
      id: user.id,
      firstName,
      lastName,
    };

    try {
      const dbUser = await userService.mutations.updateUser(updatedUser);

      setUser(dbUser);

      navigation.goBack(null);
    } catch (error) {
      console.log('Error updating user: ', error);
      setError('Error updating user.');
    }
    setUpdatingUser(false);
  };

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'My Account',
            showBackBtn: true,
            showSettingsBtn: true,
          })
        }
      />
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol]}>
        <View style={[tw.wFull, tw.flex1]}>
          <View style={[tw.w5_6, tw.selfCenter]}>
            <View style={[tw.mY8]}>
              <BodyText>First Name</BodyText>
              <View>
                <PrimaryInput
                  placeholder=""
                  autoCapitalize="words"
                  onChangeText={newFirstName => setFirstName(newFirstName)}
                  value={firstName}
                  onBlur={validateFirstName}
                  errorMessage={validationErrors.firstName}
                  returnKeyType="next"
                  onSubmitEditing={() => focusInput('lastNameField')}
                />
              </View>
              <View style={[tw.mT6]}>
                <BodyText>Last Name</BodyText>
                <PrimaryInput
                  placeholder=""
                  autoCapitalize="words"
                  onChangeText={newLastName => setLastName(newLastName)}
                  value={lastName}
                  onBlur={validateLastName}
                  errorMessage={validationErrors.lastName}
                  returnKeyType="next"
                  ref={lastNameField}
                />
              </View>
            </View>
          </View>
          <View style={[tw.mX8]}>
            <PrimaryButton
              title="UPDATE"
              onPress={handleUpdateUser}
              loading={updatingUser}
              loadingTitle="UPDATING"
              style={[tw.bgBlue500]}
            />
            <View style={[tw.justifyCenter, tw.mT4]}>
              <BodyText style={[tw.textRed500]}>{error}</BodyText>
            </View>
          </View>
        </View>
      </View>
    </>
  );
};

export default EditName;
