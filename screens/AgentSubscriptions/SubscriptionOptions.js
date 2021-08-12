import React, { useState, useEffect } from 'react';
import { View, Image, ScrollView, Platform, ActivityIndicator, AsyncStorage, Alert } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { tw, color, colors } from 'react-native-tailwindcss';
import * as InAppPurchases from 'expo-in-app-purchases';
import * as Linking from 'expo-linking';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { LogoWithText, MapPinIcon } from '../../assets/images';
import { PrimaryButton, BodyText, SecondaryButton } from '../../components';
import config from '../../configs/config';
import { logEvent, EVENT_TYPES, APP_REGIONS } from '../../helpers/logHelper';
import { parseFriendlyGraphQLError } from '../../helpers/errorHelpers';
import { subscriptionService } from '../../services';
import { AsyncStorageKeys } from '../../constants/AppConstants';

const BulletPointRow = ({ text }) => (
  <View style={[tw.flexRow, tw.itemsStart, tw.wFull, tw.mB2]}>
    <MapPinIcon width={20} height={20} fill={color.white} stroke={color.blue500} style={[tw.mR4]} />
    <BodyText style={[tw.flex1, tw.textSm, tw.flexWrap]}>{text}</BodyText>
  </View>
);

const storeType = Platform.select({
  ios: 'App Store',
  android: 'Play Store',
});

const androidProductionSubscriptions = ['agent_monthly_subscription', 'agent_annual_subscription'];
const androidTestSubscriptions = ['test_agent_subscription', 'test_agent_subscription_annual'];

const itemCodes = Platform.select({
  ios: ['ToursAgentMonthlySubscription', 'ToursAgentAnnualSubscription'],
  android: config.env === 'production' ? androidProductionSubscriptions : androidTestSubscriptions,
});

const SubscriptionOptions = ({ navigation, screenProps: { user } }) => {
  const [productList, setProductList] = useState([]);
  const [error, setError] = useState('');
  const [connectedToStore, setConnectedToStore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);

  useEffect(() => {
    if (!connectedToStore) {
      connectToStore();
    }

    return () => {
      if (connectedToStore) {
        disconnectFromStore();
      }
    };
  }, []);

  const connectToStore = async () => {
    try {
      setError('');

      // Connect will throw an error if already connected, but there doesn't seem to be a method to check if already connected
      await disconnectFromStore();

      await InAppPurchases.connectAsync();

      setConnectedToStore(true);

      await InAppPurchases.setPurchaseListener(purchaseListener);

      getProductList();
    } catch (error) {
      setError(`Error connecting to ${storeType}`);

      await logEvent({
        message: `Error connecting to the store: ${JSON.stringify(error)}`,
        appRegion: APP_REGIONS.AGENT_SUBSCRIPTION,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const getProductList = async () => {
    try {
      const { results, errorCode } = await InAppPurchases.getProductsAsync(itemCodes);

      if (errorCode) {
        console.log('Error fetching subscription prices: ', errorCode);
        setError(`Error Fetching Subscription Prices: ${errorCode}`);

        return;
      }

      if (!results || results.length === 0) {
        console.log('Error fetching subscription prices, no results returned');
        setError('Error Fetching Subscription Prices');

        return;
      }

      const orderedProductList = results.sort((a, b) => a.priceAmountMicros - b.priceAmountMicros);

      setProductList(orderedProductList);
    } catch (error) {
      await logEvent({
        message: `Error fetching subscription prices: ${JSON.stringify(error)}`,
        appRegion: APP_REGIONS.AGENT_SUBSCRIPTION,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const disconnectFromStore = async () => {
    try {
      await InAppPurchases.disconnectAsync();
    } catch (error) {
      console.log('Error disconnecting from store: ', error);
    }
  };

  const purchaseListener = async response => {
    try {
      const { responseCode, results, errorCode } = response;

      console.log('PURCHASE LISTENER RESPONSE: ', response);

      if (responseCode !== InAppPurchases.IAPResponseCode.OK || errorCode) {
        if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
          setLoading(false);
          setError('');

          return;
        }

        setError(`The transaction could not be completed. Received error code: ${errorCode}`);
        setLoading(false);

        await logEvent({
          message: `Error processing in app purchase: ${JSON.stringify(error)}`,
          appRegion: APP_REGIONS.AGENT_SUBSCRIPTION,
          eventType: EVENT_TYPES.ERROR,
        });

        return;
      }

      const unacknowledgedResults = results.filter(result => result.acknowledged === false);

      if (unacknowledgedResults.length === 0) {
        await logEvent({
          message: `In app purchase listener triggered, but all purchases already acknowledged}`,
          appRegion: APP_REGIONS.AGENT_SUBSCRIPTION,
          eventType: EVENT_TYPES.INFO,
        });

        return;
      }

      const orderedPurchases = results.sort(
        (a, b) => Number.parseInt(b.purchaseTime) - Number.parseInt(a.purchaseTime)
      );

      const lastPurchase = orderedPurchases[0];

      const { purchaseState, transactionReceipt, purchaseToken, productId } = lastPurchase;

      if (purchaseState === InAppPurchases.InAppPurchaseState.FAILED) {
        setError('Purchase Failed');
        setLoading(false);

        await logEvent({
          message: `Users in-app purchase did not process successfully`,
          appRegion: APP_REGIONS.AGENT_SUBSCRIPTION,
          eventType: EVENT_TYPES.INFO,
        });

        return;
      }

      if (purchaseState === InAppPurchases.InAppPurchaseState.DEFERRED) {
        setError('Purchase Deferred');
        setLoading(false);

        await logEvent({
          message: `Users in-app purchase was deferred`,
          appRegion: APP_REGIONS.AGENT_SUBSCRIPTION,
          eventType: EVENT_TYPES.INFO,
        });
      }

      const purchaseStateString = getFormattedPuchaseState(purchaseState);

      const subscriptionStatus = await subscriptionService.mutations.createSubscription({
        userId: user.id,
        purchaseState: purchaseStateString,
        receipt: Platform.OS === 'ios' ? transactionReceipt : purchaseToken,
        platform: Platform.OS,
        productId,
        isRestore: false,
      });

      console.log('SUBSCRIPTION STATUS AFTER CREATE: ', subscriptionStatus);

      // Marks the transaction as acknowledged
      await InAppPurchases.finishTransactionAsync(lastPurchase, false);

      setLoading(false);
      setError('');

      if (subscriptionStatus.isActive) {
        const checkTime = `${new Date().getTime()}`;

        console.log('SETTING LAST CHECK TIME TO: ', checkTime);

        await AsyncStorage.setItem(AsyncStorageKeys.AgentSubscriptionCheckTime, checkTime);

        navigation.navigate('SyncAgentListings');
      }
    } catch (error) {
      setError('An error occurred processing your payment');
      setLoading(false);

      await logEvent({
        message: `Error handling in app purchase: ${JSON.stringify(error)}`,
        appRegion: APP_REGIONS.AGENT_SUBSCRIPTION,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const makePurchase = async code => {
    try {
      setLoading({ [code]: true });
      await InAppPurchases.purchaseItemAsync(code);
    } catch (error) {
      setLoading(false);
      console.log('Error completing purchase: ', error);
      setError('An unknown error occurred and your transaction could not be completed.');
    }
  };

  const getPurchaseHistory = async () => {
    try {
      setError('');
      setLoadingRestore(true);

      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync(Platform.OS === 'android');

      if (responseCode !== InAppPurchases.IAPResponseCode.OK) {
        throw new Error('Get Purchase History unsuccessful');
      }

      if (!results || results.length === 0) {
        setLoadingRestore(false);
        noPurchaseHistoryMessage();

        return;
      }

      console.log('RESULTS: ', results);

      const filteredPurchases = results
        .filter(
          purchase =>
            itemCodes.includes(purchase.productId) &&
            (Platform.OS === 'android' ||
              purchase.purchaseState === InAppPurchases.InAppPurchaseState.PURCHASED ||
              purchase.purchaseState === InAppPurchases.InAppPurchaseState.RESTORED)
        )
        .sort((a, b) => b.purchaseTime - a.purchaseTime);

      if (!filteredPurchases || filteredPurchases.length === 0) {
        console.log('NO FILTERED PURCHASES...');

        setLoadingRestore(false);
        noPurchaseHistoryMessage();

        return;
      }

      const lastPurchase = filteredPurchases[0];

      promptForRestore(lastPurchase);
    } catch (error) {
      console.log('ERROR GETTING PURCHASE HISTORY: ', error);
      setError('Error Checking Purchase History');

      await logEvent({
        message: `Error getting purchase history: ${JSON.stringify(error)}`,
        appRegion: APP_REGIONS.AGENT_SUBSCRIPTION,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const noPurchaseHistoryMessage = () => {
    Alert.alert(
      'No Subscriptions Found',
      'Your purchase history indicates that you have not previously purchased a subscription with About Time Tours.'
    );
  };

  const promptForRestore = purchase => {
    Alert.alert(
      'Restore Subscription',
      'Your purchase history indicates that you have previously purchased a subscription with About Time Tours. \n\nWould you like to associate that subscription with this account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setLoadingRestore(false),
        },
        {
          text: 'Apply Subscription',
          onPress: () => restoreSubscription(purchase),
        },
      ]
    );
  };

  const restoreSubscription = async purchase => {
    try {
      setError('');

      const { acknowledged, purchaseState, transactionReceipt, purchaseToken, productId } = purchase;

      const purchaseStateStr = getFormattedPuchaseState(purchaseState);

      const subscriptionStatus = await subscriptionService.mutations.createSubscription({
        userId: user.id,
        purchaseState: purchaseStateStr,
        receipt: Platform.OS === 'ios' ? transactionReceipt : purchaseToken,
        platform: Platform.OS,
        productId,
        isRestore: true,
      });

      console.log('SUBSCRIPTION STATUS AFTER RESTORE: ', subscriptionStatus);

      if (!acknowledged) {
        await InAppPurchases.finishTransactionAsync(purchase, false);
      }

      setLoadingRestore(false);

      if (subscriptionStatus.isActive) {
        const checkTime = `${new Date().getTime()}`;

        console.log('SETTING LAST CHECK TIME TO: ', checkTime);

        await AsyncStorage.setItem(AsyncStorageKeys.AgentSubscriptionCheckTime, checkTime);

        navigation.navigate('SyncAgentListings');
      }
    } catch (error) {
      const errorMessage = parseFriendlyGraphQLError(error, 'Error Restoring Subscription');

      setError(errorMessage);
      setLoadingRestore(false);

      await logEvent({
        message: `Error restoring purchase: ${JSON.stringify(error)}`,
        appRegion: APP_REGIONS.AGENT_SUBSCRIPTION,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const getFormattedPuchaseState = purchaseStateCode => {
    switch (purchaseStateCode) {
      case InAppPurchases.InAppPurchaseState.PURCHASED:
        return 'PURCHASED';
      case InAppPurchases.InAppPurchaseState.PURCHASING:
        return 'PURCHASING';
      case InAppPurchases.InAppPurchaseState.RESTORED:
        return 'RESTORED';
      case InAppPurchases.InAppPurchaseState.FAILED:
        return 'FAILED';
      case InAppPurchases.InAppPurchaseState.DEFERRED:
        return 'DEFERRED';
      default:
        return purchaseStateCode !== null && purchaseStateCode !== undefined ? purchaseStateCode.toString() : '';
    }
  };

  const renderBottomContent = () => {
    if (error && (!connectToStore || !productList || productList.length === 0)) {
      return renderRetry();
    }

    if (!productList || productList.length === 0) {
      return renderLoading();
    }

    return renderSubsciptionOptions();
  };

  const renderRetry = () => {
    let retryFunc = null;

    if (!connectedToStore) {
      retryFunc = connectToStore;
    } else if (!productList || productList.length === 0) {
      retryFunc = getProductList;
    }

    return (
      <View style={[tw.flexCol]}>
        <BodyText style={[tw.textRed500]}>{error}</BodyText>
        <PrimaryButton title="RETRY" onPress={retryFunc} style={[tw.mT8]} />
      </View>
    );
  };

  const renderSubsciptionOptions = () => (
    <>
      {renderSubscribeButtons()}

      {error ? <BodyText style={[tw.mT4, tw.textRed500, tw.wFull, tw.textCenter]}>{error}</BodyText> : null}

      <View style={[tw.flexRow, tw.justifyCenter, tw.itemsCenter]}>
        <SecondaryButton
          title="Restore Active Subscription"
          onPress={getPurchaseHistory}
          textStyle={[tw.textBlue500]}
          disabled={loadingRestore || !!loading}
        />

        {loadingRestore ? <ActivityIndicator size="small" style={[tw.mL2]} color={colors.gray500} /> : null}
      </View>

      <View style={[tw.flexRow, tw.justifyEvenly, tw.mY0]}>
        <TouchableOpacity onPress={() => Linking.openURL('https://abouttimetours.com/privacy-policy/')}>
          <BodyText style={[tw.textBlue500]}>Privacy Policy</BodyText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Linking.openURL('https://abouttimetours.com/terms_of_service/')}>
          <BodyText style={[tw.textBlue500]}>Terms of Service</BodyText>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderSubscribeButtons = () => {
    let monthlyPrice = 0;

    return productList.map(product => {
      let period = product.subscriptionPeriod || '';

      const periodLength = Number.parseInt(period.match(/\d+/) || 1);

      period = period.replace('P', ' / ');
      period = period.replace('Y', ' YEAR');
      period = period.replace('M', ' MONTH');

      if (period.includes('MONTH')) {
        monthlyPrice = product.priceAmountMicros;
      }

      if (periodLength === 1) {
        period = period.replace(/\d+/, '');
      } else {
        period += 'S';
      }

      const button = (
        <PrimaryButton
          title={`${product.price}${period}`}
          onPress={() => promptSubscriptionConfirmation(product.productId)}
          loading={loading && loading[product.productId]}
          disabled={!!loading || loadingRestore}
          key={product.productId}
        />
      );

      if (period.includes('YEAR') && monthlyPrice) {
        const numMonths = periodLength * 12;

        const cost = (product.priceAmountMicros / 1000000 / 12).toFixed(2);
        const savings = Math.ceil((1 - product.priceAmountMicros / 12 / monthlyPrice) * 100).toFixed(0);

        return (
          <View style={[tw.flexCol]} key={product.productId}>
            {button}
            <BodyText
              style={[tw.wFull, tw.textCenter, tw.textSm, tw.mT2]}
            >{`(${numMonths} Months at $${cost}/mo. Save nearly ${savings}%)`}</BodyText>
          </View>
        );
      }

      return button;
    });
  };

  const renderLoading = () => (
    <View style={[tw.h24, tw.flexCol, tw.justifyCenter, tw.itemsCenter]}>
      <BodyText style={[tw.textLg, tw.mB6]}>Connecting to the {storeType}</BodyText>
      <ActivityIndicator size="large" color={colors.gray500} />
    </View>
  );

  const promptSubscriptionConfirmation = code => {
    Alert.alert(
      'Confirm Subscription',
      'Please check our coverage map at abouttimetours.com prior to subscribing to see if we are servicing your area yet.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Canceled...'),
        },
        {
          text: 'View Coverage',
          onPress: () => Linking.openURL('https://abouttimetours.com/coverage-map/'),
        },
        {
          text: 'Continue to Purchase',
          onPress: () => makePurchase(code),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[tw.flexCol, tw.flex1, tw.bgPrimary]}>
      <ScrollView style={[tw.flexCol, tw.flex1, tw.pX6, tw.bgPrimary]}>
        <View style={[tw.m4]}>
          <Image source={LogoWithText} style={[tw.wFull, tw.h32]} resizeMode="contain" />
        </View>

        <View style={[tw.flexCol]}>
          <View style={[tw.flexCol, tw.mB4]}>
            <BodyText style={[tw.uppercase, tw.textBlue500, tw.textSm, tw.textCenter, tw.mB1]} bold>
              Subscribe to receive everything
            </BodyText>
            <BodyText style={[tw.uppercase, tw.textBlue500, tw.textSm, tw.textCenter]} bold>
              you need for your home tours
            </BodyText>
          </View>

          <BulletPointRow text="Create and customize home tours" />
          <BulletPointRow text="Automated showing requests and confirmations" />
          <BulletPointRow text="Optimized routes with real time navigation" />
          <BulletPointRow text={`Auto "You're next on tour" alerts to sellers`} />
          <BulletPointRow text={`Auto "We've left your home" alerts to sellers`} />
          <BulletPointRow text="Simple note and picture taking collaboration" />
          <BulletPointRow text="Simple post-tour feedback messaging to listing agent" />
          <BulletPointRow text="Try it out by taking advantage of our one month free trial. Your subscription will automatically renew at the end of the trial period." />
          <BulletPointRow
            text={`Subscription will be charged to your ${
              Platform.OS === 'ios' ? 'Apple' : 'Play Store'
            } account at the end of the trial period or upon confirmation of purchase in cases where the trial has already been used. Subscription will automatically renew unless auto-renew is turned off at least 24-hours before the end of the current period.`}
          />
        </View>

        <View style={[tw.mX6, tw.borderT, tw.borderBlue500, tw.pT4, tw.mT4]}>{renderBottomContent()}</View>

        {/* Provides a little bit of padding at the bottom of ScrollView */}
        <View style={[tw.h8]} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SubscriptionOptions;
