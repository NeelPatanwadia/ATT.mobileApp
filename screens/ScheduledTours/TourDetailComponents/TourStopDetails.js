/* eslint-disable prefer-destructuring */
import React, { useContext, useEffect, useState, useRef } from 'react';
import { NavigationEvents } from 'react-navigation';
import { View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { color, tw } from 'react-native-tailwindcss';
import dateformat from 'dateformat';
import { BodyText, PrimaryButton, FlexLoader, StatusIcon } from '../../../components';
import { snakeKeys, hoursToSeconds } from '../../../helpers';
import { messageService, tourService, notificationService, calendarService } from '../../../services';
import { CompassIcon } from '../../../assets/images';
import { roundUpToNearest15MinuteInterval } from '../../../helpers/dateHelpers';
import AgentTabContext from '../../../navigation/AgentTabContext';
import TourContext from '../TourContext';
import DatePickerForm from './DatePickerForm';
import CustomMessageForm from './CustomTourStopMessageForm';
import ConnectedTourStopMessages from '../ConnectedTourStopMessages';
import { logEvent, APP_REGIONS, EVENT_TYPES } from '../../../helpers/logHelper';
import {
  buildApproveShowingRequest,
  buildShowingRequestComment,
  buildSuggestAlternateTime,
} from '../../../notifications/messageBuilder';
import { DropdownInput } from '../../../components/inputs';
import { ShowingsIconOutline } from '../../../assets/images/tab-icons';
import CalendarView from '../../../components/CalendarView';

const AVAILABLE_COLOR = color.availableSlot;
const BOOKED_COLOR = color.bookedSlot;
const PENDING_COLOR = color.pendingSlot;
const TourStopDetails = ({ navigation, screenProps: { user } }) => {
  const { setNavigationParams } = useContext(AgentTabContext);
  const { tour, tourStop, setTourStop, setTour, setClient, tourStops, setTourStops } = useContext(TourContext);
  const [selectedResponse, setSelectedResponse] = useState('Self-Approve Time');
  const [openTimePicker, setOpenTimePicker] = useState(false);
  const [openCustomMessage, setOpenCustomMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [isFromScreen, setIsFromScreen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tourMessages, setTourMessages] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [myEvents, setMyEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  let dateTime = new Date();

  if (tourStop.startTime) {
    const tourStopArriveTime = tourStop.startTime + (tourStop.estDriveDuration || 0);

    dateTime = new Date(tourStopArriveTime * 1000);
  }

  const [showingDateTime, setShowingDateTime] = useState(dateTime);

  const scroll = useRef(null);

  useEffect(() => {
    const tourStopId = navigation.getParam('tourStopId', null);
    const isFrom = navigation.getParam('isFrom', null);

    if (isFrom) {
      setIsFromScreen(isFrom);
    } else {
      setIsFromScreen(null);
    }

    if (tourStopId) {
      initTourStopContexts(tourStopId);
    } else {
      setLoading(false);
    }
  }, []);

  const getShowings = async () => {
    const {
      startTime,
      propertyOfInterest: {
        propertyListing: { listingId },
      },
    } = tourStop;
    const paramsStartTime = new Date(startTime * 1000).setHours(0, 0, 0) / 1000;
    const paramsEndTime = new Date(startTime * 1000).setHours(23, 59, 59) / 1000;

    setCalendarLoading(true);
    try {
      const params = {
        listing_id: listingId,
      };

      if (startTime) {
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
            buyingAgentEmailAddress,
            buyingAgentFirstName,
            buyingAgentLastName,
            buyingAgentBrokerage,
            tourName,
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
            const description =
              buyingAgentEmailAddress === user.emailAddress
                ? `${timeRange}\n${buyingAgentFirstName} ${buyingAgentLastName}${
                    buyingAgentBrokerage ? ` - ${buyingAgentBrokerage}` : ''
                  } - ${tourName}`
                : `${timeRange}`;

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
            buyingAgentEmailAddress,
            buyingAgentFirstName,
            buyingAgentLastName,
            buyingAgentBrokerage,
            tourName,
          } = bookedValue;
          const bookedEndDateTime = bookedEndTime || bookedStartTime + bookedDuration * 60 * 60;
          const bookedStartDate = dateformat(bookedStartTime * 1000, 'isoUtcDateTime');
          const bookedEndDate = dateformat(bookedEndDateTime * 1000, 'isoUtcDateTime');
          const timeRange = `${dateformat(bookedStartTime * 1000, 'h:MMtt')} - ${dateformat(
            bookedEndDateTime * 1000,
            'h:MMtt'
          )}`;
          const description =
            buyingAgentEmailAddress === user.emailAddress
              ? `${timeRange}\n${buyingAgentFirstName} ${buyingAgentLastName}${
                  buyingAgentBrokerage ? ` - ${buyingAgentBrokerage}` : ''
                } - ${tourName}`
              : `${timeRange}`;

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

  const initTourStopContexts = async tourStopId => {
    const isDeleted = navigation.getParam('isDeleted', null);

    try {
      let newTourStop;

      if (isDeleted) {
        const res = await tourService.queries.listTourStopsOfDeletedPropertyOfInterest({ tourStopId });

        newTourStop = res[0];
      } else {
        newTourStop = await tourService.queries.getTourStop(tourStopId);
      }

      if (!newTourStop) {
        setError('Error Loading Tour Detail');

        return;
      }

      if (!newTourStop.isActive) {
        setError('This showing is no longer available');

        await logEvent({
          message: `Navigating to removed tour stop details page: ${tourStopId}`,
          appRegion: APP_REGIONS.NOTIFICATION,
          eventType: EVENT_TYPES.INFO,
        });

        return;
      }

      const newTourStops = await tourService.queries.listTourStops(newTourStop.tourId);
      const newTour = await tourService.queries.getTour(newTourStop.tourId);
      const newClient = newTourStop.propertyOfInterest.client;

      setTourStops(newTourStops);
      setTourStop(newTourStop);

      setShowingDateTime(roundUpToNearest15MinuteInterval(new Date(parseInt(newTourStop.startTime) * 1000)));
      setTour(newTour);
      setClient(newClient);

      setLoading(false);
    } catch (error) {
      console.log('Error initializing tour stop details: ', error);

      setError('Error Loading Tour Details');
    }
  };

  const notifyUser = async ({ comment, isApproval, isNewTime }) => {
    try {
      const tourStopStartTime = new Date(tourStop.startTime * 1000);
      const dateOfTour = dateformat(tourStopStartTime, 'mm/dd/yy');

      const {
        propertyOfInterest: { propertyListing },
      } = tourStop;

      const templateTokens = {
        name: `${user.firstName} ${user.lastName}`,
        brokerage: user.brokerage,
        date: dateOfTour,
        address: propertyListing.address.includes(',')
          ? propertyListing.address.split(',')[0]
          : propertyListing.address,
      };

      let push = '';
      let sms = '';
      let email = '';

      if (isApproval) {
        const timeRangeStart = dateformat(tourStopStartTime, 'h:MMtt');

        const tourStopEndTime = new Date(
          tourStopStartTime.getTime() + Number.parseFloat(tourStop.duration || 0) * 3600000
        );

        const timeRangeEnd = dateformat(tourStopEndTime, 'h:MMtt');

        templateTokens.timeRange = `${timeRangeStart} to ${timeRangeEnd}`;

        ({ push, sms, email } = buildApproveShowingRequest(templateTokens));
      } else if (isNewTime) {
        const timeRangeStart = dateformat(showingDateTime, 'h:MMtt');

        const tourStopEndTime = new Date(
          parseInt(new Date(showingDateTime).getTime() / 1000 + hoursToSeconds(tourStop.duration)) * 1000
        );

        const timeRangeEnd = dateformat(tourStopEndTime, 'h:MMtt');

        templateTokens.timeRange = `${timeRangeStart} to ${timeRangeEnd}`;
        ({ push, sms, email } = buildSuggestAlternateTime(templateTokens));
      } else if (comment) {
        templateTokens.message = comment;

        ({ push } = buildShowingRequestComment(templateTokens));
      }

      await notificationService.mutations.createNotification({
        userId: tourStop.propertyOfInterest.propertyListing.listingAgentId,
        pushMessage: push,
        smsMessage: sms || null,
        email: sms ? email : null,
        routeName: 'ShowingDetails',
        routeParams: { showingId: tourStop.id },
        routeKey: tourStop.id,
      });
    } catch (error) {
      console.log('Error sending notification: ', error);
    }
  };

  const onSelfApprovePress = async () => {
    setIsLoading(true);
    const {
      startTime,
      propertyOfInterest: {
        propertyListingId,
        propertyListing: { listingId },
      },
    } = tourStop;
    const paramsStartTime = new Date(startTime * 1000).setHours(0, 0, 0) / 1000;
    const paramsEndTime = new Date(startTime * 1000).setHours(23, 59, 59) / 1000;

    const params = {
      listing_id: listingId,
    };

    if (startTime !== 0) {
      params.start_time = paramsStartTime;
      params.end_datetime = paramsEndTime;
    }

    const Listings = await calendarService.queries.agentTimeSlotDetails(params);
    const availableListings = Listings.filter(list => list.status === 'available');

    setIsLoading(false);
    if (availableListings && availableListings.length === 0) {
      promptApproveTime(tourStop);
    } else {
      const getAutoApproveStatus = await tourService.queries.getPropertyListingAutoApprove(propertyListingId);

      if (getAutoApproveStatus && getAutoApproveStatus.isAutoApprove) {
        promptApproveTime(tourStop);
      } else {
        promptNotSelfApprove();
      }
    }
  };

  const promptApproveTime = () => {
    Alert.alert(
      'Approve Time',
      'This will confirm the tour appointment on behalf of the listing agent. Are you sure you want to continue?',
      [
        {
          text: 'Continue',
          onPress: () => approveTime(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const promptNotSelfApprove = () => {
    Alert.alert(
      'Self-Approve not available',
      'This home is not available for self-approval.  You must send the showing request to the Listing Agent to schedule this showing.',
      [
        {
          text: 'Ok',
          onPress: () => {},
        },
      ]
    );
  };

  const approveTime = async () => {
    try {
      await tourService.mutations.updateTourStopRequestStatus({
        id: tourStop.id,
        status: 'approved',
        requestSent: true,
        showingRequestRequired: false,
        lastRequestSentByUserId: user.id,
      });

      const newTourStops = tourStops.map(ts =>
        ts.id === tourStop.id ? { ...ts, requestSent: true, showingRequestRequired: false, status: 'approved' } : ts
      );

      setTourStops(newTourStops);

      await sendMessage({ message: 'This time has been approved.', isApproval: true });

      navigation.goBack(null);
    } catch (error) {
      console.log('Error approving time: ', error);
    }
  };

  const promptRemoveFromTour = async () => {
    Alert.alert(
      'Remove Home from Tour',
      'This will remove this home from the tour. Are you sure you want to continue?',
      [
        {
          text: 'Continue',
          onPress: () => removeFromTour(tourStop),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const removeFromTour = async tourStopToRemove => {
    try {
      await tourService.mutations.deleteTourStop(tourStopToRemove.id);

      const newTourStops = tourService.queries.listTourStops(tourStopToRemove.tourId);

      setTourStops(newTourStops);
      navigation.navigate('TourDetails');
    } catch (error) {
      console.warn('Error deleting tour stop from tour: ', error);
    }
  };

  const checkStopTimes = startTime => {
    let isChronological = true;
    let hasOverlap = false;

    const orderedStops = tourStops.sort((a, b) => a.order - b.order);

    for (let i = 0; i < orderedStops.length; i++) {
      const currentStop = orderedStops[i];

      if (i !== 0) {
        const prevStop = orderedStops[i - 1];

        if (
          isChronological &&
          prevStop &&
          currentStop &&
          ((prevStop.startTime && prevStop.duration) || prevStop.id === tourStop.id) &&
          ((currentStop.startTime && currentStop.duration) || currentStop.id === tourStop.id)
        ) {
          const prevStopStart = prevStop.id === tourStop.id ? startTime : prevStop.startTime;
          const currentStopDeparture =
            currentStop.id === tourStop.id
              ? startTime + hoursToSeconds(currentStop.duration)
              : currentStop.startTime + hoursToSeconds(currentStop.duration);

          const prevStopOutOfOrder = prevStopStart >= currentStopDeparture;

          if (prevStopOutOfOrder) {
            isChronological = false;
          }
        }
      }

      if (!hasOverlap) {
        for (let j = 0; j < orderedStops.length; j++) {
          if (i !== j) {
            const stop = orderedStops[j];

            if (
              stop &&
              currentStop &&
              ((stop.startTime && stop.duration) || stop.id === tourStop.id) &&
              ((currentStop.startTime && currentStop.duration) || currentStop.id === tourStop.id)
            ) {
              const stopStart = stop.id === tourStop.id ? startTime : stop.startTime;
              const stopEnd = stopStart + hoursToSeconds(stop.duration);

              const currentStopStart = currentStop.id === tourStop.id ? startTime : currentStop.startTime;
              const currentStopEnd = currentStopStart + hoursToSeconds(currentStop.duration);

              if (
                (stopStart > currentStopStart && stopStart < currentStopEnd) ||
                (stopEnd < currentStopEnd && stopEnd > currentStopStart) ||
                (stopStart <= currentStopStart && stopEnd >= currentStopEnd)
              ) {
                hasOverlap = true;
              }
            }
          }
        }
      }
    }

    return { isChronological, hasOverlap };
  };

  const promptNewArrivalTime = () => {
    const newStartTime = parseInt(showingDateTime.getTime() / 1000);
    const { isChronological, hasOverlap } = checkStopTimes(newStartTime, tourStop.duration);

    if (hasOverlap) {
      Alert.alert(
        'Showing Time Conflict',
        'The new showing time overlaps with another showing on the tour. To continue with this showing time you must first review your route order. \n\nDo you wish to continue?',
        [
          {
            text: 'Continue Anyway',
            style: 'default',
            onPress: () => reOrderTourStops(showingDateTime, true),
          },
          {
            text: 'Review Tour Schedule',
            style: 'default',
            onPress: () => navigation.navigate('NewTourHomeOrder'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else if (!isChronological) {
      Alert.alert(
        'Showing Time Conflict',
        'The new showing time causes your tour to be out of order. To continue with this showing time you must first review your route order. \n\nDo you wish to continue?',
        [
          {
            text: 'Continue Anyway',
            style: 'default',
            onPress: () => reOrderTourStops(showingDateTime, true),
          },
          {
            text: 'Review Tour Schedule',
            style: 'default',
            onPress: () => navigation.navigate('NewTourHomeOrder'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      setNewArrivalTime();
    }
  };

  const getTourStartEndTime = newTourStops => {
    let tourStartTime = new Date();
    let tourEndTime = new Date(parseInt(tour.startTime) * 1000);

    newTourStops
      .sort((a, b) => a.order > b.order)
      .map((stop, idx, arr) => {
        const durationSeconds = parseFloat(stop.duration) * 60 * 60;
        const stopTime = new Date(parseInt(stop.startTime + parseInt(durationSeconds)) * 1000);

        if (stopTime > tourEndTime) {
          tourEndTime = stopTime;
        }
        tourStartTime = new Date(parseInt(arr[0].startTime) * 1000);

        return null;
      });

    return { tourStartTime, tourEndTime };
  };

  const onApproveSuggestedTime = async newTime => {
    setIsLoading(true);
    const suggestedTime = new Date(newTime);
    const timeStr = dateformat(suggestedTime.getTime(), 'h:MMtt');
    const newTimeMessage = `Showing time changed to ${timeStr}`;

    try {
      const updatedTourStopTime = {
        id: tourStop.id,
        order: tourStop.order,
        duration: tourStop.duration,
        startTime: parseInt(suggestedTime.getTime() / 1000),
      };

      if (tourStop.showingRequestRequired) {
        updatedTourStopTime.showingRequestRequired = true;
      }

      await tourService.mutations.updateTourStop(updatedTourStopTime);

      const updatedTourStop = {
        id: tourStop.id,
        status: 'approved',
        requestSent: true,
        showingRequestRequired: false,
        lastRequestSentByUserId: user.id,
      };

      await tourService.mutations.updateTourStopRequestStatus(updatedTourStop);

      const newTourStops = tourStops.map(ts =>
        ts.id === tourStop.id
          ? {
              ...ts,
              status: 'approved',
              startTime: parseInt(suggestedTime.getTime() / 1000),
              requestSent: true,
              showingRequestRequired: false,
            }
          : ts
      );

      setTourStops(newTourStops);

      await sendMessage({ message: newTimeMessage, isApproval: true });

      updateTourDetail(newTourStops);
      setIsLoading(false);

      navigation.goBack(null);
    } catch (error) {
      console.log('Error approving suggested time: ', error);
      setIsLoading(false);
    }
  };

  const updateTourDetail = async newTourStops => {
    const { tourStartTime, tourEndTime } = getTourStartEndTime(newTourStops);
    const endTime = new Date(tourEndTime);
    const startTime = new Date(tourStartTime);
    const newTourEndTime = parseInt(endTime.getTime() / 1000);
    const newTourStartTime = parseInt(startTime.getTime() / 1000);
    const updatedTour = { ...tour, endTime: newTourEndTime, startTime: newTourStartTime };

    await tourService.mutations.updateTour({ id: tour.id, endTime: newTourEndTime, startTime: newTourStartTime });

    setTour(updatedTour);
  };

  const setNewArrivalTime = async () => {
    setIsLoading(true);
    const timeStr = dateformat(showingDateTime, 'h:MMtt');
    const msgDateStr = dateformat(new Date(), 'mm/dd/yy');
    const msgTimeStr = dateformat(new Date(), 'h:MMtt');
    const startDate = new Date(parseInt(tourStop.startTime) * 1000);
    const showingDate = dateformat(startDate, 'mm/dd/yy');
    const endTime = dateformat(
      new Date(parseInt(showingDateTime.getTime() / 1000 + hoursToSeconds(tourStop.duration)) * 1000),
      'h:MMtt'
    );
    // const newTimeMessage = `Showing time changed to ${timeStr}`;
    const newTimeMessage = `Showing request sent on ${msgDateStr} at ${msgTimeStr} for ${showingDate} from ${timeStr}-${endTime}`;

    const updatedTourStop = {
      id: tourStop.id,
      status: 'timeSuggested',
      lastRequestSentByUserId: user.id,
      startTime: parseInt(showingDateTime.getTime() / 1000),
    };

    await tourService.mutations.updateTourStopRequestStatus(updatedTourStop);

    const newTourStops = tourStops.map(ts =>
      ts.id === tourStop.id
        ? { ...ts, status: 'timeSuggested', startTime: parseInt(showingDateTime.getTime() / 1000) }
        : ts
    );

    setTourStop({ ...tourStop, ...updatedTourStop });
    setTourStops(newTourStops);
    sendMessage({ message: newTimeMessage, isNewTime: true });
    setIsLoading(false);
    navigation.goBack(null);
  };

  const sendMessage = async ({ message, isComment, isNewTime, isApproval }) => {
    try {
      await messageService.mutations.createMessage(
        snakeKeys({
          fromUser: user.id,
          toUser: tourStop.propertyOfInterest.propertyListing.listingAgentId,
          message,
          tourStopId: tourStop.id,
        })
      );

      notifyUser({
        comment: isComment ? message : null,
        isApproval,
        isNewTime,
      });
    } catch (error) {
      console.warn('Error sending message: ', error);
    }
  };

  const sendCustomMessage = async () => {
    await tourService.mutations.updateTourStopRequestStatus({
      id: tourStop.id,
      status: 'newMessage',
      lastRequestSentByUserId: user.id,
    });

    const newTourStops = tourStops.map(ts => (ts.id === tourStop.id ? { ...ts, status: 'newMessage' } : ts));

    setTourStops(newTourStops);
    sendMessage({ message: customMessage, isComment: true });
  };

  const handleSelectedResponse = response => {
    if (response === 'Set New Arrival Time') {
      setOpenTimePicker(true);
      setOpenCustomMessage(false);
    } else if (response === 'Send Custom Message') {
      setOpenCustomMessage(true);
      setOpenTimePicker(false);
    } else {
      setOpenTimePicker(false);
      setOpenCustomMessage(false);
    }

    setSelectedResponse(response);
  };

  const ValidatedAvailableTime = (availableListings, startedTime, endedTime) => {
    let isValid = false;

    if (availableListings.length === 0) {
      isValid = true;

      return isValid;
    }

    for (let i = 0; i < availableListings.length; i++) {
      // selected start time and end time inside available time slot range
      const { startTime, endDatetime } = availableListings[i];

      if (
        Math.floor(startedTime) >= Math.floor(startTime) &&
        Math.floor(startedTime) <= Math.floor(endDatetime) &&
        Math.floor(endedTime) >= Math.floor(startTime) &&
        Math.floor(endedTime) <= Math.floor(endDatetime)
      ) {
        isValid = true;
        break;
      } else {
        isValid = false;
      }
    }

    return isValid;
  };

  const updateTimeOnTourStop = async () => {
    setIsLoading(true);
    const {
      startTime,
      duration,
      propertyOfInterest: {
        propertyListing: { id, listingId },
      },
    } = tourStop;

    const startedDate = showingDateTime.getTime() / 1000;
    const endedDate =
      new Date(showingDateTime).setTime(showingDateTime.setSeconds(0) + duration * 60 * 60 * 1000) / 1000;

    const listings = await calendarService.queries.getTourStopIfExists({
      propertyListingId: id,
      startTime: startedDate,
      endTime: endedDate,
    });

    const paramsStartTime = new Date(startTime * 1000).setHours(0, 0, 0) / 1000;
    const paramsEndTime = new Date(startTime * 1000).setHours(23, 59, 59) / 1000;
    const params = {
      listing_id: listingId,
    };

    if (startTime) {
      params.start_time = paramsStartTime;
      params.end_datetime = paramsEndTime;
    }

    const Listings = await calendarService.queries.agentTimeSlotDetails(params);
    const availableListings = Listings.filter(list => list.status === 'available').sort(
      (a, b) => parseInt(a.startTime) - parseInt(b.startTime)
    );

    setIsLoading(false);
    if (listings.length === 0) {
      if (ValidatedAvailableTime(availableListings, startedDate, endedDate)) {
        promptNewArrivalTime();
        setOpenTimePicker(false);
        setSelectedResponse('Self-Approve Time');
      } else {
        Alert.alert(
          'Time Requested Not Available',
          'Please check the calendar to see available times or call the Listing Agent.',
          [
            {
              text: 'Ok',
              onPress: () => {},
            },
          ]
        );
      }
    } else {
      Alert.alert('Slot already been taken', 'Please select another time slot.', [
        {
          text: 'Ok',
          onPress: () => {},
        },
      ]);
    }
  };

  const handleResponse = async () => {
    if (selectedResponse === 'Self-Approve Time') {
      onSelfApprovePress();
    }
    if (selectedResponse === 'Set New Arrival Time') {
      updateTimeOnTourStop();
    }
    if (selectedResponse === 'Send Custom Message') {
      sendCustomMessage();
      setOpenCustomMessage(false);
      setSelectedResponse('Self-Approve Time');
      setCustomMessage('');
    }
    if (selectedResponse === 'Remove From Tour') {
      promptRemoveFromTour();
    }
  };

  const parseDaytime = time => {
    let [hours, minutes] = time
      .substr(0, time.length - 2)
      .split(':')
      .map(Number);

    if (time.includes('pm') && hours !== 12) hours += 12;
    if (time.includes('am') && hours === 12) hours = 0;

    return 1000 /* ms */ * 60 /* s */ * (hours * 60 + minutes);
  };

  const reOrderTourStops = async (newTime, isNewTimeSuggested) => {
    setIsLoading(true);
    const suggestedTime = new Date(newTime).getTime() / 1000;
    const timeStr = dateformat(suggestedTime * 1000, 'h:MMtt');
    const msgDateStr = dateformat(new Date(), 'mm/dd/yy');
    const msgTimeStr = dateformat(new Date(), 'h:MMtt');
    const startDate = new Date(parseInt(tourStop.startTime) * 1000);
    const showingDate = dateformat(startDate, 'mm/dd/yy');
    const endTime = dateformat(new Date(parseInt(suggestedTime + hoursToSeconds(tourStop.duration)) * 1000), 'h:MMtt');
    const newTimeMessage = isNewTimeSuggested
      ? `Showing request sent on ${msgDateStr} at ${msgTimeStr} for ${showingDate} from ${timeStr}-${endTime}`
      : `Showing time changed to ${timeStr}`;
    const updateTourStops = tourStops.map(ts => (ts.id === tourStop.id ? { ...ts, startTime: suggestedTime } : ts));

    try {
      let updatedOrder = [];

      updatedOrder = updateTourStops.sort((a, b) => a.startTime >= b.startTime);

      let newTourStops = updatedOrder.map((tStop, idx) => ({
        ...tStop,
        order: idx + 1,
      }));

      newTourStops = await updateDurationOnTourStops(newTourStops);
      newTourStops = await calculateDriveTimes(newTourStops);

      await Promise.all(
        newTourStops.map(ts => {
          const updatedTourStop = {
            id: ts.id,
            order: ts.order,
            duration: ts.duration,
            startTime: ts.startTime,
          };

          if (ts.showingRequestRequired) {
            updatedTourStop.showingRequestRequired = true;
          }

          return tourService.mutations.updateTourStop(updatedTourStop);
        })
      );

      let updatedTourStopStatus = {};

      if (isNewTimeSuggested) {
        updatedTourStopStatus = {
          id: tourStop.id,
          status: 'timeSuggested',
          lastRequestSentByUserId: user.id,
          startTime: suggestedTime,
        };
      } else {
        updatedTourStopStatus = {
          id: tourStop.id,
          status: 'approved',
          requestSent: true,
          showingRequestRequired: false,
          lastRequestSentByUserId: user.id,
        };
      }

      await tourService.mutations.updateTourStopRequestStatus(updatedTourStopStatus);

      const updatedStatus = newTourStops.map(ts =>
        ts.id === tourStop.id
          ? {
              ...ts,
              status: isNewTimeSuggested ? 'timeSuggested' : 'approved',
              startTime: isNewTimeSuggested ? suggestedTime : ts.startTime,
            }
          : ts
      );

      setTourStops(updatedStatus);
      updateTourDetail(updatedStatus);
      await sendMessage({ message: newTimeMessage, isApproval: true });
      setIsLoading(false);
      navigation.goBack(null);
    } catch (error) {
      setIsLoading(false);
      console.log('Error updating tour stop status', error);
    }
  };

  const updateDurationOnTourStops = async newTourStops => {
    let isMatch = false;
    let isOverlap = false;
    let index = 0;

    for (let i = 0; i < newTourStops.length; i++) {
      if (i > 0) {
        const currTourStartTime = newTourStops[i].startTime;
        const nextTourStartTime = newTourStops.length > i + 1 ? newTourStops[i + 1].startTime : null;

        if (currTourStartTime === nextTourStartTime) {
          isOverlap = true;
          if (index === 0) {
            index = i - 1;
          }
          isMatch = true;
          const {
            propertyOfInterest: {
              propertyListing: { address, city, state, zip },
            },
          } = newTourStops[index];
          const previousAddress = `${address.includes(',') ? address.split(',')[0] : address}+${city}+${state}+${zip}`;

          const {
            propertyOfInterest: {
              propertyListing: { address: currAddress, city: currCity, state: currState, zip: currZip },
            },
          } = newTourStops[i];

          const thisAddress = `${
            currAddress.includes(',') ? currAddress.split(',')[0] : currAddress
          }+${currCity}+${currState}+${currZip}`;

          const duration = await calculateDistance(previousAddress, thisAddress);

          newTourStops[i].estDriveDuration = duration.durationValue;
          newTourStops[i].estDriveStr = duration.durationText;
        } else if (isMatch) {
          isMatch = false;
          const {
            propertyOfInterest: {
              propertyListing: { address, city, state, zip },
            },
          } = newTourStops[index];
          const previousAddress = `${address.includes(',') ? address.split(',')[0] : address}+${city}+${state}+${zip}`;

          const {
            propertyOfInterest: {
              propertyListing: { address: currAddress, city: currCity, state: currState, zip: currZip },
            },
          } = newTourStops[i];

          const thisAddress = `${
            currAddress.includes(',') ? currAddress.split(',')[0] : currAddress
          }+${currCity}+${currState}+${currZip}`;

          const duration = await calculateDistance(previousAddress, thisAddress);

          newTourStops[i].estDriveDuration = duration.durationValue;
          newTourStops[i].estDriveStr = duration.durationText;
          if (index !== 0) {
            index = 0;
          }
        } else {
          const {
            propertyOfInterest: {
              propertyListing: { address, city, state, zip },
            },
          } = newTourStops[i - 1];
          const previousAddress = `${address.includes(',') ? address.split(',')[0] : address}+${city}+${state}+${zip}`;

          const {
            propertyOfInterest: {
              propertyListing: { address: currAddress, city: currCity, state: currState, zip: currZip },
            },
          } = newTourStops[i];

          const thisAddress = `${
            currAddress.includes(',') ? currAddress.split(',')[0] : currAddress
          }+${currCity}+${currState}+${currZip}`;

          const duration = await calculateDistance(previousAddress, thisAddress);

          newTourStops[i].estDriveDuration = duration.durationValue;
          newTourStops[i].estDriveStr = duration.durationText;
        }
      } else {
        newTourStops[i].estDriveDuration = 0;
        newTourStops[i].estDriveStr = 'Start Here';
      }
    }
    let updatedOrder = [];

    updatedOrder = isOverlap
      ? newTourStops.sort((a, b) => {
          if (a.startTime === b.startTime) {
            return a.estDriveDuration >= b.estDriveDuration;
          }

          return a.startTime >= b.startTime;
        })
      : newTourStops;

    const updatedTourStops = updatedOrder.map((tStop, idx) => ({
      ...tStop,
      order: idx + 1,
    }));

    return updatedTourStops;
  };

  const calculateDriveTimes = async calcTourStops => {
    try {
      let previousAddress = tour.addressStr || false;

      const newTourStops = [];

      for (const ts of calcTourStops.sort((a, b) => a.order > b.order)) {
        const newTourStop = { ...ts };

        const {
          propertyOfInterest: {
            propertyListing: { address, city, state, zip },
          },
        } = ts;

        const thisAddress = `${address.includes(',') ? address.split(',')[0] : address}+${city}+${state}+${zip}`;

        if (previousAddress) {
          const { durationValue, durationText } = await calculateDistance(previousAddress, thisAddress);

          newTourStop.estDriveDuration = durationValue;
          newTourStop.estDriveStr = durationText;
        } else {
          newTourStop.estDriveDuration = 0;
          newTourStop.estDriveStr = 'Start Here';
        }

        previousAddress = thisAddress;
        newTourStops.push(newTourStop);
      }

      return newTourStops;
    } catch (error) {
      console.warn('Error calculating tour times: ', error);
    }
  };

  const calculateDistance = async (previousAddress, thisAddress) => {
    if (previousAddress) {
      const url = encodeURI(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${previousAddress}&destination=${thisAddress}&sensor=false&language=en&avoid=highways&avoid=tolls&units=imperial&key=AIzaSyCgZhx2MuTbG_uK1wat7Ml2Cx6y37JMgiA`
      );

      const { value: durationValue, text: durationText } = await fetch(url)
        .then(response => response.json())
        .then(
          ({
            routes: [
              {
                legs: [{ duration = {} }],
              },
            ],
          }) => duration || {}
        );

      return { durationValue, durationText };
    }

    return { durationValue: 0, durationText: 'Start Here' };
  };

  const promptApproveSuggestedTime = message => {
    const timeFromMessage = message.slice(-7);
    const newTime = new Date(+new Date(showingDateTime).setHours(0, 0, 0) + parseDaytime(timeFromMessage)).getTime();

    setShowingDateTime(newTime);
    const newStartTime = parseInt(newTime / 1000);
    const { isChronological, hasOverlap } = checkStopTimes(newStartTime, tourStop.duration);

    if (hasOverlap) {
      Alert.alert(
        'Showing Time Conflict',
        'The new showing time overlaps with another showing on the tour. To continue with this showing time you must first review your route order.',
        [
          {
            text: 'Continue Anyway',
            style: 'default',
            onPress: () => reOrderTourStops(newTime, false),
          },
          {
            text: 'Review Tour Schedule',
            style: 'default',
            onPress: () => navigation.navigate('NewTourHomeOrder'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else if (!isChronological) {
      Alert.alert(
        'Showing Time Conflict',
        'The new showing time causes your tour to be out of order. To continue with this showing time you must first review your route order. \n\nDo you wish to continue? \n\n Continuing will automatically reoder your route.',
        [
          {
            text: 'Continue Anyway',
            style: 'default',
            onPress: () => reOrderTourStops(newTime, false),
          },
          {
            text: 'Review Tour Schedule',
            style: 'default',
            onPress: () => navigation.navigate('NewTourHomeOrder'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      onApproveSuggestedTime(newTime);
    }
  };

  const getPropertyListingAddress = () => {
    if (tourStop && tourStop.propertyOfInterest && tourStop.propertyOfInterest.propertyListing) {
      return tourStop.propertyOfInterest.propertyListing.address.includes(',')
        ? tourStop.propertyOfInterest.propertyListing.address.split(',')[0]
        : tourStop.propertyOfInterest.propertyListing.address;
    }

    return 'Address Not Available';
  };

  const getListingAgent = () => {
    if (
      tourStop &&
      tourStop.propertyOfInterest &&
      tourStop.propertyOfInterest.propertyListing &&
      tourStop.propertyOfInterest.propertyListing.listingAgent
    ) {
      const { listingAgent } = tourStop.propertyOfInterest.propertyListing;

      return `${listingAgent.firstName} ${listingAgent.lastName}`;
    }

    return 'Listing Agent Not Available';
  };

  const onCalenderPress = () => {
    setShowCalendarModal(true);
    getShowings();
  };

  const renderCalendarView = () => {
    const { startTime } = tourStop;
    const tourMonth = dateformat(startTime ? startTime * 1000 : new Date(), 'mmmm', true);
    const tourDate = startTime ? new Date(startTime * 1000) : new Date();

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

  if (error) {
    return (
      <>
        <NavigationEvents
          onWillFocus={() =>
            setNavigationParams({
              headerTitle: 'Tour Details',
              showBackBtn: true,
              showSettingsBtn: true,
              backRoute: 'TourDetails',
            })
          }
          onDidFocus={() => {
            setNavigationParams({
              headerTitle: 'Tour Details',
              showBackBtn: true,
              showSettingsBtn: true,
              backRoute: isFromScreen === 'TourConfirmScreen' ? null : 'TourDetails',
            });
          }}
        />
        <View style={[tw.flex1, tw.wFull, tw.flexCol, tw.justifyCenter, tw.itemsCenter]}>
          <BodyText style={[tw.textCenter, tw.textRed500]}>{error}</BodyText>
        </View>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <NavigationEvents
          onWillFocus={() =>
            setNavigationParams({
              headerTitle: 'Tour Details',
              showBackBtn: true,
              showSettingsBtn: true,
              backRoute: 'TourDetails',
            })
          }
          onDidFocus={() => {
            setNavigationParams({
              headerTitle: 'Tour Details',
              showBackBtn: true,
              showSettingsBtn: true,
              backRoute: isFromScreen === 'TourConfirmScreen' ? null : 'TourDetails',
            });
          }}
        />
        <FlexLoader />
      </>
    );
  }

  let tourDateTimeStr = dateformat(new Date(tour.startTime * 1000), 'm/d/yyyy h:MMtt');

  if (tour.endTime) {
    const endTimeStr = dateformat(new Date(tour.endTime * 1000), 'h:MMtt');

    tourDateTimeStr += `-${endTimeStr}`;
  }

  const arriveTime = tourStop.startTime;
  const leaveTime = arriveTime + hoursToSeconds(tourStop.duration);
  const tourStopTimeStr = tourStop.startTime
    ? `${dateformat(arriveTime * 1000, 'h:MMtt')} - ${dateformat(new Date(leaveTime * 1000), 'h:MMtt')}`
    : 'Showing Time Not Selected';

  return (
    <View style={[tw.flexCol, tw.flex1]}>
      <KeyboardAwareScrollView
        onContentSizeChange={() => scroll.current && scroll.current.scrollToEnd({ animated: true })}
        contentContainerStyle={[tw.bgPrimary, tw.pY6]}
        style={[tw.bgPrimary]}
        ref={scroll}
      >
        <View style={[tw.w5_6, tw.selfCenter, tw.pB12]}>
          <BodyText md bold style={[tw.textGray700]}>
            {tour && tour.client ? `${tour.client.firstName} ${tour.client.lastName}` : `Client Not Available`}
          </BodyText>
          <BodyText style={[tw.mY1]} md italic>
            {tour.name}
          </BodyText>
          <BodyText md>{tourDateTimeStr}</BodyText>
        </View>

        <View style={[tw.flexCol, tw.pB4, tw.pX6]}>
          <View style={[tw.flexRow]}>
            <View style={[tw.justifyCenter]}>
              <StatusIcon status={tourStop.showingRequestRequired ? 'pending' : tourStop.status} small />
            </View>
            <View style={[tw.flexCol, tw.justifyCenter, tw.flex1]}>
              <BodyText md semibold style={[tw.textBlue500]}>
                {tourStopTimeStr}
              </BodyText>
              <BodyText style={[tw.mY2]} md>
                {getPropertyListingAddress()}
              </BodyText>
              <View style={[tw.flexRow]}>
                <BodyText md italic>
                  Seller's Agent:
                </BodyText>
                <BodyText md italic style={[tw.mL1]}>
                  {getListingAgent()}
                </BodyText>
              </View>
            </View>
            {!(tour.status !== 'complete' && (!tourStop.startTime || !tourStop.requestSent)) && (
              <TouchableOpacity onPress={() => onCalenderPress()} style={[tw.p1, tw.selfEnd, tw.mS1]}>
                <ShowingsIconOutline width={22} height={22} fill={color.black} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[tw.flexCol, tw.mT6, tw.mX4]}>
            {tourStop && tourStop.id && !tourStop.showingRequestRequired && (
              <ConnectedTourStopMessages
                user={user}
                tourStopId={tourStop.id}
                messages={tourMessages}
                setMessages={setTourMessages}
                isFromScreen={isFromScreen}
                onApproveSuggestedTime={message => promptApproveSuggestedTime(message)}
                isLoading={isLoading}
              />
            )}
          </View>

          {tour.status === 'complete' && tourStop.comments ? (
            <View style={[tw.flexRow, tw.wFull, tw.mY2, tw.mX6]}>
              <CompassIcon width={20} height={20} fill={color.blue500} />
              <BodyText italic style={[tw.mL4]}>
                {tourStop.comments}
              </BodyText>
            </View>
          ) : null}

          {tour.status === 'complete' && (
            <View style={[tw.flexRow, tw.mY2, tw.mX6, tw.wFull]}>
              <CompassIcon width={20} height={20} fill={color.blue500} />
              <BodyText italic style={[tw.mL4]}>
                {tourStop.clientInterested === 'yes' ? 'Client is interested' : 'Client is not interested'}
              </BodyText>
            </View>
          )}

          {isFromScreen === 'TourConfirmScreen' ? (
            <PrimaryButton
              loading={isLoading}
              onPress={onSelfApprovePress}
              title="SELF-APPROVE TIME"
              style={[tw.bgBlue500, tw.wFull]}
              loadingTitle="UPDATING"
            />
          ) : (
            <>
              {tour.status !== 'complete' && (!tourStop.startTime || !tourStop.requestSent) && (
                <View style={[[tw.flexRow]]}>
                  <View
                    style={[
                      tw.justifyCenter,
                      tw.itemsCenter,
                      tw.h8,
                      tw.w8,
                      tw.roundedFull,
                      tw.borderRed500,
                      tw.border2,
                      tw.mR4,
                      tw.mT2,
                    ]}
                  >
                    <BodyText style={[tw.textXl, tw.textRed500]} bold>
                      !
                    </BodyText>
                  </View>
                  <View style={[tw.flex1, tw.flexShrink, tw.flexGrow]}>
                    <BodyText>
                      Please set a showing time and submit the showing requests for this tour before taking action on
                      this showing.
                    </BodyText>
                  </View>
                </View>
              )}

              {tour.status !== 'complete' && tourStop.startTime && tourStop.requestSent && (
                <ScrollView style={[tw.pX2, tw.mT2]}>
                  <View style={[tw.wFull, tw.pX2]}>
                    <BodyText style={[tw.mB1, tw.mL2]}>Select a Response</BodyText>

                    <DropdownInput
                      beforeOpen={() => scroll.current.scrollToEnd(false)}
                      options={[
                        { value: 'Self-Approve Time' },
                        { value: 'Set New Arrival Time' },
                        { value: 'Send Custom Message' },
                        { value: 'Remove From Tour' },
                      ]}
                      value={selectedResponse}
                      onSelect={selection => handleSelectedResponse(selection)}
                    />

                    {openTimePicker && (
                      <DatePickerForm
                        onSelectDate={setNewArrivalTime}
                        date={showingDateTime}
                        setDate={setShowingDateTime}
                      />
                    )}

                    {openCustomMessage && (
                      <CustomMessageForm
                        customMessage={customMessage}
                        setCustomMessage={setCustomMessage}
                        hideDoneButton
                      />
                    )}
                    <PrimaryButton
                      onPress={handleResponse}
                      title="SUBMIT"
                      style={[tw.bgBlue500, tw.wFull]}
                      loading={isLoading}
                      loadingTitle="UPDATING"
                    />
                  </View>

                  <View style={[tw.h32]} />
                </ScrollView>
              )}
            </>
          )}
        </View>
      </KeyboardAwareScrollView>

      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Tour Details',
            showBackBtn: true,
            showSettingsBtn: true,
            backRoute: 'TourDetails',
          })
        }
        onDidFocus={() => {
          setNavigationParams({
            headerTitle: 'Tour Details',
            showBackBtn: true,
            showSettingsBtn: true,
            backRoute: isFromScreen === 'TourConfirmScreen' ? null : 'TourDetails',
          });
        }}
      />
      {renderCalendarView()}
    </View>
  );
};

export default TourStopDetails;
