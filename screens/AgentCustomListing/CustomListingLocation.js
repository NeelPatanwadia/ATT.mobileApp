import React, { useRef, useEffect, useState } from 'react';
import { SafeAreaView, Image, View, Platform } from 'react-native';
import { tw, color } from 'react-native-tailwindcss';
import MapView, { Marker } from 'react-native-maps';
import { MapPinIcon, DashboardIcon } from '../../assets/images';
import { BodyText, FlexLoader, PrimaryButton, PrimaryInput, SecondaryButton } from '../../components';
import { calcRegion } from '../../helpers';
import { propertyService } from '../../services';

const initialRegion = {
  latitude: 40,
  longitude: -95,
  latitudeDelta: 44.0,
  longitudeDelta: 80.0,
};

const CustomListingLocation = ({ navigation, screenProps: { user } }) => {
  const mapView = useRef(null);
  const [initialRegionSet, setInitialRegionSet] = useState(false);
  const [region, setRegion] = useState(initialRegion);
  const [mapReady, setMapReady] = useState(false);
  const [adding, setAdding] = useState(false);
  const [errors, setErrors] = useState({
    latitude: '',
    longitude: '',
  });

  const [createError, setCreateError] = useState('');

  const navLat = navigation.getParam('latitude', null);
  const navLng = navigation.getParam('longitude', null);

  const address = navigation.getParam('address', '');
  const city = navigation.getParam('city', '');
  const state = navigation.getParam('state', '');
  const zip = navigation.getParam('zip', '');

  const [coordinate, setCoordinate] = useState({
    latitude: `${navLat || 40}`,
    longitude: `${navLng || -100}`,
  });

  useEffect(() => {
    const passedLat = navigation.getParam('latitude', null);
    const passedLng = navigation.getParam('longitude', null);

    if (passedLat && passedLng) {
      const newRegion = calcRegion([{ latitude: passedLat, longitude: passedLng }]);

      setRegion(newRegion);
    }

    setInitialRegionSet(true);
  }, []);

  useEffect(() => {
    handleCoordinateChange();
  }, [coordinate.latitude, coordinate.longitude]);

  const handleCoordinateChange = () => {
    if (initialRegionSet) {
      const coordinatesValid = validateCoordinate(true);

      if (coordinatesValid) {
        const newCoords = { latitude: parseFloat(coordinate.latitude), longitude: parseFloat(coordinate.longitude) };

        if (Platform.OS === 'ios') {
          mapView.current.animateToRegion(newCoords, 500);
        } else if (region) {
          setRegion({ ...region, ...newCoords });
        } else {
          const calcCoords = calcRegion([newCoords]);

          setRegion(calcCoords);
        }
      }
    }
  };

  const resetCoordinates = () => {
    setCoordinate({
      latitude: `${navLat || 40}`,
      longitude: `${navLng || -100}`,
    });
  };

  const createCustomListing = async () => {
    try {
      setAdding(true);

      const coordinateIsValid = validateCoordinate(true);

      if (!coordinateIsValid) {
        setAdding(false);

        return;
      }

      await propertyService.mutations.createPropertyListing({
        latitude: parseFloat(coordinate.latitude),
        longitude: parseFloat(coordinate.longitude),
        address,
        city,
        state,
        zip,
        createdByUserId: user.id,
        isCustomListing: true,
      });

      const onAddFunc = navigation.getParam('onAdd', null);

      if (onAddFunc) {
        onAddFunc();
      }

      setAdding(false);

      navigation.navigate('AgentCustomListings');
    } catch (error) {
      let explanation = '';

      if (error.errors && error.errors[0]) {
        explanation = error.errors[0].message.includes('Duplicate entry') ? ': Listing already exists.' : '';
      }

      console.warn('Error adding custom property of interest: ', error);

      setCreateError(`Error Saving Listing${explanation}`);
    }

    setAdding(false);
  };

  const validateCoordinate = useErrors => {
    const { latitude, longitude } = coordinate;

    const latitudeValid = validateLatitude(latitude, useErrors);
    const longitudeVaild = validateLongitude(longitude, useErrors);

    return latitudeValid && longitudeVaild;
  };

  const validateLatitude = (latitude, useErrors) => {
    if (isEmptyOrSpaces(latitude)) {
      if (useErrors) {
        setErrors(prevState => ({ ...prevState, latitude: 'Latitude is required' }));
      }

      return false;
    }

    // eslint-disable-next-line
    if (isNaN(latitude)) {
      if (useErrors) {
        setErrors(prevState => ({ ...prevState, latitude: 'Latitude is invalid' }));
      }

      return false;
    }

    const latFloat = Number.parseFloat(latitude);

    if (latFloat < -90 || latFloat > 90) {
      if (useErrors) {
        setErrors(prevState => ({ ...prevState, latitude: 'Latitude must be between -90 and 90' }));
      }

      return false;
    }

    if (useErrors) {
      setErrors(prevState => ({ ...prevState, latitude: '' }));
    }

    return true;
  };

  const validateLongitude = (longitude, useErrors) => {
    if (isEmptyOrSpaces(longitude)) {
      if (useErrors) {
        setErrors(prevState => ({ ...prevState, longitude: 'Longitude is required' }));
      }

      return false;
    }

    // eslint-disable-next-line
    if (isNaN(longitude)) {
      if (useErrors) {
        setErrors(prevState => ({ ...prevState, longitude: 'Longitude is invalid' }));
      }

      return false;
    }

    const lonFloat = Number.parseFloat(longitude);

    if (lonFloat < -180 || lonFloat > 180) {
      if (useErrors) {
        setErrors(prevState => ({ ...prevState, longitude: 'Longitude must be between -180 and 180' }));
      }

      return false;
    }

    if (useErrors) {
      setErrors(prevState => ({ ...prevState, longitude: '' }));
    }

    return true;
  };

  const coordinateValid = validateCoordinate(false);

  return (
    <SafeAreaView style={[tw.flexCol, tw.flex1, tw.bgPrimary]}>
      <View style={[tw.flexCol, tw.pY4]}>
        <View style={[tw.flexCol, tw.pX6]}>
          <BodyText style={[tw.textSm, tw.textRed500]}>{createError}</BodyText>
          <View style={[tw.flexRow, tw.mT2, tw.mB2]}>
            <Image
              source={DashboardIcon}
              style={[tw.h8, tw.w8, tw.mR4, tw.mT2, { tintColor: color.blue500 }]}
              resizeMode="contain"
            />

            <View style={[tw.flexCol]}>
              <BodyText style={[tw.textXl, tw.mB2]}>Confirm Listing Location</BodyText>
              <BodyText sm>{address}</BodyText>
              <BodyText sm>{`${city}, ${state} ${zip}`}</BodyText>
            </View>
          </View>
          <BodyText style={[tw.mT2]}>Latitude</BodyText>

          <PrimaryInput
            placeholder=""
            autoCapitalize="words"
            onChangeText={text => setCoordinate(prevState => ({ ...prevState, latitude: text }))}
            returnKeyType="next"
            keyboardType={Platform.select({
              ios: 'numbers-and-punctuation',
              android: 'numeric',
            })}
            errorMessage={errors.latitude}
            value={coordinate.latitude}
          />

          <BodyText style={[tw.mT6]}>Longitude</BodyText>

          <PrimaryInput
            placeholder=""
            autoCapitalize="words"
            onChangeText={text => setCoordinate(prevState => ({ ...prevState, longitude: text }))}
            keyboardType={Platform.select({
              ios: 'numbers-and-punctuation',
              android: 'numeric',
            })}
            errorMessage={errors.longitude}
            value={coordinate.longitude}
          />
        </View>
      </View>

      {!navLat || !navLng ? (
        <BodyText style={[tw.pX6, tw.textRed500]} sm>
          Could not calculate location from address.
        </BodyText>
      ) : (
        <BodyText style={[tw.pX6]} xs>
          Initial location is based on the address provided.
        </BodyText>
      )}

      <BodyText style={[tw.pX6]} xs>
        Press, hold, and drag the marker to update the location.
      </BodyText>

      <View style={[tw.flex1, tw.mT4]}>
        {region ? (
          <MapView
            style={[tw.wFull, tw.z0, tw.hFull, { minHeight: 75 }]}
            onRegionChangeComplete={setRegion}
            region={region}
            ref={mapView}
            rotateEnabled={false}
            onMapReady={() => setMapReady(true)}
          >
            {(mapReady || Platform.OS === 'ios') && coordinateValid && (
              <Marker
                draggable
                coordinate={{
                  latitude: parseFloat(coordinate.latitude) || 0,
                  longitude: parseFloat(coordinate.longitude) || 0,
                }}
                hitSlop={{ top: 20, left: 20, right: 20, bottom: 20 }}
                tracksViewChanges={Platform.OS !== 'android'}
                onDragEnd={e => {
                  setCoordinate({
                    latitude: `${e.nativeEvent.coordinate.latitude.toFixed(8)}`,
                    longitude: `${e.nativeEvent.coordinate.longitude.toFixed(8)}`,
                  });
                }}
              >
                <MapPinIcon
                  width={24}
                  height={27}
                  fill={color.blue500}
                  stroke={color.blue500}
                  style={[Platform.OS === 'ios' && tw.mB4]}
                />
              </Marker>
            )}
          </MapView>
        ) : (
          <FlexLoader />
        )}
      </View>

      <View style={[tw.wFull, tw.selfCenter, tw.pT4, tw.pB2, tw.pX8, tw.borderT, tw.borderGray300]}>
        <SecondaryButton
          style={[tw.rounded, tw.border, tw.borderBlue500, tw.mT0]}
          title="RESET COORDINATES"
          textStyle={[tw.textBlue500]}
          onPress={resetCoordinates}
        />

        <PrimaryButton
          title="CREATE LISTING"
          loading={adding}
          loadingTitle="CREATING LISTING"
          disabled={!coordinateValid}
          style={[tw.mT0]}
          onPress={createCustomListing}
        />
      </View>
    </SafeAreaView>
  );
};

export default CustomListingLocation;

const isEmptyOrSpaces = str => str === null || str.match(/^ *$/) !== null;
