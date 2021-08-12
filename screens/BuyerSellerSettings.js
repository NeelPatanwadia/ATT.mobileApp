import React, { useEffect, useContext } from 'react';
import { NavigationEvents } from 'react-navigation';
import { View } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { PrimaryButton, BodyText } from '../components';
import BuyerSellerTabContext from '../navigation/BuyerSellerTabContext';
import config from '../configs/config';

const BuyerSellerSettings = ({ navigation, screenProps: { signOut, user } }) => {
  const { setNavigationParams } = useContext(BuyerSellerTabContext);

  useEffect(() => {
    if (user && !user.onboardingComplete) {
      navigation.navigate('Onboarding');
    }
  }, [user]);

  const buildVersionInfo = () => {
    const { nativeAppVersion, nativeBuildVersion } = Constants;
    const env = config.env === 'production' ? '' : `${config.env} | `;

    return (
      <BodyText style={[tw.textCenter, tw.wFull, tw.textXs, tw.textGray600, tw.mB2]} sm>
        {`${env} ${nativeAppVersion || '--'} | ${nativeBuildVersion || '--'} | Published: ${config.publishDate ||
          '--'}\n© About Time Tours LLC`}
      </BodyText>
    );
  };

  return (
    <>
      <NavigationEvents onWillFocus={() => setNavigationParams({ headerTitle: 'Settings', showSettingsBtn: true })} />
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
        <View style={[tw.selfCenter, tw.pX8]}>
          <PrimaryButton style={[tw.mT8, tw.mB4]} title="My Account" onPress={() => navigation.navigate('Account')} />
          <PrimaryButton style={[tw.mB4]} title="Support" onPress={() => navigation.navigate('Support')} />
          <PrimaryButton
            style={[tw.mB4]}
            title="Privacy Policy"
            onPress={() => Linking.openURL('https://abouttimetours.com/privacy-policy/')}
          />
          <PrimaryButton
            style={[tw.mB4]}
            title="Terms of Service"
            onPress={() => Linking.openURL('https://abouttimetours.com/terms_of_service/')}
          />
          <PrimaryButton style={[tw.mB4]} title="Sign Out" onPress={signOut} />

          <View style={[tw.flex1, tw.justifyEnd, tw.mB2, tw.itemsCenter]}>{buildVersionInfo()}</View>
        </View>
      </View>
    </>
  );
};

export default BuyerSellerSettings;
