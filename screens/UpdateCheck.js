import React, { useState, useEffect } from 'react';
import { View, Image, ActivityIndicator, Platform } from 'react-native';
import { colors, tw } from 'react-native-tailwindcss';
import * as Updates from 'expo-updates';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaView } from 'react-navigation';
import { Logo } from '../assets/images';
import { logEvent, APP_REGIONS, EVENT_TYPES } from '../helpers/logHelper';
import { PrimaryButton, BodyText } from '../components';
import config from '../configs/config';

const UpdateCheck = ({ onFinish }) => {
  const [buildUpdateRequired, setBuildUpdateRequired] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        // eslint-disable-next-line
        if (!__DEV__) {
          setError('');

          const expectedAppVersion = await getExpectedAppVersion();

          const onCurrentBuild = await checkIfUserOnCurrentBuild(expectedAppVersion);

          if (!onCurrentBuild) {
            setBuildUpdateRequired(true);

            return;
          }

          const { isAvailable } = await Updates.checkForUpdateAsync();

          if (isAvailable) {
            setDownloading(true);

            await SplashScreen.hideAsync().catch(err => console.warn('Could not hide splash screen', err));

            await Updates.fetchUpdateAsync();

            await logEvent({
              message: `New Bundle Downloaded -- Reloading}`,
              appRegion: APP_REGIONS.EXPO,
              eventType: EVENT_TYPES.INFO,
            });

            await Updates.reloadAsync();

            return;
          }

          await logEvent({
            message: `Expo bundle is up to date`,
            appRegion: APP_REGIONS.EXPO,
            eventType: EVENT_TYPES.INFO,
          });
        }

        onFinish();
      } catch (error) {
        console.log('ERROR: ', error);

        await logEvent({
          message: `Error checking for updates: ${error}`,
          appRegion: APP_REGIONS.EXPO,
          eventType: EVENT_TYPES.ERROR,
        });

        setDownloading(false);
        setError('Error downloading app update. Please make sure you are connected to the internet.');
        SplashScreen.hideAsync().catch(err => console.warn('Could not hide splash screen', err));
      }
    };

    checkForUpdates();
  }, [onFinish]);

  useEffect(() => {
    if (downloading || buildUpdateRequired) {
      SplashScreen.hideAsync().catch(err => console.warn('Could not hide splash screen', err));
    }
  }, [downloading, buildUpdateRequired]);

  const checkIfUserOnCurrentBuild = async expectedAppVersion => {
    const { nativeAppVersion, nativeBuildVersion } = Constants;

    const { buildNumber, appVersion } = JSON.parse(expectedAppVersion);

    if (`${buildNumber}` !== `${nativeBuildVersion}` || `${appVersion}` !== `${nativeAppVersion}`) {
      await logEvent({
        message: `App Download Required -- Current Build: ${nativeBuildVersion}, ${nativeAppVersion}, Expected Build: ${buildNumber}, ${appVersion}}`,
        appRegion: APP_REGIONS.EXPO,
        eventType: EVENT_TYPES.INFO,
      });

      return false;
    }

    return true;
  };

  const getExpectedAppVersion = async () => {
    try {
      const endpoint = `${config.publicServiceEndpoint}/apps/${Platform.OS}/version`;

      const response = await (await fetch(endpoint)).json();

      const { version, appLink } = response;

      setDownloadLink(appLink);

      return version;
    } catch (error) {
      logEvent({
        message: `Error fetching expected app version: ${error}`,
        appRegion: APP_REGIONS.EXPO,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const openAppStore = async () => {
    try {
      await Linking.openURL(downloadLink);
    } catch (error) {
      await logEvent({
        message: `Error routing to app store link: ${JSON.stringify(error)}`,
        appRegion: APP_REGIONS.EXPO,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const renderContent = () => {
    if (error) {
      return <BodyText style={[tw.textLg, tw.mT16, tw.mX8]}>{error}</BodyText>;
    }

    if (buildUpdateRequired) {
      return (
        <View style={[tw.flexCol, tw.mX8, tw.mTAuto, tw.mB8]}>
          <PrimaryButton title="INSTALL UPDATE" onPress={openAppStore} />
        </View>
      );
    }

    return (
      <>
        <BodyText style={[tw.textXl, tw.textCenter, tw.mT16, tw.mB6]}>Downloading Updates</BodyText>
        <ActivityIndicator size="large" color={colors.gray500} />
      </>
    );
  };

  return (
    <SafeAreaView color="blue" style={[tw.flex1, tw.flexCol, tw.bgPrimary, tw.justifyCenter, tw.itemsCenter, tw.wFull]}>
      <View style={[tw.flexCol, tw.flex1, tw.bgPrimary, tw.wFull, tw.justifyCenter, tw.itemsCenter]}>
        <View style={[tw.flex1]} />
        <Image source={Logo} resizeMode="contain" style={[tw.mB4, { height: 145, width: 200 }]} />
        <View style={[tw.flex1, tw.wFull, tw.flexCol]}>{renderContent()}</View>
      </View>
    </SafeAreaView>
  );
};

export default UpdateCheck;
