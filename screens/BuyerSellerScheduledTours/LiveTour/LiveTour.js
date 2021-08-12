import React, { useState, useContext, useEffect } from 'react';
import { NavigationEvents } from 'react-navigation';
import { AsyncStorage, Image, View, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { colors, tw } from 'react-native-tailwindcss';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { BodyText, SecondaryButton } from '../../../components';
import { propertyService } from '../../../services';
import { CompassIcon } from '../../../assets/images';
import BuyerSellerTabContext from '../../../navigation/BuyerSellerTabContext';
import BuyerSellerTourContext from '../BuyerSellerTourContext';
import Carousel from '../../ScheduledTours/LiveTour/Carousel';
import LiveTourStopCard from '../../ScheduledTours/LiveTour/LiveTourStopCard';
import { logEvent, EVENT_TYPES, APP_REGIONS } from '../../../helpers/logHelper';

const BuyerSellerLiveTour = ({ navigation }) => {
  const { selectedTour, selectedTourStop, setSelectedTourStop, tourStops } = useContext(BuyerSellerTourContext);
  const { startTime = 0 } = selectedTour;
  const { setNavigationParams } = useContext(BuyerSellerTabContext);
  const [propertyImages, setPropertyImages] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState();

  const {
    propertyOfInterest: { propertyListing },
  } = selectedTourStop;
  const directionsUrl = `http://maps.apple.com/?daddr=${
    propertyListing.address.includes(',') ? propertyListing.address.split(',')[0] : propertyListing.address
  }+${propertyListing.city}+${propertyListing.state}+${propertyListing.zip}&dirflg=d`;

  const sortedTourStops = tourStops.sort((a, b) => a.order - b.order);
  const foundIndex = sortedTourStops.findIndex(stop => stop.id === selectedTourStop.id);

  const nextStop =
    (foundIndex || foundIndex === 0) && sortedTourStops && sortedTourStops.length > foundIndex + 1
      ? sortedTourStops[foundIndex + 1]
      : null;

  const prevStop = foundIndex && sortedTourStops && sortedTourStops.length > 1 ? sortedTourStops[foundIndex - 1] : null;

  const pageProgress = `${foundIndex + 1}/${tourStops.length}`;

  useEffect(() => {
    getImages();
    linkToDirections();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('storeTourStops', JSON.stringify(tourStops));
  }, [tourStops]);

  const getImages = async () => {
    try {
      const dbPropertyImages = await propertyService.queries.listPropertyListingImages(propertyListing.id);

      setPropertyImages(dbPropertyImages);
      if (dbPropertyImages && dbPropertyImages.length > 0) {
        dbPropertyImages.map(img => Image.prefetch(img.mediaUrl));
      }
      setImagesLoaded(true);
    } catch (error) {
      logEvent({
        message: `Error getting images for Live Tour ${
          selectedTour && selectedTour.id ? selectedTour.id : 'UNKNOWN'
        }: ${JSON.stringify(error)}`,
        appRegion: APP_REGIONS.LIVE_TOUR,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const linkToDirections = () => {
    try {
      Linking.openURL(directionsUrl);
    } catch (error) {
      logEvent({
        message: `Error getting directions for Live Tour ${
          selectedTour && selectedTour.id ? selectedTour.id : 'UNKNOWN'
        }: ${JSON.stringify(error)}`,
        appRegion: APP_REGIONS.LIVE_TOUR,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const liveTourCards = [
    <LiveTourStopCard tourStop={selectedTourStop} nextStop={nextStop} startTime={startTime} />,
    ...propertyImages.map((propertyImage, idx) => (
      <View style={[tw.w48, tw.h48]}>
        <Image key={`propertyImage-${idx}`} style={[tw.wFull, tw.h48]} source={{ uri: propertyImage.mediaUrl }} />
      </View>
    )),
  ];

  const navigateBack = async () => {
    try {
      setNextLoading(true);

      if (prevStop) {
        try {
          await logEvent({
            message: `Navigating to Previous Tour Stop: ${prevStop.id} on Live Tour`,
            appRegion: APP_REGIONS.LIVE_TOUR,
            eventType: EVENT_TYPES.INFO,
          });
        } catch (error) {
          console.log('Error setting current tour stop on back: ', error);
          setErrorMessage('There has been an error navigating back.');
        }

        setSelectedTourStop(prevStop);

        setNextLoading(false);

        navigation.navigate({
          routeName: 'BuyerSellerLiveTour',
          params: { tourStopId: prevStop.id },
          key: prevStop.id,
        });
      } else {
        await logEvent({
          message: `Backing out of Live Tour ${selectedTour.id}`,
          appRegion: APP_REGIONS.LIVE_TOUR,
          eventType: EVENT_TYPES.INFO,
        });

        setNextLoading(false);
        navigation.navigate('BuyerSellerScheduledTours', null);
      }
    } catch (error) {
      setNextLoading(false);
      setErrorMessage('There has been an error navigating back.');

      await logEvent({
        message: `Error saving tour stop info on back for Live Tour ${
          selectedTour && selectedTour.id ? selectedTour.id : 'UNKNOWN'
        }: ${JSON.stringify(error)}`,
        appRegion: APP_REGIONS.LIVE_TOUR,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const navigateNext = async () => {
    try {
      setNextLoading(true);

      if (nextStop) {
        try {
          await logEvent({
            message: `Navigating to Next Tour Stop: ${nextStop.id} on Live Tour`,
            appRegion: APP_REGIONS.LIVE_TOUR,
            eventType: EVENT_TYPES.INFO,
          });
        } catch (error) {
          setErrorMessage('There has been an error navigating forward.');
          console.log('Error updating current tour stop on next: ', error);
        }

        setSelectedTourStop(nextStop);

        setNextLoading(false);

        navigation.navigate({
          routeName: 'BuyerSellerLiveTour',
          params: { tourStopId: nextStop.id },
          key: nextStop.id,
        });
      } else {
        try {
          await logEvent({
            message: `Live Tour ${selectedTour.id} completed`,
            appRegion: APP_REGIONS.LIVE_TOUR,
            eventType: EVENT_TYPES.INFO,
          });
        } catch (error) {
          setErrorMessage('There has been an error finishing the tour.');
          console.warn('Error marking tour complete: ', error);
        }

        setNextLoading(false);

        navigation.push('BuyerSellerScheduledTours', null);
      }
    } catch (error) {
      setNextLoading(false);

      await logEvent({
        message: `Error saving tour stop info on next for Live Tour ${
          selectedTour && selectedTour.id ? selectedTour.id : 'UNKNOWN'
        }: ${JSON.stringify(error)} `,
        appRegion: APP_REGIONS.LIVE_TOUR,
        eventType: EVENT_TYPES.ERROR,
      });

      setErrorMessage('There has been an error navigating forward.');
      console.warn('Error navigating next on live tour: ', error);
    }
  };

  return (
    <>
      <NavigationEvents onWillFocus={() => setNavigationParams({ headerTitle: 'Live Tour', showBackBtn: false })} />
      <KeyboardAwareScrollView style={[tw.hFull, tw.bgPrimary]}>
        <View style={[tw.hFull]}>
          <View style={[tw.mT4, tw.w5_6, tw.selfCenter]}>
            <View style={[tw.flexRow, tw.justifyBetween]}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('BuyerSellerHomeDetails', {
                    propertyOfInterestId: selectedTourStop.propertyOfInterest.id,
                  })
                }
              >
                <BodyText bold xl>
                  {selectedTourStop.propertyOfInterest.propertyListing.address.includes(',')
                    ? selectedTourStop.propertyOfInterest.propertyListing.address.split(',')[0]
                    : selectedTourStop.propertyOfInterest.propertyListing.address}
                </BodyText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[tw.w8, tw.h8, tw.roundedFull, tw.justifyCenter, tw.itemsCenter]}
                onPress={linkToDirections}
              >
                <CompassIcon width={25} height={25} />
              </TouchableOpacity>
            </View>
            <BodyText>{`${selectedTourStop.propertyOfInterest.propertyListing.city}, ${selectedTourStop.propertyOfInterest.propertyListing.state}`}</BodyText>
          </View>
          {imagesLoaded && <Carousel items={liveTourCards} />}
          <View style={[tw.flexRow, tw.itemsCenter, tw.justifyCenter, tw.alignCenter]}>
            <View style={[tw.flex1]}>
              <SecondaryButton title={prevStop ? 'Previous Home' : 'Back'} style={[tw.wFull]} onPress={navigateBack} />
            </View>
            <View style={[tw.pX4]}>
              <BodyText style={[tw.selfCenter]}>{pageProgress}</BodyText>
            </View>
            <View style={[tw.flex1, tw.justifyEnd]}>
              <SecondaryButton title={nextStop ? 'Next Home' : 'Finish'} style={[tw.wFull]} onPress={navigateNext} />
            </View>
          </View>
          {errorMessage ? (
            <View style={[tw.wFull, tw.justifyCenter, tw.itemsCenter]}>
              <BodyText style={[tw.textRed500]}>{errorMessage}</BodyText>
            </View>
          ) : null}
          {nextLoading ? (
            <View style={[tw.wFull, tw.justifyCenter, tw.itemsCenter]}>
              <ActivityIndicator size="small" color={colors.gray500} />
            </View>
          ) : null}
        </View>
      </KeyboardAwareScrollView>
    </>
  );
};

export default BuyerSellerLiveTour;
