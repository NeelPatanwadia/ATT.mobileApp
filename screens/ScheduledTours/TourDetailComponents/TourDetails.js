import React, { useContext, useEffect, useState } from 'react';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { View, TouchableOpacity, ScrollView, RefreshControl, AppState, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { color, tw } from 'react-native-tailwindcss';
import dateformat from 'dateformat';
import { graphqlOperation, API } from 'aws-amplify';
import TourDetailsCard from './TourDetailsCard';
import { ChevronRightIcon } from '../../../assets/images';
import { AgentModal, BodyText, SecondaryButton, PrimaryButton, StatusIcon } from '../../../components';
import AgentTabContext from '../../../navigation/AgentTabContext';
import TourContext from '../TourContext';
import { hoursToSeconds } from '../../../helpers';
import { buildNextOnTour } from '../../../notifications/messageBuilder';
import { tourService, propertyService, notificationService } from '../../../services';
import { onUpdateTourStopRequestStatus } from '../../../src/graphql/subscriptions';
import { APP_REGIONS, EVENT_TYPES, logEvent } from '../../../helpers/logHelper';

const TourDetails = ({ navigation, isFocused, screenProps: { user } }) => {
  const { setClient, tour, setTour, setTourStop, tourStops, setTourStops, setCopiedTourId } = useContext(TourContext);
  const { startTime, name, status = '' } = tour;
  const { setNavigationParams } = useContext(AgentTabContext);
  const [refreshing, setRefreshing] = useState(false);
  const [startingTour, setStartingTour] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [subscription, setSubscription] = useState(null);

  const selectedTourId = navigation.getParam('selectedTourId', null);
  let tourDateTimeStr = startTime
    ? dateformat(new Date(parseInt(startTime) * 1000), 'm/d/yyyy h:MMtt')
    : 'Showing Time Not Selected';

  if (tour.endTime) {
    const endTime = new Date(parseInt(tour.endTime) * 1000);
    const endTimeStr = dateformat(endTime, 'h:MMtt');

    tourDateTimeStr += `-${endTimeStr}`;
  }

  useEffect(() => {
    const selectedTour = navigation.getParam('selectedTour', null);

    if (selectedTour) {
      setTour(selectedTour);
      initSubscription(selectedTour.id);
    } else {
      refreshTourInfo(tour.id);
      initSubscription();
    }

    setNavigationParams({
      headerTitle: 'Tour Details',
      showBackBtn: true,
      showSettingsBtn: true,
      backRoute: navigation.getParam('isFrom') ? navigation.getParam('isFrom') : 'ScheduledTours',
    });

    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', handleAppStateChange);

      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (tour.name) {
      setClient(tour.client);
    }
    if (tour.id) {
      getTourStops();
    }
  }, [tour]);

  useEffect(() => {
    if (isFocused) {
      getTourStops();
      setCopiedTourId(null);
    }
  }, [isFocused]);

  const getTourStops = async () => {
    try {
      const latestTourStops = await tourService.queries.listTourStops(selectedTourId || tour.id);
      const deletedTourStops = await tourService.queries.listTourStopsOfDeletedPropertyOfInterest({
        tourId: selectedTourId || tour.id,
      });

      setTourStops(deletedTourStops.concat(latestTourStops));
    } catch (error) {
      console.log('Error getting latest tour stops: ', error);
    }

    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);

    getTourStops();
  };

  const refreshTourInfo = async () => {
    setRefreshing(true);
    const res = await tourService.queries.getTour(tour.id);

    setTour(res);
    setRefreshing(false);
  };

  const handleAppStateChange = newState => {
    if (newState === 'active') {
      onRefresh();
    }
  };

  const initSubscription = async tourId => {
    try {
      const tourSubscription = await API.graphql(
        graphqlOperation(onUpdateTourStopRequestStatus, {
          tour_id: tourId || tour.id,
        })
      ).subscribe({
        error: err => {
          console.error('TOUR DETAILS SUBSCRIPTION ERROR: ', err);

          const errMessage = (err && err.error) || 'Unknown';

          logEvent({
            message: `TOUR DETAILS SUBSCRIPTION ERROR: ${errMessage}`,
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

  const selectTourStop = selectedTourStop => {
    setTourStop(selectedTourStop);
    navigation.navigate({
      routeName: 'TourStopDetails',
      params: { tourStopId: selectedTourStop.id, isDeleted: !selectedTourStop.propertyOfInterest.id },
      key: selectedTourStop.id,
    });
  };

  const setNotifyBefore = async before => {
    navigation.goBack(null);

    const newTourStops = [...tourStops].map(mapTourStop => ({
      ...mapTourStop,
      notifyBefore: before,
      notifyAfter: !before,
    }));

    await Promise.all(
      newTourStops.map(({ id, notifyAfter, notifyBefore }) =>
        tourService.mutations.updateTourStop({ id, notifyAfter, notifyBefore })
      )
    );
    setTourStops(newTourStops);
    startTour();
  };

  const startTour = async () => {
    setStartingTour(true);
    setErrorMessage('');

    if (tourStops && tourStops.length > 0) {
      try {
        const [firstTourStop] = tourStops.sort((a, b) => a.order > b.order);

        setTourStop(firstTourStop);

        await tourService.mutations.updateTour({
          id: tour.id,
          status: 'in-progress',
          currentTourStopId: firstTourStop.id,
        });

        if (!firstTourStop.propertyOfInterest.propertyListing.isCustomListing) {
          await notifyUsersOfFirstProperty(firstTourStop);
        } else {
          logEvent({
            message: `Skipping start tour notification for tour: ${firstTourStop.tour_id} because its a custom listing`,
            appRegion: APP_REGIONS.NOTIFICATION,
            eventType: EVENT_TYPES.INFO,
          });
        }

        setStartingTour(false);

        navigation.navigate({
          routeName: 'LiveTour',
          params: { tourStopId: firstTourStop.id },
          key: firstTourStop.id,
        });
      } catch (error) {
        console.log('Error starting tour: ', error);
        setErrorMessage('An error occurred attempting to start the tour.');
        setStartingTour(false);
      }
    } else {
      setErrorMessage('Tour has no tour stops');
      setStartingTour(false);
    }
  };

  const notifyUsersOfFirstProperty = async firstTourStop => {
    try {
      let upToDateTourStop = { ...firstTourStop };

      try {
        upToDateTourStop = await tourService.queries.getTourStop(firstTourStop.id);
      } catch (error) {
        console.log('Error getting up to date info on first tour stop -- falling back to whats in state');
      }

      const propertyOfInterest = await propertyService.queries.getPropertyOfInterest(
        firstTourStop.propertyOfInterestId
      );

      const {
        propertyListing: { listingAgent },
      } = propertyOfInterest;

      const laName = `${listingAgent.firstName} ${listingAgent.lastName}`;

      const templateTokens = {
        laName,
        baName: `${user.firstName} ${user.lastName}`,
        brokerage: user.brokerage,
        address: propertyOfInterest.propertyListing.address.includes(',')
          ? propertyOfInterest.propertyListing.address.split(',')[0]
          : propertyOfInterest.propertyListing.address,
      };

      let nextUpSent = false;

      if (upToDateTourStop.notifyListingAgent) {
        const { push: agentPushMessage, sms: agentSmsMessage, email: agentEmail } = buildNextOnTour(
          templateTokens,
          false
        );

        try {
          await notificationService.mutations.createNotification({
            userId: listingAgent.id,
            pushMessage: agentPushMessage,
            smsMessage: agentSmsMessage,
            email: agentEmail,
          });

          nextUpSent = true;
        } catch (error) {
          console.log('Error sending notification to listing agent: ', error);
        }
      }

      if (upToDateTourStop.notifySeller) {
        try {
          const { seller } = propertyOfInterest.propertyListing;

          if (seller) {
            templateTokens.sellerName = `${seller.firstName} ${seller.lastName}`;

            const { push: sellerPushMessage, sms: sellerSmsMessage, email: sellerEmail } = buildNextOnTour(
              templateTokens,
              true
            );

            await notificationService.mutations.createNotification({
              userId: seller.id,
              pushMessage: sellerPushMessage,
              smsMessage: sellerSmsMessage,
              email: sellerEmail,
            });

            nextUpSent = true;
          }
        } catch (error) {
          console.log('Error sending notification to seller: ', error);
        }
      }

      if (nextUpSent) {
        await tourService.mutations.updateTourStop({
          id: upToDateTourStop.id,
          nextUpSent: true,
          nextUpSentBy: 'Start Tour',
        });
      }
    } catch (error) {
      console.log('Error sending notification to first property: ', error);
    }
  };

  let disabled = false;

  const getTourStopCards = () => {
    try {
      if (tourStops.length === 0) {
        disabled = true;

        return (
          <View style={[tw.mX8, tw.mY4]}>
            <BodyText>
              No properties have been added to the tour. {'\n\n'}Click the "Edit Tour" button below to add some
              properties.
            </BodyText>
          </View>
        );
      }

      return tourStops
        .sort((a, b) => a.order > b.order)
        .map(mapTourStop => {
          const duration = mapTourStop.duration || 0;

          if (mapTourStop.status !== 'approved') {
            disabled = true;
          }

          const arriveTime = mapTourStop.startTime;
          const leaveTime = arriveTime ? arriveTime + hoursToSeconds(duration) : null;

          const tourStopTimeStr =
            arriveTime && leaveTime
              ? `${dateformat(arriveTime * 1000, 'h:MMtt')} - ${dateformat(leaveTime * 1000, 'h:MMtt')}`
              : 'Showing Time Not Selected';

          return (
            <TourDetailsCard
              key={`tourStop-${mapTourStop.id}`}
              onPress={() => selectTourStop({ ...mapTourStop, tourStopTimeStr })}
              tourStopTimeStr={tourStopTimeStr}
              tourStop={mapTourStop}
            />
          );
        });
    } catch (error) {
      console.warn('Error getting tour stop cards: ', error);

      return null;
    }
  };

  const onCopyTour = () => {
    Alert.alert('Are you sure you want to copy this tour?', null, [
      {
        text: 'Yes',
        onPress: () => {
          setCopiedTourId(tour.id);
          setTour({ name: '' });
          navigation.goBack(null);
          navigation.navigate('NewTourClientSelect');
        },
      },
      {
        text: 'Cancel',
      },
    ]);
  };

  const tourTimeStr = `${dateformat(tour.startTime * 1000, 'h:MMtt')}`;

  const getTourStatus = () => {
    let iconStatus = 'approved';

    const isTimeSuggested =
      tourStops.length > 0 && tourStops.findIndex(value => value.status && value.status === 'timeSuggested');

    if (isTimeSuggested !== -1) {
      iconStatus = 'timeSuggested';
    } else {
      const isPending =
        tourStops.length > 0 && tourStops.findIndex(value => value.status === undefined || value.status === 'pending');

      if (isPending !== -1) {
        iconStatus = 'pending';
      } else {
        iconStatus = 'approved';
      }
    }

    if (tourStops.length === 0) {
      return null;
    }

    return <StatusIcon status={iconStatus} />;
  };

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Tour Details',
            showBackBtn: true,
            showSettingsBtn: true,
            backRoute: navigation.getParam('isFrom') ? navigation.getParam('isFrom') : 'ScheduledTours',
          })
        }
      />
      <KeyboardAwareScrollView
        style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.pT8]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[tw.w5_6, tw.selfCenter, tw.pB4]}>
          <BodyText md bold style={[tw.textGray700]}>
            {tour.client ? `${tour.client.firstName} ${tour.client.lastName}` : ''}
          </BodyText>
          <View style={[tw.flexRow, tw.itemsCenter]}>
            <BodyText italic style={[tw.mY1, tw.mR1]} md>
              {name}
            </BodyText>
            {getTourStatus()}
          </View>
          <BodyText md>{tourDateTimeStr}</BodyText>
        </View>
        <View style={[tw.mY4]}>
          {tour.addressStr ? (
            <TouchableOpacity
              disabled
              style={[tw.shadow, tw.wFull, tw.flex1, tw.bgGray100, tw.pY4, tw.pX4, tw.flexRow, tw.itemsCenter]}
            >
              <View style={[tw.hFull, tw.flex1, tw.flexCol, tw.justifyCenter]}>
                <BodyText md bold style={[tw.mB1]}>
                  {tour.customStartName}
                </BodyText>
                <BodyText md bold style={[tw.textGray800]}>
                  {tourTimeStr}
                </BodyText>
                <BodyText md italic style={[tw.mT1]}>
                  Tour Start Location
                </BodyText>
                <BodyText md style={[tw.mY1]}>
                  {tour.addressStr}
                </BodyText>
              </View>
            </TouchableOpacity>
          ) : null}
          {getTourStopCards()}
        </View>
        {status !== 'complete' && (
          <View style={[tw.w5_6, tw.selfCenter]}>
            <SecondaryButton
              style={[tw.border2, tw.borderBlue500, tw.mT2, tw.mB2]}
              textStyle={[tw.textBlue500]}
              title="EDIT TOUR"
              onPress={() => navigation.navigate('NewTourNameDate')}
            />
            <SecondaryButton
              style={[tw.border2, tw.borderBlue500, tw.mT2, tw.mB2]}
              textStyle={[tw.textBlue500]}
              title="COPY TOUR"
              onPress={onCopyTour}
            />
            <AgentModal
              title="Alert Settings"
              trigger={
                <PrimaryButton
                  disabled={disabled}
                  style={[disabled && tw.bgGray400, tw.mT2, tw.mB6]}
                  activeOpacity={disabled ? 1 : 0.7}
                  title="Start Tour"
                  loading={startingTour}
                  loadingTitle="Starting Tour"
                />
              }
              navigation={navigation}
            >
              <View style={[tw.hFull]}>
                <View style={[tw.w5_6, tw.selfCenter]}>
                  <BodyText xl2 center style={[tw.mB4, tw.mT2]}>
                    Notify the next stop when...
                  </BodyText>
                </View>

                <ScrollView style={[tw.hFull]}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setNotifyBefore(true)}
                    style={[tw.shadow, tw.wFull, tw.h20, tw.bgGray100, tw.mT1, tw.pX4, tw.flexRow]}
                  >
                    <View style={[tw.flex1, tw.flexRow, tw.itemsCenter, tw.pR2, tw.pL4]}>
                      <BodyText bold>We arrive at previous stop</BodyText>
                    </View>
                    <View style={[tw.hFull, tw.justifyCenter, tw.p2]}>
                      <ChevronRightIcon width={18} height={18} fill={color.blue400} stroke={color.white} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setNotifyBefore(false)}
                    style={[tw.shadow, tw.wFull, tw.h20, tw.bgGray100, tw.mT1, tw.pX4, tw.flexRow]}
                  >
                    <View style={[tw.flex1, tw.flexRow, tw.itemsCenter, tw.pR2, tw.pL4]}>
                      <BodyText bold>We depart from previous stop</BodyText>
                    </View>
                    <View style={[tw.hFull, tw.justifyCenter, tw.p2]}>
                      <ChevronRightIcon width={18} height={18} fill={color.blue400} stroke={color.white} />
                    </View>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </AgentModal>

            <BodyText style={[tw.mT4, tw.textRed500]}>{errorMessage}</BodyText>
          </View>
        )}
        {status === 'complete' && (
          <View style={[tw.w5_6, tw.selfCenter]}>
            <SecondaryButton
              style={[tw.border2, tw.borderBlue500, tw.mT2, tw.mB20]}
              textStyle={[tw.textBlue500]}
              title="COPY TOUR"
              onPress={onCopyTour}
            />
          </View>
        )}
      </KeyboardAwareScrollView>
    </>
  );
};

export default withNavigationFocus(TourDetails);
