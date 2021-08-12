import React, { useContext, useEffect } from 'react';
import { NavigationEvents } from 'react-navigation';
import { View, TouchableOpacity } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import dateformat from 'dateformat';
import BuyerSellerTabContext from '../../navigation/BuyerSellerTabContext';
import BuyerSellerShowingContext from './BuyerSellerShowingContext';
import { BodyText, CheckboxSquare, StatusIcon } from '../../components';
import { hoursToMilliseconds } from '../../helpers';
import { tourService } from '../../services';

const BuyerSellerShowingDetails = ({ navigation }) => {
  const { selectedShowing, setSelectedShowing, showings, setShowings } = useContext(BuyerSellerShowingContext);
  const { setNavigationParams } = useContext(BuyerSellerTabContext);
  const tourStopIdStr = navigation.getParam('tourStopId');

  useEffect(() => {
    if (tourStopIdStr) {
      const tourStopId = parseInt(tourStopIdStr);

      getShowing(tourStopId);
    }
  }, [tourStopIdStr]);

  const getShowing = async tourStopId => {
    const newShowing = await tourService.queries.getTourStop(tourStopId);

    setSelectedShowing(newShowing);
  };

  const updateShowings = ({ notifySeller }) => {
    const newShowing = { ...selectedShowing, notifySeller };
    const newShowings = showings.map(mapShowing =>
      mapShowing.tourStopId === newShowing.tourStopId ? newShowing : mapShowing
    );

    setSelectedShowing(newShowing);
    setShowings(newShowings);
  };

  const toggleNotification = async () => {
    try {
      const newNotificationEnabledSetting = !(selectedShowing.notifySeller || false);

      await tourService.mutations.updateTourStop({
        id: selectedShowing.tourStopId,
        notify_seller: newNotificationEnabledSetting,
      });

      setSelectedShowing({ ...selectedShowing, notifySeller: newNotificationEnabledSetting });
      updateShowings({ notifySeller: newNotificationEnabledSetting });
    } catch (error) {
      console.warn('Error toggling showing notifications: ', error);
    }
  };

  const {
    propertyOfInterest: { propertyListing },
    startTime = 0,
    duration = 0,
  } = selectedShowing;
  const cityState = `${propertyListing.city}, ${propertyListing.state}`;
  const showingDateStr = dateformat(startTime * 1000, 'dddd mm/dd/yyyy');
  const startTimeStr = dateformat(startTime * 1000, 'h:MMtt');
  const endTimeStr = dateformat(startTime * 1000 + hoursToMilliseconds(duration), 'h:MMtt');
  const showingTimeStr = `${startTimeStr} - ${endTimeStr}`;

  let statusString = 'Tour Time Suggested';

  switch (selectedShowing.status) {
    case 'timeSuggested':
      statusString = 'New Time Suggested';
      break;
    case 'approved':
      statusString = 'Time Approved';
      break;

    default:
      break;
  }

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Showing Detail',
            showSettingsBtn: true,
            showBackBtn: true,
          })
        }
      />
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol]}>
        <View style={[tw.flexCol, tw.justifyCenter, tw.pY4, tw.pX8]}>
          <TouchableOpacity
            style={[tw.flexCol, tw.justifyCenter, tw.mT1]}
            onPress={() =>
              navigation.navigate('BuyerSellerHomeDetails', {
                propertyListingId: propertyListing.id,
              })
            }
          >
            <BodyText bold xl style={[tw.pB1]}>
              {propertyListing.address.includes(',') ? propertyListing.address.split(',')[0] : propertyListing.address}
            </BodyText>
            <BodyText lg>{cityState}</BodyText>
          </TouchableOpacity>
          <View style={[tw.flexRow, tw.itemsCenter]}>
            <View style={[tw.mY4]}>
              <View style={[tw.flexRow, tw.justifyStart, tw.itemsCenter, tw.mT1]}>
                <BodyText bold md>
                  {showingDateStr}
                </BodyText>
              </View>
              <View style={[tw.flexRow, tw.justifyStart, tw.itemsCenter, tw.mT1]}>
                <BodyText bold md>
                  {showingTimeStr}
                </BodyText>
              </View>
            </View>
          </View>
          <View style={[tw.flexRow, tw.mY4, tw.itemsCenter]}>
            <StatusIcon status={selectedShowing.status} />
            <BodyText md style={[tw.textGray600]}>
              {statusString}
            </BodyText>
          </View>
          <TouchableOpacity style={[tw.flexRow, tw.mT8]} activeOpacity={0.7} onPress={toggleNotification}>
            <CheckboxSquare sm checked={selectedShowing.notifySeller} style={[tw.selfCenter]} />
            <BodyText style={[tw.mX3]}>Send me location notifications</BodyText>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default BuyerSellerShowingDetails;
