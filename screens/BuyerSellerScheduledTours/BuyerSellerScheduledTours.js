import React, { useCallback, useContext, useEffect, useState } from 'react';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { View, TouchableOpacity, FlatList, RefreshControl, AppState, Dimensions } from 'react-native';
import { graphqlOperation, API } from 'aws-amplify';
import { tw } from 'react-native-tailwindcss';
import dateformat from 'dateformat';
import Carousel from 'react-native-snap-carousel';
import { BodyText, SearchBar, CheckboxCircle, FlexLoader, Badge } from '../../components';
import { tourService } from '../../services';
import { ChevronRightIcon } from '../../assets/images';
import BuyerSellerTabContext from '../../navigation/BuyerSellerTabContext';
import BuyerSellerTourContext from './BuyerSellerTourContext';
import { onCreateTour } from '../../src/graphql/subscriptions';
import { EVENT_TYPES, logEvent, APP_REGIONS } from '../../helpers/logHelper';

const BuyerSellerScheduledTourCard = ({
  onPress,
  style = [],
  icon = <ChevronRightIcon width={15} height={15} />,
  tour: { name = '', startTime = 0, endTime, seenByClient },
}) => {
  const dateStr = dateformat(startTime * 1000, 'mm/dd/yyyy');
  let timeStr = dateformat(startTime * 1000, 'h:MMtt');

  if (endTime) {
    const endTimeStr = dateformat(new Date(endTime * 1000), 'h:MMtt');

    timeStr += `-${endTimeStr}`;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[tw.shadow, tw.wFull, tw.bgGray100, tw.mY1, tw.pL4, tw.pR8, tw.pY4, tw.flexRow, ...style]}
    >
      <View style={[tw.flexCol, tw.itemsCenter, tw.justifyCenter, tw.w4, tw.mR4]}>
        {!seenByClient && <Badge noCountNeeded sm />}
      </View>
      <View style={[tw.flexCol, tw.justifyCenter, tw.flex1]}>
        <BodyText bold lg>
          {name}
        </BodyText>
        <View style={[tw.flexRow, tw.justifyBetween, tw.itemsCenter, tw.mY1]}>
          <BodyText>{dateStr}</BodyText>
          <BodyText>{timeStr}</BodyText>
        </View>
      </View>
      <View style={[tw.justifyCenter, tw.mL12]}>{icon}</View>
    </TouchableOpacity>
  );
};

const carouselScreens = ['Upcoming', 'Past'];

const BuyerSellerScheduledTours = ({ navigation, isFocused, screenProps: { user } }) => {
  const { setNavigationParams } = useContext(BuyerSellerTabContext);
  const { setSelectedTour } = useContext(BuyerSellerTourContext);
  const [tours, setTours] = useState(null);
  const [upcomingTours, setUpcomingTours] = useState([]);
  const [pastTours, setPastTours] = useState([]);
  const [tourSearch, setTourSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [selectedCarouselScreen, setSelectedCarouselScreen] = useState('Upcoming');

  useEffect(() => {
    getTours();
    initSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, []);

  useEffect(() => {
    if (tours) {
      splitTours(tours);
    }
  }, [tourSearch]);

  const handleAppStateChange = newState => {
    if (newState === 'active' && !refreshing) {
      onRefresh();
    }
  };

  const getTours = async (useLoading = false) => {
    try {
      if (useLoading) {
        setLoading(true);
      }

      const clientTours = await tourService.queries.listTours({ clientId: user.id });

      setTours(clientTours);
      splitTours(clientTours);
    } catch (error) {
      console.log('Error getting client tours: ', error);
    }
  };

  const splitTours = toursList => {
    try {
      if (!toursList || toursList.length === 0) {
        setUpcomingTours([]);
        setPastTours([]);
      } else {
        const filteredTours = toursList.filter(tourCard => {
          const regex = new RegExp(tourSearch, 'i');
          const { startTime, name } = tourCard;
          let formattedStartDate = '';
          let formattedStartTime = '';

          if (startTime && !Number.isNaN(startTime)) {
            const startTimeDate = new Date(Number.parseInt(startTime) * 1000);

            formattedStartDate = dateformat(startTimeDate, 'mm/dd/yyyy');
            formattedStartTime = dateformat(startTime * 1000, 'h:MMtt');
          }
          const tourFields = [formattedStartDate, formattedStartTime, name].join('');

          return tourFields.match(regex);
        });

        const upcoming = filteredTours.filter(t => t.status !== 'complete').sort((a, b) => a.startTime < b.startTime);

        setUpcomingTours(upcoming);

        const past = filteredTours
          .filter(({ status }) => status === 'complete')
          .sort((a, b) => a.startTime < b.startTime);

        setPastTours(past);
      }
    } catch (error) {
      console.log('Error splitting buyer/seller tours: ', error);
    }

    setLoading(false);
    setRefreshing(false);
    setSearching(false);
  };

  const initSubscription = async () => {
    try {
      const tourSubscription = await API.graphql(graphqlOperation(onCreateTour, { client_id: user.id })).subscribe({
        error: err => {
          console.error('CLIENT SCHEDULED TOURS SUBSCRIPTION ERROR:', err);

          const errMessage = err && err.error ? JSON.stringify(err.error) : 'Unknown';

          logEvent({
            message: `CLIENT SCHEDULED TOURS SUBSCRIPTION ERROR: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        },
        next: () => {
          onRefresh();
        },
      });

      setSubscription(tourSubscription);
    } catch (error) {
      console.log('Error on tour subscription: ', error);
    }
  };

  const tourHasBeenSeen = async selectedTour => {
    try {
      await tourService.mutations.updateTour({
        id: selectedTour.id,
        seen_by_client: true,
      });
      onRefresh();
    } catch (error) {
      console.warn('Error updating tour seen status: ', error);
    }
  };

  const selectTour = async selectedTour => {
    setSelectedTour(selectedTour);
    tourHasBeenSeen(selectedTour);
    navigation.navigate('BuyerSellerTourDetails');
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    getTours();
  }, [refreshing]);

  const renderToursList = ({ item: carouselScreen }) => {
    if (loading || !isFocused || carouselScreen !== selectedCarouselScreen) {
      return <FlexLoader />;
    }

    return (
      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={carouselScreen === 'Upcoming' ? upcomingTours : pastTours}
        renderItem={({ item: tourCard }) => (
          <BuyerSellerScheduledTourCard onPress={() => selectTour(tourCard)} tour={tourCard} />
        )}
        keyExtractor={tourCard => `tourCard-${tourCard.id}`}
        ListEmptyComponent={
          <View style={[tw.flexCol, tw.mT16, tw.itemsCenter, tw.justifyCenter]}>
            <BodyText>No Tours Found</BodyText>
          </View>
        }
      />
    );
  };

  const onChangeScreen = newScreen => {
    setNavigationParams({
      headerTitle: `${newScreen} Tours`,
      showSettingsBtn: true,
    });

    setSelectedCarouselScreen(newScreen);
  };

  const renderSelectedScreenDots = () => {
    const dots = carouselScreens.map(screen => (
      <CheckboxCircle key={`${screen}-dot`} checked={screen === selectedCarouselScreen} style={[tw.mX3]} md />
    ));

    return (
      <View style={[tw.flexRow, tw.justifyCenter, tw.itemsCenter, tw.pT4, tw.pB4, tw.borderT, tw.borderGray300]}>
        {dots}
      </View>
    );
  };

  const executeSearch = async searchTerm => {
    setSearching(true);
    setTourSearch(searchTerm);
  };

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: `${selectedCarouselScreen} Tours`,
            showSettingsBtn: true,
          })
        }
      />
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol]}>
        <SearchBar searchTerm={tourSearch} executeSearch={executeSearch} searching={searching} />

        <Carousel
          data={carouselScreens}
          renderItem={renderToursList}
          sliderWidth={Dimensions.get('window').width}
          itemWidth={Dimensions.get('window').width}
          onSnapToItem={index => onChangeScreen(carouselScreens[index])}
        />
        {renderSelectedScreenDots()}
      </View>
    </>
  );
};

export default withNavigationFocus(BuyerSellerScheduledTours);
