import React, { useEffect, useState, useRef, useContext } from 'react';
import { ScrollView, View, TouchableOpacity, Platform } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import MapView, { Marker } from 'react-native-maps';
import {
  AgentModal,
  BodyText,
  CustomPill,
  PrimaryButton,
  SecondaryButton,
  PanelScreen,
  FlexLoader,
} from '../../../components';
import { calcRegion, splitScreenRegion } from '../../../helpers';
import { tourService } from '../../../services';
import { MapPinIcon } from '../../../assets/images';

import TourContext from '../TourContext';
import CustomStartModal from './CustomStartModal';
import useTimeString from '../../../helpers/useTimeString';

const PropertyCard = ({ onPress, style = [], propertyOfInterest, selected, customFirstStop }) => {
  const isCustomListing =
    propertyOfInterest && propertyOfInterest.propertyListing && propertyOfInterest.propertyListing.isCustomListing;

  let cardIcon = (
    <View
      style={[
        tw.w6,
        tw.h6,
        tw.roundedFull,
        tw.bgWhite,
        tw.border,
        tw.border2,
        tw.borderBlue400,
        tw.itemsCenter,
        tw.justifyCenter,
      ]}
    />
  );

  if (selected) {
    cardIcon = (
      <View
        style={[
          tw.w6,
          tw.h6,
          tw.roundedFull,
          tw.bgWhite,
          tw.border,
          tw.borderBlue400,
          tw.itemsCenter,
          tw.justifyCenter,
        ]}
      >
        <View style={[tw.w5, tw.h5, tw.roundedFull, tw.bgBlue400, tw.border, tw.borderBlue500]} />
      </View>
    );
  }

  if (customFirstStop) {
    cardIcon = (
      <View
        style={[
          tw.w6,
          tw.h6,
          tw.roundedFull,
          tw.bgWhite,
          tw.border,
          tw.border2,
          tw.borderGray400,
          tw.itemsCenter,
          tw.justifyCenter,
        ]}
      />
    );
  }

  const getPropertyAddress = () => {
    if (propertyOfInterest && propertyOfInterest.propertyListing) {
      const {
        propertyListing: { address, city, state, zip },
      } = propertyOfInterest;

      return (
        <>
          <BodyText md>{address.includes(',') ? address.split(',')[0] : address}</BodyText>
          <BodyText md>{`${city}, ${state} ${zip}`}</BodyText>
        </>
      );
    }

    return <View />;
  };

  return (
    <TouchableOpacity
      disabled={customFirstStop}
      onPress={onPress}
      activeOpacity={0.7}
      style={[tw.shadow, tw.wFull, tw.pY4, tw.bgGray100, tw.mY1, tw.flexRow, tw.justifyCenter, ...style]}
    >
      <View style={[tw.flexRow, tw.mL4, tw.w5_6, tw.justifyBetween]}>
        <View style={[tw.flexCol, tw.justifyCenter, tw.mY1, tw.flex1]}>
          {getPropertyAddress()}
          {isCustomListing ? <CustomPill containerStyle={[tw.mT2]} /> : null}
        </View>
        <View style={[tw.justifyCenter, tw.p2]}>{cardIcon}</View>
      </View>
    </TouchableOpacity>
  );
};

const NewTourHomeFirst = ({ navigation }) => {
  const [initialRegionSet, setInitialRegionSet] = useState(false);
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const { client, tour, setTour, tourStops, setTourStops, tours, setTours } = useContext(TourContext);
  const { startTime = 0, endTime = 0, totalDuration = 0 } = tour;
  const { tourDateStr, timeStr } = useTimeString(startTime, endTime, totalDuration);
  const mapView = useRef(null);

  useEffect(() => {
    getStops();
  }, []);

  useEffect(() => {
    if (mapReady && tour) {
      updateRegion();
    }
  }, [tour, mapReady]);

  const getStops = async () => {
    try {
      const dbTourStops = await tourService.queries
        .listTourStops(tour.id)
        .catch(err => console.warn('Error listing tour stops: ', err));

      const propertyListings = dbTourStops.map(stop => stop.propertyOfInterest.propertyListing);

      const regionCoordinates = propertyListings.map(({ latitude, longitude }) => ({ latitude, longitude }));

      if (tour.addressStr) {
        regionCoordinates.push({
          latitude: tour.latitude,
          longitude: tour.longitude,
        });
      }

      const newRegion = calcRegion(regionCoordinates);
      const splitRegion = splitScreenRegion(newRegion);

      setRegion(splitRegion);
      setInitialRegionSet(true);
      setTourStops(dbTourStops);
    } catch (error) {
      console.warn('Error getting tour stops: ', error);
    }
  };

  const nextPage = async () => {
    setLoading(true);

    try {
      // TODO: Make this a transaction -- could potentially lead to some funky behavior if one stop fails to update
      await Promise.all(tourStops.map(({ id, order }) => tourService.mutations.updateTourStop({ id, order })));

      setLoading(false);

      const anyApproved = tourStops && tourStops.stops && tourStops.stops.some(stop => stop.status === 'approved');

      if (!tour.routeSet && !tour.manuallyOrderedShowings && !anyApproved) {
        navigation.navigate('NewTourRouteCalculation');
      } else {
        console.log('Tour route already set, skipping to order page');

        navigation.navigate('NewTourHomeOrder');
      }

      return;
    } catch (error) {
      console.warn('Error updating tour stops: ', error);
    }

    setLoading(false);
  };
  const clientName = client ? `${client.firstName} ${client.lastName}` : '';

  if (!tour || !tour.id) return <FlexLoader />;

  const updateRegion = () => {
    try {
      if (!mapReady) {
        return;
      }

      const propertyListings = tourStops.map(stop => stop.propertyOfInterest.propertyListing);

      const regionCoordinates = propertyListings.map(({ latitude, longitude }) => ({ latitude, longitude }));

      if (tour.addressStr) {
        regionCoordinates.push({
          latitude: tour.latitude,
          longitude: tour.longitude,
        });
      }

      const newRegion = calcRegion(regionCoordinates);
      const splitRegion = splitScreenRegion(newRegion);

      if (mapView.current) {
        mapView.current.animateToRegion(splitRegion, 300);
      }
    } catch (error) {
      console.warn('Error updating map region: ', error);
    }
  };

  const selectFirstStop = tourStop => {
    let newIdx = 1;
    const newTourStops = tourStops
      .sort((a, b) => a.order < b.order)
      .map(ts => {
        if (ts.id === tourStop.id) {
          return { ...tourStop, order: 1 };
        }

        newIdx += 1;

        return { ...ts, order: newIdx };
      });

    setTourStops(newTourStops);
  };

  const addCustomStart = async customStartObj => {
    try {
      const { addressStr, latitude, longitude, customStartName } = customStartObj;

      await tourService.mutations.updateTour({
        id: tour.id,
        addressStr,
        latitude,
        longitude,
        customStartName,
      });

      const updatedTour = {
        ...tour,
        addressStr,
        latitude,
        longitude,
        customStartName,
      };

      setTour(updatedTour);
      const newTours = tours.map(mapTour => (mapTour.id === updatedTour.id ? updatedTour : mapTour));

      setTours(newTours);

      navigation.goBack(null);
    } catch (error) {
      console.warn('Error adding custom start', error);
    }
  };

  const removeCustomStart = async () => {
    try {
      await tourService.mutations.updateTour({
        id: tour.id,
        addressStr: '',
        latitude: '',
        longitude: '',
        customStartName: '',
      });
      const updatedTour = { ...tour };

      delete updatedTour.addressStr;
      delete updatedTour.latitude;
      delete updatedTour.longitude;
      delete updatedTour.customStartName;

      setTour(updatedTour);

      const newTours = tours.map(mapTour => (mapTour.id === updatedTour.id ? updatedTour : mapTour));

      setTours(newTours);
    } catch (error) {
      console.warn('Error removing custom start', error);
    }
  };

  const getMarkers = () => {
    let markers = [];

    try {
      markers = tourStops.map(tourStop => {
        const active = tourStop.order === 1 && !tour.addressStr;

        const {
          propertyOfInterest: {
            propertyListing: { latitude, longitude },
          },
        } = tourStop;

        const primaryColor = active ? color.blue500 : color.white;
        const secondaryColor = active ? color.blue400 : color.gray500;

        return (
          <Marker
            key={`marker-${tourStop.id}-${active}`}
            tracksViewChanges={Platform.OS !== 'android'}
            coordinate={{
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            }}
            flat
            pinColor={primaryColor}
            onPress={() => selectFirstStop(tourStop)}
          >
            <MapPinIcon width={24} height={27} fill={secondaryColor} stroke={primaryColor} style={[tw.mB4]} />
          </Marker>
        );
      });

      if (tour.addressStr) {
        markers.push(
          <Marker
            key="marker-custom-first"
            coordinate={{
              latitude: parseFloat(tour.latitude),
              longitude: parseFloat(tour.longitude),
            }}
            flat
          >
            <MapPinIcon width={24} height={27} fill={color.teal500} stroke={color.blue400} style={[tw.mB4]} />
          </Marker>
        );
      }
    } catch (error) {
      console.warn('Error getting map markers: ', error);
    }

    return markers;
  };

  const propertyCards = tourStops
    .sort((a, b) => a.id > b.id)
    .map((tourStop, idx) => {
      const customFirstStop = !!tour.addressStr;
      const active = tourStop.order === 1;

      return (
        <PropertyCard
          key={`location-${idx}`}
          customFirstStop={customFirstStop}
          selected={active}
          propertyOfInterest={tourStop.propertyOfInterest}
          onPress={() => selectFirstStop(tourStop)}
        />
      );
    });

  return (
    <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol]}>
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol]}>
        <View style={[tw.wFull, tw.flex1]}>
          <View style={[tw.w5_6, tw.selfCenter, tw.mB4]}>
            <View style={[tw.mT3, tw.mB16]}>
              <BodyText lg center>{`${clientName}: ${tour.name}`}</BodyText>
              <BodyText md center style={[tw.mY2, tw.mB2]}>
                {tourDateStr} {timeStr}
              </BodyText>
              {tour.addressStr && tour.customStartName ? (
                <View style={[tw.mL4, tw.w5_6, tw.justifyCenter]}>
                  <BodyText italic bold style={[tw.mT1]}>
                    {tour.customStartName}
                  </BodyText>
                  <BodyText italic style={[tw.mT1]}>
                    {tour.addressStr}
                  </BodyText>
                </View>
              ) : (
                <BodyText italic center style={[tw.mT1]}>
                  Select The First Property
                </BodyText>
              )}
            </View>
          </View>
          <View style={[tw.relative, tw.flexCol, tw.flex1]}>
            {initialRegionSet ? (
              <PanelScreen
                map={
                  <MapView
                    style={[tw.wFull, tw.z0, tw.hFull]}
                    onRegionChangeComplete={setRegion}
                    region={region}
                    ref={mapView}
                    onMapReady={() => setMapReady(true)}
                  >
                    {getMarkers()}
                  </MapView>
                }
                onNext={console.log}
                updateRegion={updateRegion}
              >
                <ScrollView style={[tw.wFull, tw.flex1, tw.bgPrimary]}>{propertyCards}</ScrollView>
              </PanelScreen>
            ) : (
              <FlexLoader />
            )}
          </View>
        </View>
        <View style={[tw.w5_6, tw.selfCenter, tw.mY2]}>
          {tour.addressStr ? (
            <SecondaryButton
              title="REMOVE CUSTOM STARTING ADDRESS"
              style={[tw.border2, tw.borderRed500, tw.mB2, tw.mT2]}
              textStyle={[tw.textRed500]}
              onPress={removeCustomStart}
            />
          ) : (
            <AgentModal
              title="Starting Address"
              trigger={
                <SecondaryButton
                  title="ADD CUSTOM STARTING ADDRESS"
                  style={[tw.border2, tw.borderBlue500, tw.mB2, tw.mT2]}
                  textStyle={[tw.textBlue500]}
                />
              }
              navigation={navigation}
            >
              <CustomStartModal
                title="Add a starting location to the Tour"
                tourId={tour.id}
                clientId={tour.clientId}
                onSubmit={addCustomStart}
              />
            </AgentModal>
          )}
          <PrimaryButton style={[tw.mT2]} title="Next" onPress={nextPage} loading={loading} />
        </View>
      </View>
    </View>
  );
};

export default NewTourHomeFirst;
