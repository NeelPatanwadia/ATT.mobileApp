import React, { useState, useEffect, useContext } from 'react';
import { NavigationEvents } from 'react-navigation';
import { View } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { BodyText, PrimaryButton, PrimaryInput } from '../../components';
import { userService } from '../../services';
import AgentTabContext from '../../navigation/AgentTabContext';

const EditBrokerage = ({ navigation, screenProps: { user, setUser } }) => {
  const [brokerage, setBrokerage] = useState(user.brokerage || '');
  const [updatingUser, setUpdatingUser] = useState(false);
  const [error, setError] = useState();
  const [validationErrors, setValidationErrors] = useState({
    brokerage: '',
  });

  const { setNavigationParams } = useContext(AgentTabContext);

  useEffect(() => {
    if (brokerage) {
      validateBrokerage();
    }
  }, [brokerage]);

  const validateBrokerage = () => {
    if (!brokerage) {
      setValidationErrors(prevState => ({ ...prevState, brokerage: 'Brokerage is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, brokerage: '' }));

    return true;
  };

  const handleUpdateUser = async () => {
    setUpdatingUser(true);

    if (!validateBrokerage()) {
      setUpdatingUser(false);

      return;
    }

    const updatedUser = {
      id: user.id,
      brokerage,
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
                <BodyText>Brokerage</BodyText>
                <PrimaryInput
                  placeholder=""
                  autoCapitalize="words"
                  onChangeText={newBrokerage => setBrokerage(newBrokerage)}
                  value={brokerage}
                  onBlur={validateBrokerage}
                  errorMessage={validationErrors.brokerage}
                />
              </View>
            </View>
          </View>
          <View style={[tw.mX6]}>
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

export default EditBrokerage;
