import React, { useState, useEffect, useContext } from 'react';
import { NavigationEvents } from 'react-navigation';
import { View } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { BodyText, PrimaryButton, PrimaryInput } from '../../components';
import { userService } from '../../services';
import AgentTabContext from '../../navigation/AgentTabContext';

const EditRealtorNumber = ({ navigation, screenProps: { user, setUser } }) => {
  const [realtorNumber, setRealtorNumber] = useState(user.realtorNumber || '');
  const [updatingUser, setUpdatingUser] = useState(false);
  const [error, setError] = useState();
  const [validationErrors, setValidationErrors] = useState({
    realtorNumber: '',
  });

  const { setNavigationParams } = useContext(AgentTabContext);

  useEffect(() => {
    if (realtorNumber) {
      validateRealtorNumber();
    }
  }, [realtorNumber]);

  const validateRealtorNumber = () => {
    if (!realtorNumber) {
      setValidationErrors(prevState => ({ ...prevState, realtorNumber: 'Realtor Number is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, realtorNumber: '' }));

    return true;
  };

  const handleUpdateUser = async () => {
    setUpdatingUser(true);

    if (!validateRealtorNumber()) {
      setUpdatingUser(false);

      return;
    }

    const updatedUser = {
      id: user.id,
      realtorNumber,
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
      <View style={[tw.pX2, tw.hFull, tw.bgPrimary, tw.flexCol]}>
        <View style={[tw.wFull, tw.flex1]}>
          <View style={[tw.w5_6, tw.selfCenter]}>
            <View style={[tw.mY8]}>
              <View>
                <BodyText>Realtor Number</BodyText>
                <PrimaryInput
                  placeholder=""
                  autoCapitalize="words"
                  onChangeText={newRealtorNumber => setRealtorNumber(newRealtorNumber)}
                  value={realtorNumber}
                  onBlur={validateRealtorNumber}
                  errorMessage={validationErrors.realtorNumber}
                />
              </View>
            </View>
          </View>
          <View style={[tw.mX4]}>
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

export default EditRealtorNumber;
