import React, { useContext, useEffect, useState } from 'react';
import { FlatList, Image, Keyboard, TouchableOpacity, View } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import Geolocation from '@react-native-community/geolocation';
import { API } from 'aws-amplify';
import { BodyText, FlexLoader, SearchBar } from '../../components';
import AgentTabContext from '../../navigation/AgentTabContext';
import { propertyService, userService } from '../../services';
import SearchPropertyCard from '../../components/SearchPropertyCard';
import { FilterImage, MapPinIcon } from '../../assets/images';
import FilterModal from '../../components/FilterModal';
import { listListings } from '../../src/graphql/queries';
import BuyerSellerTabContext from '../../navigation/BuyerSellerTabContext';
import SearchListingContex from './SearchListingContex';

let searchingNow = 0;

const SearchIndex = ({ navigation, isFocused, screenProps: { user } }) => {
  const { setNavigationParams } = useContext(user.isAgent ? AgentTabContext : BuyerSellerTabContext);
  const { searchListing, setSearchListing } = useContext(SearchListingContex);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientsList, setClientsList] = useState([]);
  const [searchList, setSearchList] = useState([]);
  const [tempSearchList, setTempSearchList] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('');
  const [bottomLoading, setBottomLoading] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [searchingCompleted, setSearchingCompleted] = useState(false);
  const [filterBy, setFilterBy] = useState({});
  const [propertiesOfInterest, setPropertiesOfInterest] = useState([]);
  const [dropdownClients, setDropdownClients] = useState([]);

  useEffect(() => {
    if (isFocused) {
      setClientsList([]);
      setDropdownClients([]);
      getClients();
    }
  }, [isFocused]);

  useEffect(() => {
    if (searchText.length > 0) {
      setIsFilterApplied(false);
      setTempSearchList([]);
      setSearchListing([]);
      setSearchList([]);
      searchingNow += 1;
      getSearchList();
    }
  }, [searchText]);

  useEffect(() => {
    if (searchList.length > 0 && !searchingCompleted) {
      setBottomLoading(true);
    }
  }, [searchList.length]);

  useEffect(() => {
    if (isFilterApplied) {
      getFilteredOutput();
    } else {
      setSearchListing(tempSearchList);
      setSearchList(tempSearchList);
    }
    if (searchList.length > 0 && !searchingCompleted) {
      setBottomLoading(true);
    }
  }, [tempSearchList.length]);

  useEffect(() => {
    if (currentLocation.length > 0) {
      setIsFilterApplied(false);
      setTempSearchList([]);
      setSearchListing([]);
      setSearchList([]);
      searchingNow += 1;
      getSearchList();
    }
  }, [currentLocation]);

  useEffect(() => {
    if (isFilterApplied) {
      onApplyFilterPress();
    }
  }, [filterBy]);

  const getClientProperties = async () => {
    try {
      const clientProps = await propertyService.queries.listPropertiesOfInterest({ clientId: user.id });

      setPropertiesOfInterest(clientProps);

      return clientProps;
    } catch (error) {
      console.warn('Error getting client properties: ', error);

      return [];
    }
  };

  const getFilteredOutput = () => {
    if (JSON.stringify(filterBy).length > 2) {
      const filteredArray = getFilteredArray(tempSearchList);

      setSearchListing(filteredArray);
      setSearchList(filteredArray);
    }
  };

  const getClients = async () => {
    try {
      const clientList = await userService.queries.listClients(user.id);

      setClientsList(clientList);
      for (const client of clientList) {
        setDropdownClients(prevValue => [...prevValue, `${client.firstName} ${client.lastName}`]);
      }
    } catch (error) {
      console.log('Error fetching clients: ', error);
    }
    setLoading(false);
  };

  const executeSearch = searchTerm => {
    setCurrentLocation('');
    setIsSearchFocused(false);
    setSearchText(searchTerm);
  };

  const onCurrentLocationPress = () => {
    Geolocation.getCurrentPosition(
      position => {
        fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=AIzaSyCn8iRJpewWCvg12KHjOinW05mPDbwF_ik`
        )
          .then(response => response.json())
          .then(response => {
            if (response.results[0]) {
              response.results[0].address_components.map(data => {
                if (data.types[0] === 'postal_code') {
                  setCurrentLocation(data.long_name);
                  setSearchText('');
                }

                return null;
              });
            }
          })
          .catch(error => console.log(error));
      },
      error => console.log('error', error)
    );
    Keyboard.dismiss();
    setIsSearchFocused(false);
  };

  const onApplyFilterPress = () => {
    setShowFilter(false);
    setLoading(true);
    const filteredArray = getFilteredArray(tempSearchList);

    setSearchListing(filteredArray);
    setSearchList(filteredArray);
    setLoading(false);
  };

  const getFilteredArray = array => {
    let tempArr = array;

    if (filterBy) {
      if (filterBy.priceRange) {
        const { high, low } = filterBy.priceRange;

        if (!high) {
          tempArr = [...tempArr].filter(listing => listing.listing_price >= parseInt(low.replace(/[^0-9]/g, '')));
        } else if (!low) {
          tempArr = [...tempArr].filter(listing => listing.listing_price <= parseInt(high.replace(/[^0-9]/g, '')));
        } else if (low && high) {
          tempArr = [...tempArr].filter(
            listing =>
              listing.listing_price >= parseInt(low.replace(/[^0-9]/g, '')) &&
              listing.listing_price <= parseInt(high.replace(/[^0-9]/g, ''))
          );
        }
      }

      if (filterBy.squareFeet) {
        const { high, low } = filterBy.squareFeet;

        if (!high) {
          tempArr = [...tempArr].filter(listing => listing.square_feet >= parseInt(low.replace(/[^0-9]/g, '')));
        } else if (!low) {
          tempArr = [...tempArr].filter(listing => listing.square_feet <= parseInt(high.replace(/[^0-9]/g, '')));
        } else if (low && high) {
          tempArr = [...tempArr].filter(
            listing =>
              listing.square_feet >= parseInt(low.replace(/[^0-9]/g, '')) &&
              listing.square_feet <= parseInt(high.replace(/[^0-9]/g, ''))
          );
        }
      }

      if (filterBy.bedrooms) {
        if (filterBy.bedrooms === 'Any') {
          tempArr = [...tempArr].filter(listing => listing.bedrooms >= 0);
        } else {
          tempArr = [...tempArr].filter(listing => listing.bedrooms >= parseInt(filterBy.bedrooms));
        }
      }

      if (filterBy.bathrooms) {
        if (filterBy.bathrooms === 'Any') {
          tempArr = [...tempArr].filter(listing => listing.bathrooms >= 0);
        } else {
          tempArr = [...tempArr].filter(listing => listing.bathrooms >= parseInt(filterBy.bathrooms));
        }
      }

      if (filterBy.homeTypes && filterBy.homeTypes.length > 0) {
        tempArr = [...tempArr].filter(listing => filterBy.homeTypes.includes(listing.home_type));
      }

      if (filterBy.sort) {
        if (filterBy.sort === 'price_ascending') {
          const field = 'listing_price';

          tempArr.sort((a, b) => a[field] - b[field]);
        }
        if (filterBy.sort === 'price_descending') {
          const field = 'listing_price';

          tempArr.sort((a, b) => b[field] - a[field]);
        }
        if (filterBy.sort === 'squarefeet_ascending') {
          const field = 'square_feet';

          tempArr.sort((a, b) => a[field] - b[field]);
        }
        if (filterBy.sort === 'squarefeet_descending') {
          const field = 'square_feet';

          tempArr.sort((a, b) => b[field] - a[field]);
        }
      }
    }

    return tempArr;
  };

  const getSearchList = async () => {
    setLoading(true);
    setSearchingCompleted(false);

    try {
      let nextToken = null;
      const searchResult = [];
      const prevSearch = searchingNow;

      do {
        if (prevSearch !== searchingNow) {
          break;
        }
        const queryOptions = {
          filter: {
            and: [
              { or: [{ status: { eq: 'Active' } }, { status: { eq: 'Pending' } }, { status: { eq: 'Withdrawn' } }] },
            ],
            or: [
              { full_address: { contains: currentLocation || searchText } },
              { zip: { eq: currentLocation || searchText } },
              { listing_id: { eq: currentLocation || searchText } },
            ],
          },
          limit: 10000,
        };

        if (nextToken !== null) {
          queryOptions.nextToken = nextToken;
        }
        // console.log('  queryOptions', queryOptions);
        const listingsBatch = await API.graphql({
          query: listListings,
          variables: queryOptions,
          authMode: 'AMAZON_COGNITO_USER_POOLS',
        })
          .then(response => response.data.listListings)
          .catch(err => {
            console.log('err', err);
            if (!user.isAgent) {
              return err.data.listListings;
            }

            return null;
          });
        const propOfInterest = await getClientProperties();

        if (listingsBatch.items.length > 0) {
          if (searchList.length === 0) {
            setLoading(false);
            setBottomLoading(true);
          }
          searchResult.push(...listingsBatch.items);
          for (let i = 0; i < searchResult.length; i++) {
            const { listing_id: listingBatchListingId } = searchResult[i];
            const property = propOfInterest.filter(value => value.propertyListing.listingId === listingBatchListingId);

            if (property.length === 0) {
              searchResult[i].isLiked = 'unliked';
            } else {
              const [{ status: propertyStatus }] = property;

              if (propertyStatus) {
                searchResult[i].isLiked = propertyStatus;
              } else {
                searchResult[i].isLiked = 'unliked';
              }
            }
          }
          setBottomLoading(false);
          setTempSearchList(searchResult);
        }
        nextToken = listingsBatch.nextToken;
      } while (nextToken !== null);
      if (prevSearch === searchingNow) {
        setBottomLoading(false);
        setLoading(false);
        setSearchingCompleted(true);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
    setLoading(false);
  };

  const listEmptyComponent = () => {
    if (isFilterApplied || searchingCompleted) {
      if (searchList.length === 0) {
        return (
          <View style={[tw.hFull, tw.wFull, tw.itemsCenter, tw.justifyCenter]}>
            <BodyText lg style={[tw.textGray600]}>
              No Data Found
            </BodyText>
          </View>
        );
      }
    }

    return <View style={[tw.hFull, tw.wFull]} />;
  };

  const renderItem = ({ item, index }) => {
    const { isLiked } = item;

    const property = propertiesOfInterest.filter(value => value.propertyListing.listingId === item.listing_id);

    return (
      <SearchPropertyCard
        clientsList={clientsList}
        item={item}
        index={index}
        key={index}
        isLiked={isLiked}
        user={user}
        property={property}
        dropdownClientList={dropdownClients}
        onPress={() => navigation.navigate('ListingDetails', { id: item.id, isLiked, property })}
      />
    );
  };

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: `Search MLS`,
            showSettingsBtn: true,
          })
        }
      />
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
        <View style={[tw.flexRow]}>
          <View style={[tw.flex1, tw.flexCol]}>
            <SearchBar
              searchTerm={searchText}
              searchText="Search by address,zip or MLS"
              executeSearch={executeSearch}
              searchFoused={() => setIsSearchFocused(true)}
              margins={[tw.mT6, tw.pX6, tw.mB2]}
            />
            {isSearchFocused && (
              <TouchableOpacity
                onPress={() => onCurrentLocationPress()}
                style={[tw.shadow, tw.bgGray100, tw.flexRow, tw.mX6, tw.mT2, tw.pY2, tw.itemsCenter]}
              >
                <MapPinIcon width={20} height={18} fill={color.white} stroke={color.blue500} style={[tw.mX2]} />
                <BodyText lg>Current Location</BodyText>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setShowFilter(true)}>
            <Image style={[tw.h10, tw.mT6, tw.w10, tw.mR2]} source={FilterImage} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <FlexLoader />
        ) : (
          <FlatList
            data={searchListing}
            renderItem={renderItem}
            keyExtractor={(item, index) => `PropertyCard-${index}`}
            ListEmptyComponent={listEmptyComponent}
            ListFooterComponent={() => bottomLoading && <FlexLoader />}
            ListFooterComponentStyle={[tw.pY2]}
          />
        )}
        <FilterModal
          showFilter={showFilter}
          hideFilter={() => setShowFilter(false)}
          searchList={tempSearchList}
          isFilterApplied={isFilterApplied}
          onResetButtonPress={() => setIsFilterApplied(false)}
          onApplyFilter={() => setIsFilterApplied(true)}
          setFilterBy={value => setFilterBy(value)}
        />
      </View>
    </>
  );
};

export default withNavigationFocus(SearchIndex);
