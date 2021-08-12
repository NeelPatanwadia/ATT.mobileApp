import React, { useRef, useEffect, useState } from 'react';
import { SafeAreaView, View, FlatList, Platform, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { tw, color } from 'react-native-tailwindcss';
import MapView, { Marker } from 'react-native-maps';
import { MapPinIcon } from '../../assets/images';
import { BodyText, FlexLoader, PrimaryButton, SecondaryButton, SearchBar } from '../../components';
import { calcRegion } from '../../helpers';
import { notificationService, propertyService } from '../../services';
import { buildPropertyOfInterestAdded } from '../../notifications/messageBuilder';

const initialRegion = {
  latitude: 40,
  longitude: -95,
  latitudeDelta: 44.0,
  longitudeDelta: 80.0,
};

const AgentCustomListings = ({ navigation, screenProps: { user } }) => {
  const mapView = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialRegionSet, setInitialRegionSet] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [region, setRegion] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [customListings, setCustomListings] = useState(false);
  const [filteredListings, setFilteredListings] = useState([]);
  const [client] = useState(navigation.getParam('client', null));

  useEffect(() => {
    loadCustomListings();
  }, []);

  useEffect(() => {
    if (customListings) {
      filterListings(customListings);
    } else {
      setSearching(false);
    }
  }, [searchTerm]);

  const executeSearch = text => {
    if (text !== searchTerm) {
      setSearching(true);
      setSearchTerm(text);
    }
  };

  const loadCustomListings = async () => {
    try {
      const listings = await propertyService.queries.listCustomPropertyListings(user.id);

      console.log('LISTINGS: ', listings);

      setCustomListings(listings);
      filterListings(listings);
    } catch (error) {
      console.warn('Error getting custom listings: ', error);
    }
  };

  const toggleSelectedListing = listing => {
    if (selectedListing && listing.id === selectedListing.id) {
      setSelectedListing(null);
    } else {
      setSelectedListing(listing);
    }
  };

  const filterListings = listings => {
    const filteredListingList = listings.filter(({ address, city, state }) =>
      [address, city, state].join('').match(new RegExp(searchTerm, 'i'))
    );

    setFilteredListings(filteredListingList);

    console.log('UPDATING REGION...');

    if (filteredListingList.length > 0) {
      const regionCoordinates = filteredListingList.map(({ latitude, longitude }) => ({ latitude, longitude }));

      const newRegion = calcRegion(regionCoordinates);

      if (mapView && mapView.current && (Platform.OS === 'ios' || mapReady)) {
        mapView.current.animateToRegion(newRegion, 500);
      } else {
        setRegion(newRegion);
      }
    } else if (!initialRegionSet) {
      setRegion(initialRegion);
    }

    setInitialRegionSet(true);
    setSearching(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);

    loadCustomListings();
  };

  const promptAddToClient = () => {
    if (!selectedListing) {
      return;
    }

    console.log('SELECTED LISTING: ', selectedListing);

    const { address, city, state } = selectedListing;
    const { firstName, lastName } = client;

    Alert.alert(
      'Add to Homes of Interest',
      `Are you sure you want to add ${
        address.includes(',') ? address.split(',')[0] : address
      } ${city}, ${state} to the homes of interest list for ${firstName} ${lastName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Add Listing',
          onPress: () => addPropertyOfInterest(),
        },
      ]
    );
  };

  const addPropertyOfInterest = async () => {
    try {
      setAdding(true);

      const existingPOI = await propertyService.queries.getPropertyOfInterestByPropertyListingId({
        clientId: client.id,
        propertyListingId: selectedListing.id,
      });

      const { firstName, lastName } = client;
      const { address } = selectedListing;

      if (existingPOI) {
        Alert.alert(
          'Home Not Added',
          `${firstName} ${lastName} already has ${
            address.includes(',') ? address.split(',')[0] : address
          } in their Homes of Interest list.`
        );
      } else {
        const createdPropertyOfInterest = await propertyService.mutations.createPropertyOfInterest({
          propertyListingId: selectedListing.id,
          clientId: client.id,
        });

        const propertyOfInterest = await propertyService.queries.getPropertyOfInterest(createdPropertyOfInterest.id);

        await notifyBuyerOfNewProperty(propertyOfInterest);

        const onAdd = navigation.getParam('onAdd', null);

        if (onAdd) {
          onAdd(propertyOfInterest);
        }
      }
    } catch (error) {
      console.warn('Error adding custom property of interest: ', error);
    }

    setAdding(false);
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

  const markers = filteredListings
    ? filteredListings.map(listing => {
        const active = selectedListing && listing.id === selectedListing.id;

        const primaryColor = active ? color.blue500 : color.white;
        const secondaryColor = active ? color.blue400 : color.gray500;
        const { latitude, longitude } = listing;

        return (
          <Marker
            key={`customListing-${listing.id}-${active}`}
            coordinate={{ latitude: parseFloat(latitude), longitude: parseFloat(longitude) }}
            tracksViewChanges={Platform.OS !== 'android'}
            flat
            pinColor={primaryColor}
            onPress={() => toggleSelectedListing(listing)}
          >
            <MapPinIcon width={24} height={27} fill={secondaryColor} stroke={primaryColor} style={[tw.mB4]} />
          </Marker>
        );
      })
    : [];

  return (
    <SafeAreaView style={[tw.flexCol, tw.flex1, tw.bgPrimary]}>
      <SearchBar searchTerm={searchTerm} executeSearch={executeSearch} searching={searching} />

      <View style={[tw.flex1, tw.borderY, tw.borderGray300]}>
        {region ? (
          <MapView
            style={[tw.wFull, tw.z0, tw.hFull]}
            onRegionChangeComplete={setRegion}
            region={region}
            ref={mapView}
            onMapReady={() => setMapReady(true)}
          >
            {markers.length > 0 ? markers : null}
          </MapView>
        ) : (
          <FlexLoader />
        )}
      </View>

      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={filteredListings}
        renderItem={({ item: listing }) => (
          <ListingCard
            listing={listing}
            onPress={() => toggleSelectedListing(listing)}
            selected={selectedListing && selectedListing.id === listing.id}
          />
        )}
        keyExtractor={listing => `customListing-${listing.id}`}
        style={[tw.flex1, tw.bgPrimary, tw.borderGray300, tw.shadow]}
        ListEmptyComponent={
          <View style={[tw.flexCol, tw.mT16, tw.itemsCenter, tw.justifyCenter]}>
            <BodyText>No Custom Listings Found</BodyText>
          </View>
        }
      />

      <View style={[tw.wFull, tw.selfCenter, tw.pT4, tw.pB2, tw.pX8, tw.borderT, tw.borderGray300]}>
        <PrimaryButton
          title="ADD TO HOMES OF INTEREST"
          loading={adding}
          loadingTitle="ADDING HOME OF INTEREST"
          disabled={selectedListing === null}
          onPress={promptAddToClient}
        />

        <SecondaryButton
          title="CREATE CUSTOM LISTING"
          onPress={() => navigation.navigate('CustomListingForm', { onAdd: loadCustomListings })}
          style={[tw.rounded, tw.borderBlue500, tw.border, tw.mT2]}
        />
      </View>
    </SafeAreaView>
  );
};

export default AgentCustomListings;

const ListingCard = ({ onPress, listing, selected }) => {
  const { address, city, state } = listing;

  const cityState = `${city}, ${state}`;

  return (
    <TouchableOpacity
      onPress={() => onPress(listing)}
      activeOpacity={0.9}
      style={[tw.shadow, tw.bgGray100, tw.pY4, tw.mY1, tw.pL4, tw.pR4, tw.flexRow, tw.justifyBetween]}
    >
      <View style={[tw.flexCol, tw.justifyCenter, tw.flex1]}>
        <View style={[tw.flexCol, tw.justifyCenter, tw.mT1]}>
          <BodyText semibold md style={[tw.flexWrap]}>
            {address.includes(',') ? address.split(',')[0] : address}
          </BodyText>
          <BodyText semibold md style={[tw.flexWrap]}>
            {cityState}
          </BodyText>
        </View>
      </View>

      <View style={[tw.justifyCenter, tw.p2]}>
        {selected && <MapPinIcon fill={color.blue500} stroke={color.blue500} height={25} width={25} />}
      </View>
    </TouchableOpacity>
  );
};
