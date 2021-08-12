import React, { useEffect, useContext, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { colors, tw } from 'react-native-tailwindcss';
import { FontAwesome5 } from '@expo/vector-icons';
import { BodyText, PrimaryButton, SecondaryButton } from '../../../components';
import TourContext from '../TourContext';
import { tourService } from '../../../services';

const NewTourRouteCalculation = ({ navigation }) => {
  const { tour, tourStops } = useContext(TourContext);
  const [error, setError] = useState('');

  useEffect(() => {
    getPotentialRoutes();
  }, []);

  const getPotentialRoutes = async () => {
    try {
      setError('');
      const anyApproved = tourStops && tourStops.stops && tourStops.stops.some(stop => stop.status === 'approved');

      if (!tourStops || tourStops.length < 3 || anyApproved) {
        navigation.replace('NewTourHomeOrder');

        return;
      }

      const optimizeTourStopsInput = {
        tourStops: [],
      };

      for (const tourStop of tourStops) {
        const {
          propertyOfInterest: {
            propertyListing: { latitude, longitude },
          },
        } = tourStop;

        optimizeTourStopsInput.tourStops.push({
          id: tourStop.id,
          order: tourStop.order,
          latitude,
          longitude,
        });
      }

      if (tour.addressStr) {
        optimizeTourStopsInput.tourStops.push({
          id: 0,
          order: 0,
          latitude: tour.latitude,
          longitude: tour.longitude,
        });
      }

      await tourService.mutations.optimizeTourStops(optimizeTourStopsInput);

      navigation.replace('NewTourHomeOrder');
    } catch (error) {
      console.warn('Error optimizing route: ', error);
      setError('There was an error optimizing your tour route.');
    }
  };

  return (
    <View style={[tw.flexCol, tw.itemsCenter, tw.flex1, tw.bgPrimary]}>
      <FontAwesome5 name="route" style={[tw.textBlue500, tw.mT16, { fontSize: 100 }]} />
      <BodyText style={[tw.text2xl, tw.mT16, tw.mB16]}>Optimizing Tour Route</BodyText>

      {!error ? (
        <>
          <ActivityIndicator size="large" style={[tw.mTAuto, tw.mBAuto]} color={colors.gray500} />
          <BodyText style={[tw.mB8, tw.mTAuto]}>This process may take a few seconds.</BodyText>
        </>
      ) : (
        <View style={[tw.flexCol, tw.mX6, tw.mB8, tw.mTAuto]}>
          <BodyText style={[tw.textRed500, tw.mB4, tw.textCenter]}>{error}</BodyText>
          <PrimaryButton title="Retry" onPress={getPotentialRoutes} style={[tw.mB0]} />
          <SecondaryButton
            title="ORDER MYSELF"
            onPress={() => navigation.replace('NewTourHomeOrder')}
            style={[tw.border2, tw.borderBlue500, tw.mB0]}
            textStyle={[tw.textBlue500]}
          />
        </View>
      )}
    </View>
  );
};

export default NewTourRouteCalculation;
