import React, { useState, useEffect, useContext } from 'react';
import dateformat from 'dateformat';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { View, TouchableOpacity, Dimensions, RefreshControl, FlatList, Alert } from 'react-native';
import Carousel from 'react-native-snap-carousel';
import { tw } from 'react-native-tailwindcss';
import { BodyText, PrimaryButton, SearchBar, CheckboxCircle, FlexLoader } from '../../components';
import { hoursToMilliseconds } from '../../helpers';
import { ChevronRightIcon } from '../../assets/images';
import { notificationService, tourService } from '../../services';
import AgentTabContext from '../../navigation/AgentTabContext';
import TourContext from './TourContext';
import RoundSelectCircle from '../../components/RoundSelectCircle';
import { buildCancelShowingRequest } from '../../notifications/messageBuilder';

const ScheduledTourCard = ({
  onPress,
  style = [],
  icon = <ChevronRightIcon width={15} height={15} />,
  tour,
  onEditSelected,
  onSelectionPress,
}) => {
  const dateStr = dateformat((tour.startTime || 0) * 1000, 'mm/dd/yyyy');
  const startTimeStr = dateformat((tour.startTime || 0) * 1000, 'h:MMtt');

  let timeStr = `${startTimeStr}`;

  if (tour.endTime) {
    const endTime = new Date(parseInt(tour.endTime) * 1000);

    endTime.setTime(endTime.getTime() + hoursToMilliseconds(tour.totalDuration || 0));

    const endTimeStr = dateformat(endTime, 'h:MMtt');

    timeStr += `-${endTimeStr}`;
  }

  return (
    <TouchableOpacity
      disabled={onEditSelected}
      onPress={onPress}
      style={[
        tw.shadow,
        tw.wFull,
        tw.bgGray100,
        tw.mY1,
        tw.pX8,
        tw.pY4,
        tw.flexRow,
        onEditSelected && tw.pL4,
        ...style,
      ]}
    >
      {onEditSelected && (
        <RoundSelectCircle
          key={`${tour.id}-dot`}
          onPress={() => onSelectionPress(tour)}
          selected={tour.isSelected}
          style={[tw.p2, tw.selfCenter]}
          md
        />
      )}
      <View style={[tw.flexCol, tw.justifyCenter, tw.flex1]}>
        <BodyText bold lg>
          {tour.client && `${tour.client.firstName} ${tour.client.lastName}`}
        </BodyText>

        <View style={[tw.flexRow, tw.justifyBetween, tw.itemsCenter, tw.mY1]}>
          <BodyText>{dateStr}</BodyText>
          <BodyText>{timeStr}</BodyText>
        </View>

        <BodyText italic>{tour.name || `Tour ${tour.id}`}</BodyText>
      </View>
      <View style={[tw.justifyCenter, tw.mL12]}>{icon}</View>
    </TouchableOpacity>
  );
};

const carouselScreens = ['Upcoming', 'Past'];

const ScheduledTours = ({ navigation, isFocused, screenProps: { user } }) => {
  const [tourSearch, setTourSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const { setNavigationParams } = useContext(AgentTabContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { tours, setTours, tour, setTour, setCopiedTourId } = useContext(TourContext);
  const [upcomingTours, setUpcomingTours] = useState([]);
  const [pastTours, setPastTours] = useState([]);
  const [selectedCarouselScreen, setSelectedCarouselScreen] = useState('Upcoming');
  const [onEditSelected, setEditSelected] = useState(false);
  const [refreshScreen, setRefreshScreen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isUpdate, setIsUpdate] = useState(true);
  const focus = navigation.getParam('focus', true);

  useEffect(() => {
    getTours(true);
  }, []);

  useEffect(() => {
    if (focus !== false && isFocused === true) getTours(true);
  }, [focus, isFocused]);

  useEffect(() => {
    if (tour && tour.id && !tours.map(t => t.id).includes(tour.id)) {
      getTours(true);
    }
  }, [tour]);

  useEffect(() => {
    if (isFocused) getTours();
  }, [isFocused]);

  useEffect(() => {
    if (tours) {
      splitTours(tours);
    }
  }, [tourSearch]);

  useEffect(() => {
    setNavigationParams({
      headerTitle: `${selectedCarouselScreen} Tours`,
      showSettingsBtn: true,
      showEditBtn: true,
      editTitle: onEditSelected ? 'Done' : 'Edit',
      onEditPress: () => onEditPress(),
    });
  }, [onEditSelected]);

  const getTours = async (useLoading = false) => {
    try {
      if (useLoading) {
        setLoading(true);
      }

      const toursList = await tourService.queries.listTours({ agentId: user.id });
      const filteredTour = toursList.filter(value => !value.isBehalfOfBuyingAgent);

      setTours(filteredTour);
      splitTours(filteredTour);
    } catch (error) {
      console.log('Error getting tours: ', error);
    }
  };

  const splitTours = toursList => {
    try {
      if (!toursList || toursList.length === 0) {
        setUpcomingTours([]);
        setPastTours([]);
      } else {
        const filteredShowings = toursList.filter(tourCard => {
          const regex = new RegExp(tourSearch, 'i');
          const { startTime, clientName, name, totalDuration } = tourCard;
          let formattedStartDate = '';
          let showingTime = '';

          if (startTime && !Number.isNaN(startTime)) {
            const startTimeDate = new Date(Number.parseInt(startTime) * 1000);

            formattedStartDate = dateformat(startTimeDate, 'mm/dd/yyyy');

            if (totalDuration) {
              const startTimeStr = dateformat(startTime * 1000, 'h:MMtt');
              const endTimeStr = dateformat(startTime * 1000 + hoursToMilliseconds(totalDuration), 'h:MMtt');

              showingTime = `${startTimeStr} - ${endTimeStr}`;
            }
          }

          const tourFields = [formattedStartDate, showingTime, clientName, name].join('');

          return tourFields.match(regex);
        });

        const upcoming = filteredShowings
          .map(value => ({ ...value, isSelected: false }))
          .filter(({ status }) => status !== 'complete')
          .sort((a, b) => parseInt(b.startTime) - parseInt(a.startTime));

        setUpcomingTours(upcoming);

        const past = filteredShowings
          .map(value => ({ ...value, isSelected: false }))
          .filter(({ status }) => status === 'complete')
          .sort((a, b) => parseInt(b.startTime) - parseInt(a.startTime));

        setPastTours(past);
      }
    } catch (error) {
      console.log('Error splitting tours: ', error);
    }

    setLoading(false);
    setRefreshing(false);
    setSearching(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    getTours();
  };

  const onEditPress = (isFromDelete = false) => {
    if (onEditSelected && isFromDelete === false) {
      resetSelected();
    }
    setEditSelected(!onEditSelected);
  };

  const resetSelected = () => {
    const upcoming = upcomingTours
      .map(value => ({ ...value, isSelected: false }))
      .sort((a, b) => parseInt(b.startTime) - parseInt(a.startTime));

    setUpcomingTours(upcoming);
    const past = pastTours
      .map(value => ({ ...value, isSelected: false }))
      .sort((a, b) => parseInt(b.startTime) - parseInt(a.startTime));

    setPastTours(past);
  };

  const onDeletePress = () => {
    const tempArr =
      selectedCarouselScreen === 'Upcoming'
        ? upcomingTours.filter(value => value.isSelected)
        : pastTours.filter(value => value.isSelected);

    if (tempArr[0]) {
      onRemoveTour(tempArr[0]);
    }
  };

  const onRemoveTour = async tourDetail => {
    setDeleting(true);
    if (tourDetail.status === 'complete') {
      deleteTourAndTourStops(tourDetail.id);
    } else {
      const tourStopsObject = await tourService.queries.getTourStopOfCompletedTour(tourDetail.id);
      const tourStops = Object.keys(tourStopsObject).map(e => tourStopsObject[e]);

      if (tourStops.length > 0) {
        Alert.alert(
          'Approve home warning',
          `One or more homes on this Tour have an approved showing request. If you click Continue, the Listing Agents for these showings will receive a message that the showing has been cancelled.`,
          [
            {
              text: 'Continue',
              onPress: () => sendTextMessage(tourDetail.id, tourStops),
            },
            {
              text: 'Cancel',
              onPress: () => setDeleting(false),
            },
          ]
        );
      } else {
        deleteTourAndTourStops(tourDetail.id);
      }
    }
  };

  const sendTextMessage = async (id, tourStops) => {
    await Promise.all(
      tourStops.map(async ts => {
        const { push, sms, email } = buildCancelShowingRequest({
          address: ts.propertyAddress.includes(',') ? ts.propertyAddress.split(',')[0] : ts.propertyAddress,
        });

        if (ts.status === 'approved' && ts.listingAgent && ts.listingAgent.cellPhone) {
          try {
            return notificationService.mutations.createNotification({
              userId: ts.listingAgent.id,
              pushMessage: push,
              smsMessage: sms,
              email,
            });
          } catch (error) {
            console.log('error', error);
            setDeleting(false);

            return false;
          }
        }
      })
    );
    await deleteTourAndTourStops(id);
  };

  const deleteTourAndTourStops = async tourId => {
    const res = await tourService.mutations.deleteTourAndReferences(tourId);

    if (res && res.tourId) {
      setTours(tours.filter(t => t.id !== res.tourId));
      if (selectedCarouselScreen === 'Upcoming') {
        await setUpcomingTours(upcomingTours.filter(t => t.id !== res.tourId));
      } else {
        await setPastTours(pastTours.filter(t => t.id !== res.tourId));
      }
      onEditPress(true);
    }
    setIsUpdate(!isUpdate);
    setDeleting(false);
  };

  const selectTour = async selectedTour => {
    setTour(selectedTour);
    if (selectedCarouselScreen === 'Upcoming') {
      navigation.navigate('TourDetails');
    } else {
      navigation.navigate('TourDetails');
    }
  };

  const onCreateTour = () => {
    setTour({ name: '' });
    setCopiedTourId(null);
    navigation.navigate('NewTour');
  };

  const onSelectionPress = selectedTour => {
    const selectedData = selectedCarouselScreen === 'Upcoming' ? upcomingTours : pastTours;
    const tempArr = selectedData.map(value =>
      value.id === selectedTour.id ? { ...value, isSelected: true } : { ...value, isSelected: false }
    );

    if (selectedCarouselScreen === 'Upcoming') {
      setUpcomingTours(tempArr);
    } else {
      setPastTours(tempArr);
    }
    setRefreshScreen(!refreshScreen);
  };

  const renderTourCards = ({ item: carouselScreen }) => {
    if (loading || !isFocused || carouselScreen !== selectedCarouselScreen) {
      return <FlexLoader />;
    }

    return (
      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={carouselScreen === 'Upcoming' ? upcomingTours : pastTours}
        renderItem={({ item: tourCard }) => (
          <ScheduledTourCard
            onPress={() => selectTour(tourCard)}
            tour={tourCard}
            onEditSelected={onEditSelected}
            onSelectionPress={selectedTour => onSelectionPress(selectedTour)}
          />
        )}
        keyExtractor={tourCard => `tourCard-${tourCard.id}`}
        ListEmptyComponent={
          <View style={[tw.flexCol, tw.mT16, tw.itemsCenter, tw.justifyCenter]}>
            <BodyText>No Tours Found</BodyText>
          </View>
        }
        extraData={isUpdate}
      />
    );
  };

  const renderSelectedScreenDots = () => {
    const dots = carouselScreens.map(screen => (
      <CheckboxCircle key={`${screen}-dot`} checked={screen === selectedCarouselScreen} style={[tw.mX3]} md />
    ));

    return (
      <View style={[tw.flexRow, tw.justifyCenter, tw.itemsCenter, tw.pT4, tw.pB0, tw.borderT, tw.borderGray300]}>
        {dots}
      </View>
    );
  };

  const onChangeScreen = newScreen => {
    setEditSelected(false);
    resetSelected();
    setNavigationParams({
      headerTitle: `${newScreen} Tours`,
      showSettingsBtn: true,
      showEditBtn: true,
      editTitle: onEditSelected ? 'Done' : 'Edit',
      onEditPress: () => onEditPress(),
    });

    setSelectedCarouselScreen(newScreen);
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
            showEditBtn: true,
            editTitle: onEditSelected ? 'Done' : 'Edit',
            onEditPress: () => onEditPress(),
          })
        }
      />

      <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol]}>
        <SearchBar searchTerm={tourSearch} executeSearch={executeSearch} searching={searching} />

        {!loading ? (
          <Carousel
            data={carouselScreens}
            renderItem={renderTourCards}
            sliderWidth={Dimensions.get('window').width}
            itemWidth={Dimensions.get('window').width}
            onSnapToItem={index => onChangeScreen(carouselScreens[index])}
          />
        ) : (
          <FlexLoader />
        )}

        {renderSelectedScreenDots()}

        <View style={[tw.h24, tw.justifyCenter, tw.pX8]}>
          {onEditSelected ? (
            <PrimaryButton title="DELETE TOUR" onPress={onDeletePress} loadingTitle="DELETING" loading={deleting} />
          ) : (
            <PrimaryButton title="Create New Tour" onPress={onCreateTour} />
          )}
        </View>
      </View>
    </>
  );
};

export default withNavigationFocus(ScheduledTours);
