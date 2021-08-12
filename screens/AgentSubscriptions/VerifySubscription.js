import React, { useState, useEffect } from 'react';
import { View, Image, ActivityIndicator, AsyncStorage } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { colors, tw } from 'react-native-tailwindcss';
import { LogoWithText } from '../../assets/images';
import { PrimaryButton, BodyText } from '../../components';
import { SettingsCodeNames, AsyncStorageKeys } from '../../constants/AppConstants';
import { settingService, subscriptionService } from '../../services';
import { logEvent, EVENT_TYPES, APP_REGIONS } from '../../helpers/logHelper';
import { updateRecurringSubscription } from '../../services/subscriptionService';

const VerifySubscription = ({ screenProps: { user }, navigation }) => {
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    if (user.isFreeVersionAccount) {
      navigation.replace('SubscriptionMessage');

      return;
    }
    try {
      setError('');
      try {
        const subscriptionsRequired = await settingService.queries.getSetting(SettingsCodeNames.SUBSCRIPTIONS_REQUIRED);

        if (
          subscriptionsRequired &&
          subscriptionsRequired.value &&
          subscriptionsRequired.value.toLowerCase() !== 'true'
        ) {
          await logEvent({
            message: 'Skipping agent subscription check: subscriptions requirments disabled',
            appRegion: APP_REGIONS.AGENT_SUBSCRIPTION,
            eventType: EVENT_TYPES.INFO,
          });

          const checkTime = `${new Date().getTime()}`;

          console.log('SETTING LAST CHECK TIME TO: ', checkTime);

          await AsyncStorage.setItem(AsyncStorageKeys.AgentSubscriptionCheckTime, checkTime);

          navigation.navigate('SyncAgentListings');

          return;
        }
      } catch (error) {
        await logEvent({
          message: `Could not check if subscriptions are currently enabled: ${JSON.stringify(error)}`,
          appRegion: APP_REGIONS.AGENT_SUBSCRIPTION,
          eventType: EVENT_TYPES.WARNING,
        });
      }

      console.log('Checking subscriptions status...');

      const subscriptionStatus = await subscriptionService.queries.getSubscriptionStatus(user.id);

      if (subscriptionStatus.isActive) {
        const checkTime = `${new Date().getTime()}`;

        console.log('SETTING LAST CHECK TIME TO: ', checkTime);

        await AsyncStorage.setItem(AsyncStorageKeys.AgentSubscriptionCheckTime, checkTime);

        navigation.navigate('SyncAgentListings');
      } else {
        navigation.replace('SubscriptionOptions');
      }
      // } else if (subscriptionStatus.isRecurring && !subscriptionStatus.isTrial) {
      //   const updateResponse = await updateRecurringSubscription(subscriptionStatus.subscription.originalOrderId);

      //   if (updateResponse && updateResponse.response === 'Success') {
      //     navigation.navigate('SyncAgentListings');
      //   } else {
      //     navigation.replace('SubscriptionMessage');
      //   }
      // } else {
      //   navigation.replace('SubscriptionMessage');
      // }
    } catch (error) {
      console.log('Error fetching subscription status: ', error);
      setError(
        'An error occurred attempting to fetch your subscription status. \n\nPlease confirm that you are connected to the internet and try again.'
      );
    }
  };

  const loading = (
    <>
      <BodyText style={[tw.textLg, tw.textCenter, tw.mB8]}>Verifying Account Subscription</BodyText>
      <ActivityIndicator size="large" color={colors.gray500} />
    </>
  );

  return (
    <SafeAreaView style={[tw.flexCol, tw.flex1, tw.pX8, tw.bgPrimary]}>
      <View style={[tw.flex1, tw.flexCol, tw.justifyEnd, tw.alignCenter, tw.wFull]}>
        <Image source={LogoWithText} style={[tw.h48, tw.wFull]} resizeMode="contain" />
      </View>
      <View style={(tw.flexCol, tw.flex1)}>
        {error ? (
          <>
            <BodyText style={[tw.textLg]}>{error}</BodyText>
            <PrimaryButton title="RELOAD" onPress={fetchSubscriptionStatus} style={[tw.mB12, tw.mTAuto]} />
          </>
        ) : (
          loading
        )}
      </View>
    </SafeAreaView>
  );
};

export default VerifySubscription;
