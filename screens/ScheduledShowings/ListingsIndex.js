import React, { useContext, useEffect, useState, useCallback } from 'react';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { View, RefreshControl, AppState, FlatList } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import AgentTabContext from '../../navigation/AgentTabContext';
import { propertyService } from '../../services';
import ShowingContext from './ShowingContext';
import ListingIndexCard from './ListingIndexCard';
import { SearchBar, BodyText } from '../../components';

const ListingsIndex = ({ navigation, isFocused, screenProps: { user, showingRequestCounts, newMessages } }) => {
  const { setNavigationParams } = useContext(AgentTabContext);
  const { propertyListings, setPropertyListings, setSelectedPropertyListing, setPropertySeller } = useContext(
    ShowingContext
  );
  const [filteredListings, setFilteredListings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [listingSearch, setListingSearch] = useState('');
  const [searching, setSearching] = useState(false);

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
      filterListings(propertyListings);
    }
  }, [listingSearch]);

  const handleAppStateChange = newState => {
    if (newState === 'active') {
      getListings();
    }
  };

  const getListings = async () => {
    try {
      const listings = await propertyService.queries.listPropertyListings({ listingAgentId: user.id });

      setPropertyListings(listings);
      filterListings(listings);
    } catch (error) {
      console.warn('Error getting property listings: ', error);
    }
  };

  const onShowingPress = selectedListing => {
    setSelectedPropertyListing(selectedListing);
    if (selectedListing.seller) {
      setPropertySeller(selectedListing.seller);
    }
    navigation.navigate({ routeName: 'Listings', key: `listings-${selectedListing.id}` });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getListings().then(() => setRefreshing(false));
  }, [refreshing]);

  const filterListings = listings => {
    const filteredListing = listings.filter(({ address, city, state }) =>
      [address, city, state].join('').match(new RegExp(listingSearch, 'i'))
    );

    setFilteredListings(filteredListing);
    setSearching(false);
  };

  const executeSearch = text => {
    setSearching(true);
    setListingSearch(text);
  };

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Listings',
            showSettingsBtn: true,
          })
        }
      />
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
        <SearchBar searchTerm={listingSearch} executeSearch={executeSearch} searching={searching} />

        <FlatList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          data={filteredListings}
          renderItem={({ item: listingCard }) => (
            <ListingIndexCard
              key={`showingCard-${listingCard.id}`}
              listing={listingCard}
              showingRequestCounts={showingRequestCounts}
              newMessages={newMessages}
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

export default withNavigationFocus(ListingsIndex);
