import React, { useContext, useEffect, useState } from 'react';
import { NavigationEvents } from 'react-navigation';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { View, TouchableOpacity } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import dateformat from 'dateformat';
import AgentTabContext from '../../navigation/AgentTabContext';
import ShowingContext from './ShowingContext';
import ShowingMessages from './ShowingMessages';
import { ChevronRightIcon } from '../../assets/images';
import { AgentModal, BodyText, CheckboxSquare, FlexLoader } from '../../components';
import { hoursToMilliseconds, getDayOfWeek } from '../../helpers';
import { showingService, tourService, propertyService, userService, calendarService } from '../../services';
import { logEvent, EVENT_TYPES, APP_REGIONS } from '../../helpers/logHelper';
import CalendarView from '../../components/CalendarView';
import { ShowingsIconOutline } from '../../assets/images/tab-icons';

const ClientCard = ({ onPress, style = [], client: { firstName, lastName } }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[tw.shadow, tw.wFull, tw.h20, tw.bgGray100, tw.mY1, tw.pX4, tw.flexRow, ...style]}
  >
    <View style={[tw.flex1, tw.flexRow, tw.itemsCenter, tw.mY1, tw.pX4]}>
      <BodyText bold>{firstName}</BodyText>
      <BodyText bold style={[tw.mL3]}>
        {lastName}
      </BodyText>
    </View>
    <View style={[tw.hFull, tw.justifyCenter, tw.p2, tw.pX8]}>
      <ChevronRightIcon width={18} height={18} fill={color.blue400} stroke={color.white} />
    </View>
  </TouchableOpacity>
);

const AVAILABLE_COLOR = color.availableSlot;
const BOOKED_COLOR = color.bookedSlot;
const PENDING_COLOR = color.pendingSlot;
const ShowingDetails = ({ navigation, screenProps: { user } }) => {
  const {
    selectedPropertyListing,
    setSelectedPropertyListing,
    selectedShowing,
    setSelectedShowing,
    showings,
    setShowings,
  } = useContext(ShowingContext);
  const { setNavigationParams } = useContext(AgentTabContext);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scrollContainer, setScrollContainer] = useState(null);
  const [propertySeller, setPropertySeller] = useState();
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [myEvents, setMyEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    const showingId = navigation.getParam('showingId', null);

    if (showingId) {
      initShowingContexts(showingId);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedShowing && (selectedShowing.tourStopId || selectedShowing.id)) {
      getClients();
      if (selectedShowing.propertyOfInterest.propertyListing.seller) {
        setPropertySeller(selectedShowing.propertyOfInterest.propertyListing.seller);
      }
    }
  }, [selectedShowing]);

  const getShowings = async () => {
    const {
      startTime: selectedShowingStartTime,
      propertyOfInterest: {
        propertyListing: { listingId },
      },
    } = selectedShowing;
    const paramsStartTime = new Date(selectedShowingStartTime * 1000).setHours(0, 0, 0) / 1000;
    const paramsEndTime = new Date(selectedShowingStartTime * 1000).setHours(23, 59, 59) / 1000;

    setCalendarLoading(true);
    try {
      const params = {
        listing_id: listingId,
      };

      if (selectedShowingStartTime) {
        params.start_time = paramsStartTime;
        params.end_datetime = paramsEndTime;
      }
      const Listings = await calendarService.queries.agentTimeSlotDetails(params);
      const bookedListing = Listings.filter(list => list.status !== 'available').sort(
        (a, b) => parseInt(a.startTime) - parseInt(b.startTime)
      );
      const availableListings = Listings.filter(list => list.status === 'available').sort(
        (a, b) => parseInt(a.startTime) - parseInt(b.startTime)
      );

      const tempArr = [];

      availableListings.map(availableValue => {
        const {
          startTime: availableStartTime,
          endDatetime: availableEndTime,
          duration: availableDuration,
        } = availableValue;
        const endDateTime = availableEndTime || availableStartTime + availableDuration * 60 * 60;
        const availableStartDate = dateformat(availableStartTime * 1000, 'isoUtcDateTime');
        const availableEndDate = dateformat(endDateTime * 1000, 'isoUtcDateTime');

        tempArr.push({
          id: tempArr.length + 1,
          startDate: availableStartDate,
          endDate: availableEndDate,
          color: AVAILABLE_COLOR,
        });
        bookedListing.map(bookedValue => {
          const {
            startTime: bookedStartTime,
            endDatetime: bookedEndTime,
            duration: bookedDuration,
            status: bookedStatus,
            buyingAgentFirstName,
            buyingAgentLastName,
            buyingAgentBrokerage,
            tourName,
            isBehalfOfBuyingAgent,
          } = bookedValue;
          const bookedEndDateTime = bookedEndTime || bookedStartTime + bookedDuration * 60 * 60;
          const bookedStartDate = dateformat(bookedStartTime * 1000, 'isoUtcDateTime');
          const bookedEndDate = dateformat(bookedEndDateTime * 1000, 'isoUtcDateTime');

          if (availableStartTime <= bookedStartTime && bookedStartTime <= availableEndTime) {
            const timeRange = `${dateformat(bookedStartTime * 1000, 'h:MMtt')} - ${dateformat(
              bookedEndDateTime * 1000,
              'h:MMtt'
            )}`;
            const tempEnd = tempArr[tempArr.length - 1].endDate;
            const description = isBehalfOfBuyingAgent
              ? `${timeRange}\n${tourName}`
              : `${timeRange}\n${buyingAgentFirstName} ${buyingAgentLastName}${
                  buyingAgentBrokerage ? ` - ${buyingAgentBrokerage}` : ''
                }`;

            tempArr[tempArr.length - 1].endDate = bookedStartDate;
            tempArr.push({
              id: tempArr.length + 1,
              startDate: bookedStartDate,
              endDate: bookedEndDate,
              description,
              color: bookedStatus === 'pending' ? PENDING_COLOR : BOOKED_COLOR,
            });
            tempArr.push({
              id: tempArr.length + 1,
              startDate: bookedEndDate,
              endDate: tempEnd,
              color: AVAILABLE_COLOR,
            });
          }

          return null;
        });

        return null;
      });

      if (availableListings.length === 0 && bookedListing.length !== 0) {
        bookedListing.map(bookedValue => {
          const {
            startTime: bookedStartTime,
            endDatetime: bookedEndTime,
            duration: bookedDuration,
            status: bookedStatus,
            buyingAgentFirstName,
            buyingAgentLastName,
            buyingAgentBrokerage,
            tourName,
            isBehalfOfBuyingAgent,
          } = bookedValue;
          const bookedEndDateTime = bookedEndTime || bookedStartTime + bookedDuration * 60 * 60;
          const bookedStartDate = dateformat(bookedStartTime * 1000, 'isoUtcDateTime');
          const bookedEndDate = dateformat(bookedEndDateTime * 1000, 'isoUtcDateTime');
          const timeRange = `${dateformat(bookedStartTime * 1000, 'h:MMtt')} - ${dateformat(
            bookedEndDateTime * 1000,
            'h:MMtt'
          )}`;
          const description = isBehalfOfBuyingAgent
            ? `${timeRange}\n${tourName}`
            : `${timeRange}\n${buyingAgentFirstName} ${buyingAgentLastName}${
                buyingAgentBrokerage ? ` - ${buyingAgentBrokerage}` : ''
              }`;

          tempArr.push({
            id: tempArr.length + 1,
            startDate: bookedStartDate,
            endDate: bookedEndDate,
            description,
            color: bookedStatus === 'pending' ? PENDING_COLOR : BOOKED_COLOR,
          });

          return null;
        });
      }
      setMyEvents(tempArr);
    } catch (error) {
      console.log('Error getting available time listing', error);
    }
    setCalendarLoading(false);
  };

  const initShowingContexts = async showingId => {
    try {
      const tourStop = await tourService.queries.getTourStop(showingId);

      const {
        propertyOfInterest: { propertyListing },
      } = tourStop;

      if (!propertyListing && propertyListing.id) {
        throw new Error('Could not get property_listing_id for showing');
      }

      const propertyShowings = await showingService.queries.listPropertyListingShowings(propertyListing.id);

      const showing = propertyShowings.find(propShowing => propShowing.tourStopId === showingId);

      if (!showing) {
        throw new Error('Error -- No showing, could not find matching showing from property showing list');
      }

      setSelectedPropertyListing(propertyListing);
      setSelectedShowing(showing);
      setShowings(propertyShowings);
      setPropertySeller(propertyListing.seller || null);

      setLoading(false);
    } catch (error) {
      console.warn('Error loading showing information: ', error);

      if (error && error.message && error.message.includes(' -- No showing,')) {
        setError('This showing is no longer available');

        await logEvent({
          message: `Error initializing showing details on deep link for showing: ${showingId} -- ${JSON.stringify(
            error
          )}`,
          appRegion: APP_REGIONS.NOTIFICATION,
          eventType: EVENT_TYPES.WARNING,
        });
      } else {
        setError('Could not load Showing Details');

        await logEvent({
          message: `Error initializing showing details on deep link for showing: ${showingId} -- ${JSON.stringify(
            error
          )}`,
          appRegion: APP_REGIONS.NOTIFICATION,
          eventType: EVENT_TYPES.ERROR,
        });
      }
    }
  };

  const getClients = async () => {
    try {
      const result = await userService.queries.listClients(user.id);

      setClients(result);
    } catch (error) {
      console.warn('Error getting agent clients: ', error);
    }
  };

  if (error) {
    return (
      <>
        <NavigationEvents
          onWillFocus={() =>
            setNavigationParams({
              headerTitle: 'Showing Details',
              showBackBtn: true,
              showSettingsBtn: true,
            })
          }
        />
        <View style={[tw.flex1, tw.wFull, tw.flexCol, tw.justifyCenter, tw.itemsCenter]}>
          <BodyText style={[tw.textRed500, tw.textcenter]}>{error}</BodyText>
        </View>
      </>
    );
  }

  if (loading || !selectedShowing) {
    return (
      <>
        <NavigationEvents
          onWillFocus={() =>
            setNavigationParams({
              headerTitle: 'Showing Details',
              showBackBtn: true,
              showSettingsBtn: true,
            })
          }
        />
        <FlexLoader />
      </>
    );
  }

  const selectClient = async selectedClient => {
    const { id: sellerId } = selectedClient;

    try {
      await propertyService.mutations.updatePropertyListing({ id: selectedPropertyListing.id, sellerId });

      setPropertySeller(selectedClient);
    } catch (error) {
      console.warn('Error setting property seller: ', error);
    }

    navigation.goBack(null);
  };

  const showingStartTime = new Date(selectedShowing.startTime * 1000);

  showingStartTime.setTime(showingStartTime.getTime());

  const updateShowings = ({ notifyListingAgent }) => {
    const newShowing = { ...selectedShowing, notifyListingAgent };

    const newShowings = showings.map(mapShowing =>
      mapShowing.tourStopId === newShowing.tourStopId ? newShowing : mapShowing
    );

    setSelectedShowing(newShowing);
    setShowings(newShowings);
  };

  const toggleNotification = async () => {
    try {
      const newTourStop = {
        id: selectedShowing.tourStopId,
        notifyListingAgent: !selectedShowing.notifyListingAgent,
      };

      await tourService.mutations.updateTourStop(newTourStop);

      updateShowings({ notifyListingAgent: newTourStop.notifyListingAgent });
    } catch (error) {
      console.warn('Error Toggling Notifications: ', error);
    }
  };

  const clientCards = clients.map((mapClient, idx) => (
    <ClientCard key={`client-${idx}`} client={mapClient} onPress={() => selectClient(mapClient)} />
  ));

  const { startTime = 0, duration = 0 } = selectedShowing;
  const showingDateStr = dateformat(startTime * 1000, 'mm/dd/yy');
  const startTimeStr = dateformat(startTime * 1000, 'h:MMtt');
  const endTimeStr = dateformat(startTime * 1000 + hoursToMilliseconds(duration), 'h:MMtt');
  const showingDayOfWeek = getDayOfWeek(showingDateStr);

  const getPropertyAddress = () => {
    if (selectedPropertyListing) {
      return `${
        selectedPropertyListing.address.includes(',')
          ? selectedPropertyListing.address.split(',')[0]
          : selectedPropertyListing.address
      }`;
    }

    return 'Address Not Available';
  };

  const getPropertyCityState = () => {
    if (selectedPropertyListing) {
      return `${selectedPropertyListing.city}, ${selectedPropertyListing.state}`;
    }

    return '';
  };

  const getBuyersAgentName = () => {
    if (selectedShowing && selectedShowing.buyingAgent) {
      return `${selectedShowing.buyingAgent.firstName} ${selectedShowing.buyingAgent.lastName}`;
    }
  };

  const onCalenderPress = () => {
    setShowCalendarModal(true);
    getShowings();
  };

  const renderCalendarView = () => {
    const { startTime: selectedShowingStartTime } = selectedShowing;
    const tourMonth = dateformat(selectedShowingStartTime ? selectedShowingStartTime * 1000 : new Date(), 'mmmm', true);
    const tourDate = selectedShowingStartTime ? new Date(selectedShowingStartTime * 1000) : new Date();

    return (
      <CalendarView
        tourDate={tourDate}
        tourMonth={tourMonth}
        myEvents={myEvents}
        calendarLoading={calendarLoading}
        setShowCalendarModal={value => setShowCalendarModal(value)}
        showCalendarModal={showCalendarModal}
      />
    );
  };

  return (
    <>
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol]}>
        <KeyboardAwareScrollView style={[tw.hFull]} ref={ref => setScrollContainer(ref)}>
          <View style={[tw.flexCol, tw.justifyCenter, tw.pY4, tw.pX8]}>
            <TouchableOpacity
              style={[tw.flexCol, tw.justifyStart, tw.mY2]}
              onPress={() => navigation.navigate('AgentHomeDetails', { propertyListingId: selectedPropertyListing.id })}
            >
              <BodyText xl bold>
                {getPropertyAddress()}
              </BodyText>
              <BodyText md style={[tw.mT2]}>
                {getPropertyCityState()}
              </BodyText>
            </TouchableOpacity>

            <View style={[tw.flexRow, tw.justifyStart, tw.itemsCenter, tw.mT2]}>
              <BodyText md bold>
                Buyer's Agent:
              </BodyText>
              <BodyText style={[tw.mL2]}>{getBuyersAgentName()}</BodyText>
            </View>

            <View style={[tw.flexRow, tw.justifyStart, tw.itemsCenter, tw.mT2]}>
              <BodyText md bold>
                Client:
              </BodyText>
              <AgentModal
                title="Seller Select"
                trigger={
                  <TouchableOpacity>
                    {propertySeller && (
                      <BodyText
                        style={[tw.mL2, tw.textBlue500]}
                      >{`${propertySeller.firstName} ${propertySeller.lastName}`}</BodyText>
                    )}
                    {!propertySeller && (
                      <BodyText semibold style={[tw.mL2, tw.textBlue500]}>
                        Select Client
                      </BodyText>
                    )}
                  </TouchableOpacity>
                }
                navigation={navigation}
              >
                <View style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
                  <View style={[tw.wFull, tw.flex1]}>{clientCards}</View>
                </View>
              </AgentModal>
            </View>

            <BodyText md style={[tw.mT4]}>
              {getBuyersAgentName()} would like to show this property:
            </BodyText>

            <View style={[tw.mT4, tw.flexRow]}>
              <View style={[tw.flexCol, tw.flex1]}>
                <View style={[tw.flexRow, tw.justifyStart, tw.itemsCenter, tw.mT1]}>
                  <BodyText bold>
                    {showingDayOfWeek} {showingDateStr}
                  </BodyText>
                </View>
                <View style={[tw.flexRow, tw.justifyStart, tw.itemsCenter, tw.mT1]}>
                  <BodyText bold>{`${startTimeStr} - ${endTimeStr}`}</BodyText>
                </View>
              </View>
              <TouchableOpacity onPress={() => onCalenderPress()} style={[tw.p1, tw.selfEnd, tw.mS1]}>
                <ShowingsIconOutline width={22} height={22} fill={color.black} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[tw.mY1, tw.h2, tw.mX6, tw.border0, tw.borderT, tw.borderGray500]} />
          <View style={[tw.mX6]}>
            <TouchableOpacity style={[tw.flexRow, tw.mT4]} activeOpacity={0.7} onPress={toggleNotification}>
              <CheckboxSquare sm checked={selectedShowing.notifyListingAgent} style={[tw.selfCenter]} />
              <BodyText style={[tw.mX3]}>Send me location notifications</BodyText>
            </TouchableOpacity>
          </View>
          <ShowingMessages
            user={user}
            navigation={navigation}
            parentContainer={scrollContainer}
            goback={() => navigation.navigate('ScheduledShowings')}
          />
        </KeyboardAwareScrollView>
      </View>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Showing Detail',
            showBackBtn: true,
            showSettingsBtn: true,
          })
        }
      />
      {renderCalendarView()}
    </>
  );
};

export default ShowingDetails;
