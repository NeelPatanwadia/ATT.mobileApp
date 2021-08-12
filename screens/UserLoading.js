import React, { useState, useEffect } from 'react';
import { View, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { colors, tw } from 'react-native-tailwindcss';
import { Auth } from 'aws-amplify';
import { LogoWithText } from '../assets/images';
import { PrimaryButton, BodyText } from '../components';
import { authHelper, transformPhoneFromCognitoSub } from '../helpers';
import { userService } from '../services';

const UserLoading = ({ navigation, screenProps: { setUser } }) => {
  const [userError, setUserError] = useState('');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setUserError('');

      await Auth.currentAuthenticatedUser({ bypassCache: true });

      const user = await authHelper.getUserAttributes();
      const { identity, sub, email, phone_number: phoneNumber } = user;

      const currentUser = await userService.mutations.createUserIfNotExists({
        cognitoSub: sub,
        cognitoIdentity: identity,
        emailAddress: email,
        cellPhone: phoneNumber ? transformPhoneFromCognitoSub(phoneNumber) : null,
      });

      console.log('currentUser', currentUser);
      setUser(currentUser);

      if (!currentUser.onboardingComplete) {
        navigation.navigate('Onboarding');
      } else if (currentUser.activeTour) {
        navigation.navigate(currentUser.isAgent ? 'LiveTourReloading' : 'BuyerSellerLiveTourReloading', {
          activeTourId: currentUser.activeTour.id,
        });
      } else if (currentUser.isAgent) {
        navigation.navigate(currentUser.validated && !currentUser.lockedOut ? 'AgentSubscription' : 'AgentValidation');
      } else {
        navigation.navigate('BuyerSeller');
      }
    } catch (error) {
      console.error('Error getting user info: ', error);

      setUser(false);
      setUserError(
        'An error occurred attempting to fetch your account information. \n\nPlease confirm that you are connected to the internet and try again.'
      );
    }
  };

  return (
    <SafeAreaView style={[tw.flexCol, tw.flex1, tw.pX8, tw.bgPrimary]}>
      <View style={[tw.flex1, tw.flexCol, tw.justifyEnd, tw.alignCenter, tw.wFull]}>
        <Image source={LogoWithText} style={[tw.h48, tw.wFull]} resizeMode="contain" />
      </View>
      <View style={(tw.flexCol, tw.flex1)}>
        {userError ? (
          <>
            <BodyText style={[tw.textLg]}>{userError}</BodyText>
            <PrimaryButton title="RELOAD" onPress={() => fetchUser()} style={[tw.mB8, tw.mTAuto]} />
          </>
        ) : (
          <>
            <BodyText style={[tw.textLg, tw.textCenter, tw.mB8]}>Loading Account Information</BodyText>
            <ActivityIndicator size="large" color={colors.gray500} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default UserLoading;
