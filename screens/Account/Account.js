import React, { useContext, useEffect, useState } from 'react';
import { NavigationEvents } from 'react-navigation';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { tw, color, colors } from 'react-native-tailwindcss';
import { BodyText, PrimaryButton } from '../../components';
import { ChevronRightIcon } from '../../assets/images';

import AgentTabContext from '../../navigation/AgentTabContext';
import BuyerSellerTabContext from '../../navigation/BuyerSellerTabContext';
import { subscriptionService } from '../../services';
import { cancelSubscription } from '../../services/subscriptionService';

const Account = ({ navigation, screenProps: { user } }) => {
  const { setNavigationParams } = useContext(user.isAgent ? AgentTabContext : BuyerSellerTabContext);
  const [isRecurring, setIsRecurring] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [showError, setShowError] = useState(false);
  const [cancelSubscriptionLoading, setCancelSubscriptionLoading] = useState(false);
  const [subscriptionCheckLoading, setSubscriptionCheckLoading] = useState(false);

  useEffect(() => {
    if (showError) {
      setTimeout(() => {
        setShowError(false);
      }, 2000);
    }
  }, [showError]);

  useEffect(() => {
    const getSubscriptionStatus = async () => {
      setSubscriptionCheckLoading(true);
      try {
        const subscriptionStatus = await subscriptionService.queries.getSubscriptionStatus(user.id);
        const {
          isRecurring: subscriptionIsRecurring,
          subscription: { originalOrderId },
        } = subscriptionStatus;

        setIsRecurring(subscriptionIsRecurring);
        setSubscriptionId(originalOrderId);
      } catch (error) {
        setIsRecurring(false);
        setSubscriptionId(null);
        console.log(`Error getting subscription status for user: ${user.id}`, error);
      }
      setSubscriptionCheckLoading(false);
    };

    // if (user.isAgent) getSubscriptionStatus();
  }, []);

  const promptCancelSubscription = () => {
    Alert.alert('Cancel Recurring Subscription', 'Are you sure want to cancel your recurring subscription?', [
      {
        text: 'Confirm',
        onPress: () => cancelSubscriptionCall(),
      },
      {
        text: 'Cancel',
        onPress: () => {},
      },
    ]);
  };

  const cancelSubscriptionCall = async () => {
    setCancelSubscriptionLoading(true);
    try {
      const cancelResponse = await cancelSubscription(subscriptionId);

      if (cancelResponse && cancelResponse.response === 'deleted') {
        setIsRecurring(false);
      } else {
        setShowError(true);
      }
    } catch (error) {
      console.log('Error cancelling subscription', error);
      setShowError(true);

      return error;
    }
    setCancelSubscriptionLoading(false);
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
      <ScrollView style={[tw.pB8, tw.bgPrimary]}>
        <TouchableOpacity
          onPress={() => navigation.push('EditName')}
          style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.p6]}
        >
          <BodyText lg style={[tw.mR2]}>
            Name:
          </BodyText>
          <View style={[tw.flexRow, tw.itemsCenter, tw.justifyEnd]}>
            <BodyText lg>
              {user.firstName} {user.lastName}
            </BodyText>
            <ChevronRightIcon style={[tw.mL4]} width={15} height={15} fill={color.gray700} />
          </View>
        </TouchableOpacity>
        <View style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.p6]}>
          <BodyText style={[tw.mR2]} lg>
            Email:
          </BodyText>
          <View style={[tw.flexRow, tw.itemsCenter, tw.justifyEnd]}>
            <BodyText lg>{user.emailAddress}</BodyText>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Verification', { phoneNumber: user.cellPhone, returnScreen: 'Account' })}
          style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.p6]}
        >
          <BodyText style={[tw.mR2]} lg>
            Phone:
          </BodyText>
          <View style={[tw.flexRow, tw.itemsCenter]}>
            <BodyText lg>{user.cellPhone}</BodyText>
            <ChevronRightIcon style={[tw.mL4]} width={15} height={15} fill={color.gray700} />
          </View>
        </TouchableOpacity>
        {user.isAgent && (
          <>
            <TouchableOpacity
              onPress={() => navigation.push('EditBrokerage')}
              style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.p6]}
            >
              <BodyText style={[tw.mR2]} lg>
                Brokerage:
              </BodyText>
              <View style={[tw.flexRow, tw.itemsCenter, tw.justifyEnd]}>
                <BodyText lg>{user.brokerage}</BodyText>
                <ChevronRightIcon style={[tw.mL4]} width={15} height={15} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.push('EditRealtorNumber')}
              style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.p6]}
            >
              <BodyText style={[tw.mR2]} lg>
                Realtor Number:
              </BodyText>
              <View style={[tw.flexRow, tw.itemsCenter, tw.justifyEnd]}>
                <BodyText lg>{user.realtorNumber}</BodyText>
                <ChevronRightIcon style={[tw.mL4]} width={15} height={15} />
              </View>
            </TouchableOpacity>
            {/* <View style={[tw.mX6, tw.mT2]}>
              <PrimaryButton
                onPress={() => navigation.navigate('SubscriptionHistory')}
                title="SHOW RECURRING HISTORY"
              />
            </View>
            {isRecurring && (
              <View style={[tw.mX6, tw.mT2]}>
                <PrimaryButton
                  disabled={cancelSubscriptionLoading}
                  onPress={promptCancelSubscription}
                  title="Cancel Recurring Subscription"
                  textStyle={[tw.flex1]}
                />
              </View>
            )}
            {showError && (
              <BodyText medium style={[tw.textRed500, tw.pL6]}>
                Error cancelling subscription. Please try again later
              </BodyText>
            )}
            {subscriptionCheckLoading && <ActivityIndicator size="large" style={[tw.mT4]} color={colors.gray500} />} */}
          </>
        )}
      </ScrollView>
    </>
  );
};

export default Account;
