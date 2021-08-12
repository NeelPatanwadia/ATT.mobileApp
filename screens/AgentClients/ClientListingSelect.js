import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, View, FlatList, TouchableOpacity } from 'react-native';
import { tw, color, colors } from 'react-native-tailwindcss';
import { BodyText, SearchBar } from '../../components';
import { ChevronRightIcon } from '../../assets/images';
import { propertyService } from '../../services';

const PropertyListingCard = ({ onPress, loading, style = [], propertyListing }) => {
  const { address, city, state, seller, listingId } = propertyListing;

  return (
    <TouchableOpacity
      onPress={() => onPress(propertyListing)}
      disabled={loading}
      activeOpacity={0.9}
      style={[tw.shadow, tw.bgGray100, tw.pY4, tw.mY1, tw.pL2, tw.pR4, tw.flexRow, tw.justifyBetween, ...style]}
    >
      <View style={[tw.flexCol, tw.justifyCenter, tw.flex1]}>
        <View style={[tw.flexCol, tw.justifyCenter, tw.mT1]}>
          <BodyText semibold md style={[tw.flexWrap, tw.mB2]}>
            {`MLS #${listingId}`}
          </BodyText>
          <BodyText md style={[tw.flexWrap]}>
            {address.includes(',') ? address.split(',')[0] : address}
          </BodyText>
          <BodyText md style={[tw.flexWrap]}>
            {`${city}, ${state}`}
          </BodyText>
        </View>

        <View style={[tw.flexRow, tw.justifyStart, tw.itemsCenter, tw.mT2]}>
          <BodyText semibold md>
            Client:
          </BodyText>
          <BodyText style={[tw.mL2]}>{seller ? `${seller.firstName} ${seller.lastName}` : 'N/A'}</BodyText>
        </View>
      </View>

      <View style={[tw.justifyCenter, tw.p2]}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.gray500} />
        ) : (
          <ChevronRightIcon width={18} height={18} fill={color.blue400} stroke={color.white} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const ClientListingSelect = ({ client, user, refreshClientListings }) => {
  const [agentListings, setAgentListings] = useState([]);
  const [filteredAgentListings, setFilteredAgentListings] = useState([]);
  const [savingObject, setSavingObject] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    getAgentListings();
  }, []);

  useEffect(() => {
    if (agentListings) {
      filterAgentListings(agentListings);
    }
  }, [searchTerm]);

  const onSelect = selectedListing => {
    let message = `Are you sure you want to set ${client.firstName} ${client.lastName} as the seller of ${
      selectedListing.address.includes(',') ? selectedListing.address.split(',')[0] : selectedListing.address
    }, ${selectedListing.city}, ${selectedListing.state}?`;

    if (selectedListing.seller) {
      message += `\n\n${selectedListing.seller.firstName} ${selectedListing.seller.lastName} is already linked as the seller.`;
    }

    Alert.alert('Set Property Seller', message, [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      { text: 'Confirm', onPress: () => confirmSelection(selectedListing) },
    ]);
  };

  const confirmSelection = async selectedListing => {
    try {
      setSavingObject(prevState => ({ ...prevState, [selectedListing.id]: true }));

      await propertyService.mutations.updatePropertyListing({ id: selectedListing.id, sellerId: client.id });

      const updatedAgentListings = agentListings.map(listing => {
        if (listing.id === selectedListing.id) {
          return { ...listing, sellerId: client.id, seller: client };
        }

        return listing;
      });

      setAgentListings(updatedAgentListings);
      filterAgentListings(updatedAgentListings);

      await refreshClientListings();
    } catch (error) {
      console.warn('Error setting seller on listing: ', error);
    }

    setSavingObject(prevState => ({ ...prevState, [selectedListing.id]: false }));
  };

  const filterAgentListings = listings => {
    const filteredList = listings.filter(({ address, city, state, listingId }) =>
      [address, city, state, `${listingId}`].join('').match(new RegExp(searchTerm, 'i'))
    );

    setSearching(false);
    setFilteredAgentListings(filteredList);
  };

  const executeSearch = async searchText => {
    setSearching(true);
    setSearchTerm(searchText);
  };

  const getAgentListings = async () => {
    try {
      const propertyListings = await propertyService.queries.listPropertyListings({ listingAgentId: user.id });

      setAgentListings(propertyListings);
      filterAgentListings(propertyListings);
    } catch (error) {
      console.warn('Error getting agent listings for selection: ', error);
    }
  };

  return (
    <View style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
      <SearchBar
        searchTerm={searchTerm}
        executeSearch={executeSearch}
        searching={searching}
        margins={[tw.mT2, tw.mX4]}
      />
      <FlatList
        data={filteredAgentListings}
        renderItem={({ item: agentListing }) => (
          <PropertyListingCard
            propertyListing={agentListing}
            onPress={onSelect}
            key={`listCardOption-${agentListing.id}`}
            loading={!!savingObject[agentListing.id]}
          />
        )}
        keyExtractor={clientCard => `clientCard-${clientCard.id}`}
        ListEmptyComponent={
          <View style={[tw.flexCol, tw.mT16, tw.itemsCenter, tw.justifyCenter]}>
            <BodyText>No Listings Found</BodyText>
          </View>
        }
      />
    </View>
  );
};

export default ClientListingSelect;
