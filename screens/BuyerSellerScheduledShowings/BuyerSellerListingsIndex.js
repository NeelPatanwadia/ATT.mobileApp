import React, { useContext, useEffect, useState, useCallback } from 'react';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { View, FlatList, RefreshControl, AppState } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import BuyerSellerTabContext from '../../navigation/BuyerSellerTabContext';
import { propertyService } from '../../services';
import { SearchBar, BodyText } from '../../components';
import BuyerSellerShowingContext from './BuyerSellerShowingContext';
import BuyerSellerListingIndexCard from './BuyerSellerListingIndexCard';

const BuyerSellerListingsIndex = ({ navigation, isFocused, screenProps: { user } }) => {
  const { setNavigationParams } = useContext(BuyerSellerTabContext);
  const { setSelectedPropertyListing, propertyListings, setPropertyListings } = useContext(BuyerSellerShowingContext);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [listingSearch, setListingSearch] = useState('');

  useEffect(() => {
    if (isFocused) {
      getListings();
    }
  }, [isFocused]);

  useEffect(() => {
    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, []);

  useEffect(() => {
    if (propertyListings) {
      filterPropertyListings(propertyListings);
    }
  }, [listingSearch]);

  const handleAppStateChange = newState => {
    if (newState === 'active') {
      getListings();
    }
  };

  const getListings = async () => {
    try {
      const clientProps = await propertyService.queries.listPropertyListings({ sellerId: user.id });

      setPropertyListings(clientProps);

      filterPropertyListings(clientProps);
    } catch (error) {
      console.warn('Error fetching client listings: ', error);
    }
  };

  const filterPropertyListings = props => {
    const filteredProps = props.filter(({ address, city, state }) =>
      [address, city, state].join('').match(new RegExp(listingSearch, 'i'))
    );

    setSearching(false);
    setFilteredProperties(filteredProps);
  };

  const onShowingPress = selectedListing => {
    setSelectedPropertyListing(selectedListing);
    navigation.navigate('BuyerSellerScheduledShowings');
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getListings().then(() => setRefreshing(false));
  }, [refreshing]);

  const executeSearch = text => {
    setSearching(true);
    setListingSearch(text);
  };

  return (
    <>
      <NavigationEvents
        onWillFocus={() => {
          setNavigationParams({
            headerTitle: 'Listings',
            showSettingsBtn: true,
          });
        }}
      />
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
        <SearchBar searchTerm={listingSearch} searching={searching} executeSearch={executeSearch} />
        <FlatList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          data={filteredProperties}
          renderItem={({ item: propertyListing }) => (
            <BuyerSellerListingIndexCard
              key={`listing-${propertyListing.id}`}
              propertyListing={propertyListing}
              onPress={onShowingPress}
            />
          )}
          keyExtractor={(tourCard, index) => `tourCard-${index}`}
          ListEmptyComponent={
            <View style={[tw.flexCol, tw.mT16, tw.itemsCenter, tw.justifyCenter]}>
              <BodyText>No Listings Found</BodyText>
            </View>
          }
        />
      </View>
    </>
  );
};

export default withNavigationFocus(BuyerSellerListingsIndex);
