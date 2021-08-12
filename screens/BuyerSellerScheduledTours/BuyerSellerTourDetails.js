import React, { useContext, useState, useEffect } from 'react';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { View, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import dateformat from 'dateformat';
import { tw } from 'react-native-tailwindcss';
import { hoursToSeconds } from '../../helpers';
import { BodyText, PrimaryButton } from '../../components';
import BuyerSellerTabContext from '../../navigation/BuyerSellerTabContext';
import BuyerSellerTourContext from './BuyerSellerTourContext';
import BuyerSellerTourStopCard from './BuyerSellerTourStopCard';
import { tourService } from '../../services';

const BuyerSellerTourDetails = ({ navigation }) => {
  const { setNavigationParams } = useContext(BuyerSellerTabContext);
  const { selectedTour, tourStops, setTourStops, setSelectedTourStop, setSelectedTour } = useContext(
    BuyerSellerTourContext
  );
  const { startTime = 0, endTime, name } = selectedTour;
  const [startingTour, setStartingTour] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  let tourDateTimeStr = dateformat(new Date(parseInt(startTime) * 1000), 'm/d/yyyy h:MMtt');

  if (endTime) {
    tourDateTimeStr += `-${dateformat(new Date(parseInt(endTime) * 1000), 'h:MMtt')}`;
  }

  useEffect(() => {
    getTourStops();
    getTour();
  }, []);

  const getTourStops = async () => {
    try {
      const stops = await tourService.queries.listTourStops(selectedTour.id);
      const deletedTourStops = await tourService.queries.listTourStopsOfDeletedPropertyOfInterest({
        tourId: selectedTour.id,
      });

      setTourStops(stops.concat(deletedTourStops));
    } catch (error) {
      console.warn('Error getting tour stops: ', error);
    }
  };

  const getTour = async () => {
    try {
      const tour = await tourService.queries.getTour(selectedTour.id);

      setSelectedTour(tour);
    } catch (error) {
      console.warn('Error getting tour: ', error);
    }
  };

  const startTour = async () => {
    try {
      setStartingTour(true);
      setErrorMessage('');

      if (tourStops && tourStops.length > 0) {
        const [firstTourStop] = tourStops.sort((a, b) => a.order > b.order);

        setSelectedTourStop(firstTourStop);
        setStartingTour(false);

        navigation.navigate({
          routeName: 'BuyerSellerLiveTour',
          params: { tourStopId: firstTourStop.id },
          key: firstTourStop.id,
        });
      }
    } catch (error) {
      console.log('Error starting tour: ', error);
      setErrorMessage('An error occurred attempting to start the tour.');
      setStartingTour(false);
    }
  };

  const directionsToCustomStart = () => {
    const customStartDirections = `http://maps.apple.com/?daddr=${selectedTour.addressStr}&dirflg=d`;

    try {
      Linking.openURL(customStartDirections);
    } catch (error) {
      console.log('Error getting directions for custmom start: ', error);
      setErrorMessage('An error occurred attempting to get directions to the custom start location.');
    }
  };

  const navTourStopDetails = navTourStop => {
    setSelectedTourStop(navTourStop);
    if (navTourStop.propertyOfInterestId) {
      navigation.navigate({
        routeName: 'BuyerSellerHomeDetails',
        params: { propertyOfInterestId: navTourStop.propertyOfInterestId },
        key: `home-details-${navTourStop.propertyOfInterestId}`,
      });
    } else {
      Alert.alert('', 'Home has been removed by the agent.');
    }
  };

  const tourStopCards = tourStops
    .sort((a, b) => a.order > b.order)
    .map((mapTourStop, idx) => {
      const arriveTime = mapTourStop.startTime;
      const leaveTime = arriveTime ? arriveTime + hoursToSeconds(mapTourStop.duration) : null;

      const tourStopTimeStr =
        arriveTime && leaveTime
          ? `${dateformat(arriveTime * 1000, 'h:MMtt')} - ${dateformat(leaveTime * 1000, 'h:MMtt')}`
          : 'Showing Time Not Selected';

      return (
        <BuyerSellerTourStopCard
          key={`tourStop-${idx}`}
          onPress={() => navTourStopDetails(mapTourStop)}
          tourStopTimeStr={tourStopTimeStr}
          tourStop={mapTourStop}
        />
      );
    });

  const disabled = !tourStops.length || !tourStops.every(ts => ts.status === 'approved');

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Tour Details',
            showBackBtn: true,
            showSettingsBtn: true,
          })
        }
      />
      <ScrollView style={[tw.bgPrimary]}>
        <View style={[tw.mT8, tw.w5_6, tw.selfCenter, tw.pB6]}>
          <BodyText lg bold style={[tw.mB1]}>
            {name}
          </BodyText>
          <BodyText md>{tourDateTimeStr}</BodyText>
        </View>
        {selectedTour.addressStr ? (
          <TouchableOpacity
            style={[tw.shadow, tw.flex1, tw.wFull, tw.bgGray100, tw.pY4, tw.pX4, tw.flexRow, tw.itemsCenter]}
            onPress={directionsToCustomStart}
          >
            <View style={[tw.hFull, tw.flex1, tw.flexCol, tw.justifyCenter]}>
              <BodyText md bold style={[tw.mB1]}>
                {selectedTour.customStartName}
              </BodyText>
              <BodyText md bold style={[tw.mB1, tw.textBlue500, tw.underline]}>
                (Map It)
              </BodyText>
              <BodyText md bold style={[tw.textGray800]}>
                {`${dateformat(selectedTour.startTime * 1000, 'h:MMtt')}`}
              </BodyText>
              <BodyText md italic style={[tw.mT1]}>
                Tour Start Location
              </BodyText>
              <BodyText md style={[tw.mY1]}>
                {selectedTour.addressStr}
              </BodyText>
            </View>
          </TouchableOpacity>
        ) : null}
        <View style={[tw.mY4]}>{tourStopCards}</View>
        <View style={[tw.w5_6, tw.selfCenter, tw.pY4]}>
          {disabled && <BodyText style={[tw.mT4, tw.textBlue500]}>This tour is pending approval.</BodyText>}
          <PrimaryButton
            disabled={disabled}
            title="Start Tour"
            onPress={startTour}
            loading={startingTour}
            loadingTitle="Starting Tour"
          />
        </View>

        <BodyText style={[tw.mT4, tw.textBlue500]}>{errorMessage}</BodyText>
      </ScrollView>
    </>
  );
};

export default withNavigationFocus(BuyerSellerTourDetails);
