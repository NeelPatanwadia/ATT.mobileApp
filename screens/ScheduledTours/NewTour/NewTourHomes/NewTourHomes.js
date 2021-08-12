import React, { useEffect, useState, useRef, useContext } from 'react';
import { ScrollView, View, Platform } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import MapView, { Marker } from 'react-native-maps';
import Modal from 'react-native-modal';
import { BodyText, PrimaryButton, SecondaryButton, PanelScreen, MlsForm, FlexLoader } from '../../../../components';
import { calcRegion, splitScreenRegion } from '../../../../helpers';
import { MapPinIcon } from '../../../../assets/images';
import { notificationService, propertyService, tourService } from '../../../../services';

import TourContext from '../../TourContext';
import PropertyCard from './PropertyCard';
import useTimeString from '../../../../helpers/useTimeString';
import { buildPropertyOfInterestAdded } from '../../../../notifications/messageBuilder';
import config from '../../../../configs/config';

const fallbackRegion = {
  latitude: 25.0,
  longitude: -100.0,
  latitudeDelta: 70.0,
  longitudeDelta: 70.0,
};

const NewTourHomes = ({ navigation, screenProps: { user } }) => {
  const [initialRegionSet, setInitialRegionSet] = useState(false);
  const [region, setRegion] = useState(null);
  const {
    client,
    propertiesOfInterest,
    setPropertiesOfInterest,
    tour,
    tourStops,
    setTourStops,
    copiedTourId,
  } = useContext(TourContext);
  const { startTime = 0, endTime = 0, totalDuration = 0 } = tour;
  const [activeProperties, setActiveProperties] = useState([]);
  const [edited, setEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openMLSForm, setOpenMLSForm] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapView = useRef(null);
  const { tourDateStr, timeStr } = useTimeString(startTime, endTime, totalDuration);

  useEffect(() => {
    getProperties();
  }, []);

  const getProperties = async () => {
    try {
      let newPropertiesOfInterest = await propertyService.queries.listPropertiesOfInterest({
        clientId: tour.clientId,
      });
      const lastVisitedPois = await propertyService.queries.listLastvisitedPropertyOfInterest({
        clientId: tour.clientId,
      });

      for (let i = 0; i < newPropertiesOfInterest.length; i++) {
        for (let j = 0; j < lastVisitedPois.length; j++) {
          if (newPropertiesOfInterest[i].propertyListingId === lastVisitedPois[j].propertyListingId) {
            if (lastVisitedPois[j].listingAgentFirstName)
              newPropertiesOfInterest[i].listingAgent = {
                firstName: lastVisitedPois[j].listingAgentFirstName,
                lastName: lastVisitedPois[j].listingAgentLastName,
              };
            if (lastVisitedPois[j].startTime) newPropertiesOfInterest[i].lastTouredTime = lastVisitedPois[j].startTime;
          }
        }
      }
      newPropertiesOfInterest = newPropertiesOfInterest.sort((a, b) => (b.createdAt < a.createdAt ? -1 : 1));
      await setPropertiesOfInterest(newPropertiesOfInterest);
      if (copiedTourId) await getTourStopsByCopiedId(newPropertiesOfInterest);
      else await getTourStops();

      if (newPropertiesOfInterest && newPropertiesOfInterest.length > 0) {
        const regionCoordinates = newPropertiesOfInterest.map(({ propertyListing: { latitude, longitude } }) => ({
          latitude,
          longitude,
        }));

        const newRegion = calcRegion(regionCoordinates);
        const splitRegion = splitScreenRegion(newRegion);

        setRegion(splitRegion);
      } else {
        setRegion(fallbackRegion);
      }

      setInitialRegionSet(true);
    } catch (error) {
      console.warn('Error getting properties: ', error);
    }
  };

  const getTourStops = async () => {
    try {
      const newTourStops = await tourService.queries.listTourStops(tour.id);

      setTourStops(newTourStops);
      setActiveProperties(
        newTourStops.map(ts => ({
          propertyOfInterestId: ts.propertyOfInterestId,
          order: ts.order,
          isCustomListing: ts.propertyOfInterest.propertyListing.isCustomListing,
        }))
      );
    } catch (error) {
      console.warn('Error getting tourStops: ', error);
    }
  };

  const getTourStopsByCopiedId = async () => {
    try {
      const copiedTourStops = await tourService.queries.listTourStops(copiedTourId);
      const updatedTour = [];

      await Promise.all(copiedTourStops.map(async ts => addProperty(ts.propertyOfInterest.propertyListing)));
      const newPropertiesOfInterest = await propertyService.queries.listPropertiesOfInterest({
        clientId: tour.clientId,
      });

      await setPropertiesOfInterest(newPropertiesOfInterest);

      for (const poi of newPropertiesOfInterest) {
        if (
          poi.propertyListing.isCustomListing ||
          (poi.propertyListing.status && poi.propertyListing.status !== 'Closed')
        ) {
          copiedTourStops.map(ts => {
            if (poi.propertyListingId === ts.propertyOfInterest.propertyListingId) {
              const data = {
                propertyOfInterestId: poi.id,
                order: ts.order,
                isCustomListing: ts.propertyOfInterest.propertyListing.isCustomListing,
              };

              updatedTour.push(data);
            }

            return null;
          });
        }
      }
      setEdited(true);
      setActiveProperties(updatedTour);
    } catch (error) {
      console.warn('Error getting tourStops: ', error);
    }
  };

  const updateRegion = () => {
    if (!mapReady) {
      return;
    }

    const regionCoordinates = propertiesOfInterest.map(({ propertyListing: { latitude, longitude } }) => ({
      latitude,
      longitude,
    }));

    const newRegion = calcRegion(regionCoordinates);
    const splitRegion = splitScreenRegion(newRegion);

    if (mapView.current) mapView.current.animateToRegion(splitRegion, 300);
  };

  const addProperty = async propertyListing => {
    const { id, isCustomListing, listingId: mlsListingId } = propertyListing;

    try {
      let newPropertyOfInterest;

      if (isCustomListing) {
        const createPropertyResponse = await propertyService.mutations.createPropertyOfInterest({
          propertyListingId: id,
          clientId: client.id,
        });

        newPropertyOfInterest = await propertyService.queries.getPropertyOfInterest(createPropertyResponse.id);
      } else {
        const mlsListings = await propertyService.queries.getListingByListingId(mlsListingId);

        const mlsListing = mlsListings && mlsListings.length > 0 ? mlsListings[0] : null;

        if (!mlsListing) {
          return;
        }

        if (mlsListing.status && mlsListing.status === 'Closed') {
          return;
        }

        const existingPropertyOfInterest = await propertyService.queries.getPropertyOfInterestByListingKey({
          clientId: client.id,
          listingKey: mlsListing.id,
        });

        if (existingPropertyOfInterest) {
          return;
        }

        const createPropertyResponse = await propertyService.mutations.createPropertyRecords({
          listingId: mlsListingId,
          clientId: client.id,
          fallbackPhoneNumber:
            config.env !== 'production' && config.listingAgentDefaultPhone ? config.listingAgentDefaultPhone : null,
        });

        newPropertyOfInterest = await propertyService.queries.getPropertyOfInterest(
          createPropertyResponse.propertyOfInterestId
        );
      }

      await notifyBuyerOfNewProperty(newPropertyOfInterest);
    } catch (error) {
      console.log('Error adding property: ', error);
    }
  };

  const notifyBuyerOfNewProperty = async propertyOfInterest => {
    try {
      const {
        propertyListing: { address, city, state, zip },
      } = propertyOfInterest;

      const formattedAddress = `${address.includes(',') ? address.split(',')[0] : address} ${city}, ${state} ${zip}`;
      const { push } = buildPropertyOfInterestAdded({
        baName: `${user.firstName} ${user.lastName}`,
        brokerage: user.brokerage,
        address: formattedAddress,
      });

      await notificationService.mutations.createNotification({
        userId: propertyOfInterest.clientId,
        pushMessage: push,
      });
    } catch (error) {
      console.warn('Error notifying buyer of new property of interest: ', error);
    }
  };

  const nextPage = async () => {
    setLoading(true);

    try {
      if (edited) {
        const sorted = activeProperties
          .sort((a, b) => a.order < b.order)
          .map(property => {
            delete property.order;

            return property;
          });

        await tourService.mutations.batchUpdateTourStops(tour.id, sorted);
      }

      setLoading(false);

      navigation.navigate('NewTourHomeFirst');

      return;
    } catch (error) {
      console.warn('Error perfoming batch update of tour stops: ', error);
    }

    setLoading(false);
  };

  const clientName = client ? `${client.firstName} ${client.lastName}` : 'N/A';

  const toggleProperty = async propertyOfInterest => {
    setEdited(true);
    if (activeProperties.find(prop => prop.propertyOfInterestId === propertyOfInterest.id)) {
      setActiveProperties([...activeProperties].filter(prop => prop.propertyOfInterestId !== propertyOfInterest.id));
      const {
        id,
        propertyListing: { status },
      } = propertyOfInterest;

      if (status === 'Closed') {
        const tourStopToRemove = tourStops.filter(props => props.propertyOfInterestId === id);

        if (tourStopToRemove.length > 0) {
          try {
            await tourService.mutations.deleteTourStop(tourStopToRemove[0].id);
            const updatedTourStops = tourStops.filter(props => props.propertyOfInterestId !== id);

            setTourStops(updatedTourStops);
          } catch (error) {
            console.log('Error removing property from tour', error);
          }
        }
      }
    } else {
      const {
        propertyListing: { status },
      } = propertyOfInterest;

      if (status !== 'Closed') {
        setActiveProperties([
          ...activeProperties,
          {
            propertyOfInterestId: propertyOfInterest.id,
            order: activeProperties.length > 0 ? activeProperties.length : 1,
            isCustomListing: propertyOfInterest.propertyListing
              ? propertyOfInterest.propertyListing.isCustomListing
              : false,
          },
        ]);
      }
    }
  };

  const markers = propertiesOfInterest.map(propertyOfInterest => {
    const active = !!activeProperties.find(prop => prop.propertyOfInterestId === propertyOfInterest.id);

    const primaryColor = active ? color.blue500 : color.white;
    const secondaryColor = active ? color.blue400 : color.gray500;
    const {
      propertyListing: { latitude, longitude },
    } = propertyOfInterest;

    return (
      <Marker
        key={`marker-${propertyOfInterest.id}-${active}`}
        coordinate={{
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }}
        tracksViewChanges={Platform.OS !== 'android'}
        flat
        pinColor={primaryColor}
        onPress={() => toggleProperty(propertyOfInterest)}
      >
        <MapPinIcon width={24} height={27} fill={secondaryColor} stroke={primaryColor} style={[tw.mB4]} />
      </Marker>
    );
  });

  const propertyCards = propertiesOfInterest.map((propertyOfInterest, idx) => {
    const active = !!activeProperties.find(prop => prop.propertyOfInterestId === propertyOfInterest.id);

    return (
      <PropertyCard
        key={`location-${idx}`}
        active={active}
        propertyOfInterest={propertyOfInterest}
        onPress={() => toggleProperty(propertyOfInterest)}
      />
    );
  });

  const onMlsPropertySelect = async newProperty => {
    console.log('ON PROPERTY SELECTED: ', newProperty);
    try {
      if (newProperty) {
        if (!propertiesOfInterest.find(property => property.id === newProperty.id)) {
          const updatedPropertyList = [...propertiesOfInterest, newProperty];

          setPropertiesOfInterest(updatedPropertyList);

          const regionCoordinates = updatedPropertyList.map(({ propertyListing: { latitude, longitude } }) => ({
            latitude,
            longitude,
          }));
          const newRegion = calcRegion(regionCoordinates);
          const splitRegion = splitScreenRegion(newRegion);

          setRegion(splitRegion);
        }

        const propertyAlreadyActive = !!activeProperties.find(prop => prop.propertyOfInterestId === newProperty.id);

        if (!propertyAlreadyActive) {
          setEdited(true);
          setActiveProperties([
            ...activeProperties,
            {
              propertyOfInterestId: newProperty.id,
              order: activeProperties.length > 0 ? activeProperties.length : 1,
              isCustomListing: newProperty.propertyListing ? newProperty.propertyListing.isCustomListing : false,
            },
          ]);
        }
      }

      setOpenMLSForm(false);
    } catch (error) {
      console.log(`Error making${newProperty}property Active`, error);
    }
  };

  const onCustomPropertyAdded = newProperty => {
    onMlsPropertySelect(newProperty);
    navigation.pop();
  };

  if (!tourStops || !tour || !tour.id) {
    return <FlexLoader />;
  }

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
              <BodyText italic center style={[tw.mT1]}>
                Select Properties for Tour
              </BodyText>
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
                    {markers && markers.length > 0 ? markers : null}
                  </MapView>
                }
                onNext={console.log}
                updateRegion={updateRegion}
              >
                {propertiesOfInterest.length > 0 ? (
                  <ScrollView style={[tw.wFull, tw.flex1, tw.bgPrimary]}>{propertyCards}</ScrollView>
                ) : (
                  <View style={[tw.flexCol, tw.flex1, tw.wFull, tw.justifyCenter, tw.itemsCenter]}>
                    <BodyText>No properties added yet</BodyText>
                  </View>
                )}
              </PanelScreen>
            ) : (
              <FlexLoader />
            )}
          </View>
        </View>
        <View style={[tw.w5_6, tw.selfCenter, tw.mY2]}>
          <SecondaryButton
            style={[tw.border2, tw.borderBlue500, tw.mB2, tw.mT2]}
            textStyle={[tw.textBlue500]}
            title="ADD A PROPERTY"
            onPress={() => setOpenMLSForm(true)}
          />
          {client && openMLSForm && (
            <Modal isVisible={openMLSForm} onBackdropPress={() => setOpenMLSForm(false)}>
              <MlsForm
                title="Add By MLS ID"
                client={client}
                successCallback={onMlsPropertySelect}
                onAddCustom={onCustomPropertyAdded}
                closeModal={() => setOpenMLSForm(false)}
                user={user}
              />
            </Modal>
          )}
          <PrimaryButton
            title="Next"
            onPress={nextPage}
            loading={loading}
            disabled={!activeProperties || activeProperties.length === 0}
          />
        </View>
      </View>
    </View>
  );
};

export default NewTourHomes;
