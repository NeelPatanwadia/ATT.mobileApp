import React, { useContext, useEffect, useState, useCallback } from 'react';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { View, RefreshControl, AppState, FlatList, Dimensions } from 'react-native';
import Carousel from 'react-native-snap-carousel';
import { tw } from 'react-native-tailwindcss';
import dateformat from 'dateformat';
import AgentTabContext from '../../navigation/AgentTabContext';
import { showingService } from '../../services';
import { hoursToMilliseconds } from '../../helpers';
import ShowingContext from './ShowingContext';
import ScheduledShowingCard from './ScheduledShowingCard';
import { SearchBar, BodyText, FlexLoader, CheckboxCircle } from '../../components';

const carouselScreens = ['Upcoming', 'Past'];

const ScheduledShowings = ({ navigation, isFocused }) => {
  const { setNavigationParams } = useContext(AgentTabContext);
  const { showings, setShowings, setSelectedShowing, selectedPropertyListing } = useContext(ShowingContext);
  const [upcomingShowings, setUpcomingShowings] = useState([]);
  const [pastShowings, setPastShowings] = useState([]);
  const [showingSearch, setShowingSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCarouselScreen, setSelectedCarouselScreen] = useState('Upcoming');

  useEffect(() => {
    if (isFocused && !refreshing) {
      getShowings();
    }
  }, [isFocused]);

  useEffect(() => {
    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, []);

  useEffect(() => {
    if (showings) {
      splitShowings(showings);
    }
  }, [showingSearch]);

  const handleAppStateChange = newState => {
    if (newState === 'active' && !refreshing) {
      getShowings();
    }
  };

  const getShowings = async (useLoading = false) => {
    try {
      if (useLoading) {
        setLoading(true);
      }

      const newShowings = await showingService.queries.listPropertyListingShowings(selectedPropertyListing.id);

      const formattedShowings = newShowings.map(dbShowing => ({
        ...dbShowing,
        startTime: parseInt(dbShowing.startTime),
      }));

      setShowings(formattedShowings);

      splitShowings(formattedShowings);
    } catch (error) {
      console.log('Error getting showings: ', error);
    }
  };

  const splitShowings = showingList => {
    try {
      if (!showingList || showingList.length === 0) {
        setUpcomingShowings([]);
        setPastShowings([]);
      } else {
        const filteredShowings = showingList.filter(tourCard => {
          const regex = new RegExp(showingSearch, 'i');
          const { startTime, duration } = tourCard;
          let formattedStartDate = '';
          let showingTime = '';

          if (startTime && !Number.isNaN(startTime)) {
            const startTimeDate = new Date(Number.parseInt(startTime) * 1000);

            formattedStartDate = dateformat(startTimeDate, 'mm/dd/yyyy');

            if (duration) {
              const startTimeStr = dateformat(startTime * 1000, 'h:MMtt');
              const endTimeStr = dateformat(startTime * 1000 + hoursToMilliseconds(duration), 'h:MMtt');

              showingTime = `${startTimeStr} - ${endTimeStr}`;
            }
          }

          const tourFields = [formattedStartDate, showingTime].join('');

          return tourFields.match(regex);
        });

        const upcoming = filteredShowings
          .filter(({ startTime }) => startTime > now)
          .sort((a, b) => a.startTime < b.startTime);

        setUpcomingShowings(upcoming);

        const past = filteredShowings
          .filter(({ startTime }) => startTime <= now)
          .sort((a, b) => a.startTime >= b.startTime);

        setPastShowings(past);
      }
    } catch (error) {
      console.log('Error splitting showings: ', error);
    }

    setLoading(false);
    setRefreshing(false);
    setSearching(false);
  };

  const onShowingPress = newShowing => {
    setSelectedShowing(newShowing);
    navigation.navigate({ routeName: 'ShowingDetails', params: {}, key: newShowing.tourStopId });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getShowings().then(() => setRefreshing(false));
  }, [refreshing]);

  const renderShowingsList = ({ item: carouselScreen }) => {
    if (loading || !isFocused || carouselScreen !== selectedCarouselScreen) {
      return <FlexLoader />;
    }

    return (
      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={carouselScreen === 'Upcoming' ? upcomingShowings : pastShowings}
        renderItem={({ item: showingCard }) => <ScheduledShowingCard showing={showingCard} onPress={onShowingPress} />}
        keyExtractor={showingCard => `showingCard-${showingCard.tourStopId}`}
        ListEmptyComponent={
          <View style={[tw.flexCol, tw.mT16, tw.itemsCenter, tw.justifyCenter]}>
            <BodyText>No Showings Found</BodyText>
          </View>
        }
      />
    );
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

  const onChangeScreen = newScreen => {
    setNavigationParams({
      headerTitle: `${newScreen} Showings`,
      showSettingsBtn: true,
      showBackBtn: true,
    });

    setSelectedCarouselScreen(newScreen);
  };

  const executeSearch = async searchTerm => {
    setSearching(true);
    setShowingSearch(searchTerm);
  };

  const now = Math.floor(new Date().getTime() / 1000);

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: `${selectedCarouselScreen} Showings`,
            showSettingsBtn: true,
            showBackBtn: true,
          })
        }
      />
      <View style={[tw.hFull, tw.bgPrimary]}>
        <SearchBar searchTerm={showingSearch} executeSearch={executeSearch} searching={searching} />

        <Carousel
          data={carouselScreens}
          renderItem={renderShowingsList}
          sliderWidth={Dimensions.get('window').width}
          itemWidth={Dimensions.get('window').width}
          onSnapToItem={index => onChangeScreen(carouselScreens[index])}
        />
        {renderSelectedScreenDots()}
      </View>
    </>
  );
};

export default withNavigationFocus(ScheduledShowings);
