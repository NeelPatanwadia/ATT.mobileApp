import React, { useState, useEffect, useContext } from 'react';
import { NavigationEvents } from 'react-navigation';
import { View } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { BodyText, PrimaryButton, PhoneInput } from '../../components';
import AgentTabContext from '../../navigation/AgentTabContext';
import BuyerSellerTabContext from '../../navigation/BuyerSellerTabContext';

const EditPhone = ({ navigation, screenProps: { user } }) => {
  const [cellPhone, setCellPhone] = useState(user.cellPhone || '');
  const [updatingUser, setUpdatingUser] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    cellPhone: '',
  });

  const { setNavigationParams } = useContext(user.isAgent ? AgentTabContext : BuyerSellerTabContext);

  useEffect(() => {
    if (cellPhone) {
      validateCellPhone();
    }
  }, [cellPhone]);

  const validateCellPhone = () => {
    if (!cellPhone) {
      setValidationErrors(prevState => ({ ...prevState, cellPhone: 'Phone Number is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, cellPhone: '' }));

    return true;
  };

  const handleUpdateUser = async () => {
    setUpdatingUser(true);

    if (!validateCellPhone()) {
      setUpdatingUser(false);

      return;
    }

    if (cellPhone.length !== 12) {
      setUpdatingUser(false);
      setValidationErrors(prevState => ({
        ...prevState,
        cellPhone: 'Please enter phone number in this format: XXX-XXX-XXXX',
      }));

      return;
    }

    navigation.navigate('Verification', { cellPhone, returnScreen: 'Account' });
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
      <View style={[tw.hFull, tw.bgPrimary, tw.flexCol, tw.pX2]}>
        <View style={[tw.wFull, tw.flex1]}>
          <View style={[tw.w5_6, tw.selfCenter]}>
            <View style={[tw.mY8]}>
              <View>
                <BodyText>Phone Number</BodyText>
                <PhoneInput
                  placeholder=""
                  autoCapitalize="words"
                  onChangeText={newPhone => setCellPhone(newPhone)}
                  value={cellPhone}
                  onBlur={validateCellPhone}
                  errorMessage={validationErrors.cellPhone}
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
          </View>
        </View>
      </View>
    </>
  );
};

export default EditPhone;
