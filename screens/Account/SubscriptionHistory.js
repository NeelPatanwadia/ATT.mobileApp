import dateFormat from 'dateformat';
import React, { useState, useEffect, useContext } from 'react';
import { ActivityIndicator, FlatList, Linking, View } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { NavigationEvents } from 'react-navigation';
import { BodyText, PrimaryButton } from '../../components';
import AgentTabContext from '../../navigation/AgentTabContext';
import { getInvoiceList } from '../../services/subscriptionService';

const SubscriptionHistory = ({ screenProps: { user } }) => {
  const { setNavigationParams } = useContext(AgentTabContext);
  const [invoiceList, setInvoiceList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getInvoice = async () => {
      setIsLoading(true);
      try {
        const { response } = await getInvoiceList(user.id);

        if (response && response.length > 0) {
          setInvoiceList(response);
        }
        console.log('response', response);
      } catch (error) {
        setInvoiceList([]);
        console.log('Error getting invoice', error);
      }
      setIsLoading(false);
    };

    getInvoice();
  }, []);

  const renderText = (label, value) => (
    <View style={[tw.flexRow, tw.mT2]}>
      <BodyText>{label}</BodyText>
      <BodyText style={[tw.flex1]}>{value}</BodyText>
    </View>
  );

  const renderInvoiceList = ({ item }) => {
    const {
      amount_paid: amountPaid,
      billing_reason: billingReason,
      id,
      interval,
      invoice_pdf: invoicePdf,
      paid,
      period_start: periodStart,
      subscription,
    } = item;

    const amountText =
      amountPaid === 0 && paid ? 'Free trial' : `${paid ? `$ ${amountPaid / 100} (Paid)` : 'Not paid'}`;

    const billingReasonText =
      amountPaid === 0 ? '-' : `${billingReason === 'subscription_create' ? 'Paid by user' : 'Recurred'}`;

    return (
      <View style={[tw.border, tw.borderGray500, tw.rounded, tw.p2, tw.m2]}>
        {renderText('Order Id: ', subscription)}
        {renderText('Purchased Date: ', dateFormat(periodStart * 1000, 'mm/dd/yyyy h:MMtt'))}
        {renderText('Interval: ', interval)}
        {renderText('Amount: ', amountText)}
        {renderText('Billing: ', billingReasonText)}
        <PrimaryButton key={id} title="download invoice" onPress={() => Linking.openURL(invoicePdf)} />
      </View>
    );
  };

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Subscription History',
            showBackBtn: true,
            showSettingsBtn: true,
          })
        }
      />
      <View style={[tw.flex1]}>
        {isLoading ? (
          <View style={[tw.flexCol, tw.flex1, tw.justifyCenter, tw.itemsCenter, tw.bgPrimary]}>
            <ActivityIndicator size="large" color={color.gray500} />
          </View>
        ) : (
          <FlatList data={invoiceList} renderItem={renderInvoiceList} keyExtractor={item => `item-${item.id}`} />
        )}
      </View>
    </>
  );
};

export default SubscriptionHistory;
