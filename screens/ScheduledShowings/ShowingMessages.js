import React, { useContext, useEffect, useState } from 'react';
import { Alert, View, Platform, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import Modal from 'react-native-modal';
import { color, tw } from 'react-native-tailwindcss';
import DateTimePicker from '@react-native-community/datetimepicker';
import dateformat from 'dateformat';
import { ClockIcon } from '../../assets/images';
import { BodyText, PrimaryButton, PrimaryInput, DropdownInput } from '../../components';
import ShowingContext from './ShowingContext';
import ConnectedShowingMessages from './ConnectedShowingMessages';
import {
  buildApproveShowingRequest,
  buildShowingRequestComment,
  buildSuggestAlternateTime,
  buildCancelShowingRequestByListingAgent,
} from '../../notifications/messageBuilder';
import { notificationService, tourService, messageService, calendarService } from '../../services';
import { roundUpToNearest15MinuteInterval } from '../../helpers/dateHelpers';

const DatePickerForm = ({ date, setDate }) => {
  const [showPicker, setShowPicker] = useState(Platform.OS === 'android');
  const [tempTime, setTempTime] = useState(date);

  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    setTempTime(date);
  }, [date]);

  useEffect(() => {
    if (showPicker && Platform.OS === 'android') {
      setShowPicker(false);
    }
  }, [showPicker]);

  const timeStr = date ? dateformat(date, 'mm/dd/yyyy h:MMtt') : '';

  return (
    <View>
      <TouchableOpacity activeOpacity={0.9} style={[tw.wFull, tw.flexCol, tw.mY2]} onPress={() => setShowPicker(true)}>
        <View style={[tw.wFull, tw.flexRow]}>
          <View style={[tw.relative, tw.flex1, tw.borderB, tw.pL2]}>
            <BodyText md style={[tw.mT1]}>
              Proposed Time
            </BodyText>
            <BodyText md style={[tw.textGray700, tw.pY2]}>
              {timeStr || ''}
            </BodyText>
            <ClockIcon
              style={[tw.absolute, tw.right0, tw.bottom0, tw.mR2, tw.mB2]}
              width={20}
              height={20}
              fill={color.gray700}
              stroke={color.gray700}
            />
          </View>
        </View>
      </TouchableOpacity>

      <BodyText style={[tw.mT2, tw.mB4]} md>
        Select a new time and we will send a new authorization request for this showing.
      </BodyText>

      {Platform.OS === 'ios' ? (
        <Modal isVisible={showPicker} onBackdropPress={() => setShowPicker(false)}>
          <View style={[tw.mT2, isDarkMode ? tw.bgGray800 : tw.bgWhite]}>
            <BodyText
              style={[
                tw.text2xl,
                tw.mY2,
                tw.wFull,
                tw.textCenter,
                tw.borderB2,
                tw.borderGray500,
                isDarkMode ? tw.textGray300 : null,
              ]}
            >
              Select Tour Time
            </BodyText>

            <DateTimePicker
              value={tempTime}
              mode="time"
              display="spinner"
              minuteInterval={15}
              onChange={(event, evtTime) => setTempTime(evtTime)}
            />

            <View style={[tw.m4]}>
              <PrimaryButton
                containerStyle={[tw.pX2]}
                title="Confirm Time"
                onPress={() => {
                  setDate(roundUpToNearest15MinuteInterval(tempTime));
                  setShowPicker(false);
                }}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="spinner"
            minuteInterval={15}
            onChange={(event, evtDate) => {
              if (evtDate) {
                const hours = evtDate.getHours();
                const minutes = evtDate.getMinutes();

                let newDate = new Date(date);

                newDate.setHours(hours);
                newDate.setMinutes(minutes);

                newDate = roundUpToNearest15MinuteInterval(newDate);

                setDate(newDate);
              }

              setShowPicker(false);
            }}
          />
        )
      )}
    </View>
  );
};

const CustomMessageForm = ({ sendMessage, navigation, hideDoneButton, customMessage, setCustomMessage }) => (
  <View>
    <View style={[tw.mT4, tw.mB20, tw.pX4, tw.h40, tw.bgPrimary, tw.border, tw.borderGray700]}>
      <PrimaryInput
        style={[tw.textLg, tw.p4, tw.textGray700]}
        placeholder="Enter Message"
        onChangeText={setCustomMessage}
        value={customMessage}
      />
    </View>
    {!hideDoneButton && (
      <PrimaryButton
        title="Done"
        onPress={() => {
          if (customMessage) sendMessage({ message: customMessage, isComment: true });
          setCustomMessage('');
          navigation.goBack(null);
        }}
        style={[tw.bgBlue500]}
      />
    )}
  </View>
);

const ShowingMessages = ({ goback, parentContainer, user }) => {
  const { selectedShowing } = useContext(ShowingContext);
  const [showingMessages, setShowingMessages] = useState();
  const [selectedResponse, setSelectedResponse] = useState('Approve Time');
  const [openTimePicker, setOpenTimePicker] = useState(false);
  const [openCustomMessage, setOpenCustomMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [buttonLoading, setButtonLoading] = useState(false);
  const dateTime = selectedShowing.startTime ? new Date(selectedShowing.startTime * 1000) : new Date();
  const [date, setDate] = useState(dateTime);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    if (selectedShowing.status) {
      setIsApproved(selectedShowing.status === 'approved');
    }
  }, []);

  const notifyUser = async ({ comment, isApproval, isSuggestion }) => {
    try {
      const tourStopStartTime = new Date(selectedShowing.startTime * 1000);
      const dateOfTour = dateformat(tourStopStartTime, 'mm/dd/yy');

      const templateTokens = {
        name: `${user.firstName} ${user.lastName}`,
        brokerage: user.brokerage,
        date: dateOfTour,
        address:
          selectedShowing &&
          selectedShowing.propertyOfInterest &&
          selectedShowing.propertyOfInterest.propertyListing.address.includes(',')
            ? selectedShowing.propertyOfInterest.propertyListing.address.split(',')[0]
            : selectedShowing.propertyOfInterest.propertyListing.address,
      };

      let push = '';
      let sms = '';
      let email = '';

      if (isApproval) {
        const timeRangeStart = dateformat(tourStopStartTime, 'h:MMtt');

        const tourStopEndTime = new Date(
          tourStopStartTime.getTime() + Number.parseFloat(selectedShowing.duration || 0) * 3600000
        );

        const timeRangeEnd = dateformat(tourStopEndTime, 'h:MMtt');

        templateTokens.timeRange = `${timeRangeStart} to ${timeRangeEnd}`;

        ({ push, sms, email } = buildApproveShowingRequest(templateTokens));
      } else if (isSuggestion) {
        ({ push, sms, email } = buildSuggestAlternateTime(templateTokens));
      } else if (comment) {
        templateTokens.message = comment;

        ({ push } = buildShowingRequestComment(templateTokens));
      }

      await notificationService.mutations.createNotification({
        userId: selectedShowing.buyingAgent.id,
        pushMessage: push,
        smsMessage: sms || null,
        email: sms ? email : null,
        routeName: 'TourStopDetails',
        routeParams: { tourStopId: selectedShowing.tourStopId },
        routeKey: selectedShowing.tourStopId,
      });
    } catch (error) {
      console.log('Error sending notification: ', error);
    }
  };

  const promptApproveTime = async () => {
    const {
      propertyOfInterest: {
        propertyListing: { address },
      },
    } = selectedShowing;

    Alert.alert(
      'Approve Time',
      `Are you sure you want to approve this showing for ${address.includes(',') ? address.split(',')[0] : address}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Approve',
          onPress: approveTime,
        },
      ]
    );
  };

  const approveTime = async () => {
    setButtonLoading(true);
    try {
      await tourService.mutations.updateTourStopRequestStatus({
        id: selectedShowing.tourStopId,
        status: 'approved',
        lastRequestSentByUserId: user.id,
      });
      sendMessage({ message: 'This time has been approved.', isApproval: true });
      setIsApproved(true);
    } catch (error) {
      console.warn('Error approving time: ', error);
    }
    setButtonLoading(false);
  };

  const handleDeclineReschedule = () => {
    let indexOfLastRescheduleRequest = 0;
    let indexOfLastBuyingAgentReschedule = 0;

    if (showingMessages) {
      showingMessages.forEach((userMessage, index) => {
        if (
          userMessage.message.includes('New Suggested Time:') ||
          userMessage.message.includes('Showing time changed to ')
        ) {
          if (userMessage.from_user === user.id) {
            indexOfLastBuyingAgentReschedule = index;
          } else {
            indexOfLastRescheduleRequest = index;
          }
        }
      });

      if (indexOfLastRescheduleRequest > indexOfLastBuyingAgentReschedule) {
        return true;
      }

      return false;
    }
  };

  const suggestTime = async () => {
    const msgDateStr = dateformat(new Date(), 'mm/dd/yy');
    const timeStr = dateformat(date, 'h:MMtt');
    const suggestTimeMsg = `New Suggested Time: ${timeStr}`;

    const updatedTourStop = {
      id: selectedShowing.tourStopId,
      status: 'timeSuggested',
      lastRequestSentByUserId: user.id,
    };

    await tourService.mutations.updateTourStopRequestStatus(updatedTourStop);

    if (handleDeclineReschedule()) {
      sendMessage({ message: `Declined on ${msgDateStr}. ${suggestTimeMsg}`, isSuggestion: true });
    } else {
      sendMessage({ message: suggestTimeMsg, isSuggestion: true });
    }
    setButtonLoading(false);
  };

  const sendMessage = async ({ message, isComment, isSuggestion, isApproval }) => {
    try {
      await messageService.mutations.createMessage({
        fromUser: user.id,
        toUser: selectedShowing.buyingAgent.id,
        message,
        tourStopId: selectedShowing.tourStopId,
      });

      notifyUser({
        comment: isComment ? message : null,
        isApproval,
        isSuggestion,
      });
    } catch (error) {
      console.warn('Error sending notification message: ', error);
    }
  };

  const sendCustomMessage = async () => {
    setButtonLoading(true);
    await tourService.mutations.updateTourStopRequestStatus({
      id: selectedShowing.tourStopId,
      status: 'newMessage',
      lastRequestSentByUserId: user.id,
    });

    sendMessage({ message: customMessage, isComment: true });
    setButtonLoading(false);
  };

  const handleSelectedResponse = itemValue => {
    if (itemValue === 'Suggest New Time') {
      setOpenTimePicker(true);
      setOpenCustomMessage(false);
    } else if (itemValue === 'Send Custom Message') {
      setOpenCustomMessage(true);
      setOpenTimePicker(false);
    } else {
      setOpenTimePicker(false);
      setOpenCustomMessage(false);
    }
    setSelectedResponse(itemValue);
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
    setButtonLoading(true);
    const {
      startTime: selectedShowingStartTime,
      duration: selectedShowingDuration,
      propertyOfInterest: {
        propertyListing: { id, listingId },
      },
    } = selectedShowing;

    const startedDate = date.getTime() / 1000;
    const endedDate = new Date(date).setTime(date.setSeconds(0) + selectedShowingDuration * 60 * 60 * 1000) / 1000;

    const listings = await calendarService.queries.getTourStopIfExists({
      propertyListingId: id,
      startTime: startedDate,
      endTime: endedDate,
    });

    const paramsStartTime = new Date(selectedShowingStartTime * 1000).setHours(0, 0, 0) / 1000;
    const paramsEndTime = new Date(selectedShowingStartTime * 1000).setHours(23, 59, 59) / 1000;
    const params = {
      listing_id: listingId,
    };

    if (selectedShowingStartTime) {
      params.start_time = paramsStartTime;
      params.end_datetime = paramsEndTime;
    }

    const Listings = await calendarService.queries.agentTimeSlotDetails(params);
    const availableListings = Listings.filter(list => list.status === 'available').sort(
      (a, b) => parseInt(a.startTime) - parseInt(b.startTime)
    );

    if (listings.length === 0) {
      if (ValidatedAvailableTime(availableListings, startedDate, endedDate)) {
        suggestTime();
        setOpenTimePicker(false);
        setSelectedResponse('');
      } else {
        setButtonLoading(false);
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
      setButtonLoading(false);
      Alert.alert('Slot already been taken', 'Please select another time slot.', [
        {
          text: 'Ok',
          onPress: () => {},
        },
      ]);
    }
  };

  const handleResponse = () => {
    if (selectedResponse === 'Approve Time') {
      promptApproveTime();
    }
    if (selectedResponse === 'Suggest New Time') {
      updateTimeOnTourStop();
    }
    if (selectedResponse === 'Send Custom Message') {
      sendCustomMessage();
      setOpenCustomMessage(false);
      setSelectedResponse('');
      setCustomMessage('');
    }
  };

  const promptCancelShowing = () => {
    Alert.alert('Cancel Showing', 'Are you sure want to cancel showing request?', [
      {
        text: 'Cancel',
        onPress: () => {},
      },
      {
        text: 'Ok',
        onPress: () => onCancelPress(),
      },
    ]);
  };

  const onCancelPress = async () => {
    try {
      const { tourStopId } = selectedShowing;

      await tourService.mutations.deleteTourStop(tourStopId);
      cancelNotification();
      goback();
    } catch (error) {
      console.log('Error cancelling property showing', error);
    }
  };

  const cancelNotification = async () => {
    try {
      const {
        startTime,
        duration,
        buyingAgent: { firstName: BAFirstName, lastName: BALastName },
      } = selectedShowing;
      const tourStopStartTime = new Date(startTime * 1000);
      const dateOfTour = dateformat(tourStopStartTime, 'mm/dd/yy');
      const endTime = parseInt(startTime) + parseInt(duration) * 60 * 60;
      const tourStopEndTime = new Date(endTime * 1000);
      const timeRangeStart = dateformat(tourStopStartTime, 'h:MMtt');
      const timeRangeEnd = dateformat(tourStopEndTime, 'h:MMtt');
      const timeRange = `${timeRangeStart} to ${timeRangeEnd}`;
      const templateTokens = {
        laName: `${user.firstName} ${user.lastName}`,
        timeRange,
        baName: `${BAFirstName} ${BALastName}`,
        date: dateOfTour,
        address:
          selectedShowing &&
          selectedShowing.propertyOfInterest &&
          selectedShowing.propertyOfInterest.propertyListing.address.includes(',')
            ? selectedShowing.propertyOfInterest.propertyListing.address.split(',')[0]
            : selectedShowing.propertyOfInterest.propertyListing.address,
      };
      const { push, sms, email } = buildCancelShowingRequestByListingAgent(templateTokens);

      await notificationService.mutations.createNotification({
        userId: selectedShowing.buyingAgent.id,
        pushMessage: push,
        smsMessage: sms || null,
        email: selectedShowing.buyingAgent.emailAddress ? email : null,
      });
    } catch (error) {
      console.log('Error sending notification to buying agent', error);
    }
  };

  if (!selectedShowing.tourStopId && !selectedShowing.id) {
    return (
      <View>
        <BodyText>loading</BodyText>
      </View>
    );
  }

  return (
    <View style={[tw.w5_6, tw.selfCenter, tw.mT6]}>
      <ScrollView style={[tw.hFull]}>
        <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol]}>
          <ConnectedShowingMessages
            user={user}
            messages={showingMessages}
            setMessages={setShowingMessages}
            tourStopId={selectedShowing.tourStopId}
          />
          {isApproved ? (
            <PrimaryButton title="CANCEL SHOWING" onPress={promptCancelShowing} />
          ) : (
            <View style={[tw.mY8]}>
              <BodyText>Select a Response</BodyText>
              <DropdownInput
                beforeOpen={() => (parentContainer ? parentContainer.scrollToEnd(false) : null)}
                options={[{ value: 'Approve Time' }, { value: 'Suggest New Time' }, { value: 'Send Custom Message' }]}
                value={selectedResponse}
                onSelect={selection => handleSelectedResponse(selection)}
              />
              {openTimePicker && <DatePickerForm date={date} setDate={setDate} />}
              {openCustomMessage && (
                <CustomMessageForm customMessage={customMessage} setCustomMessage={setCustomMessage} hideDoneButton />
              )}
              <PrimaryButton loading={buttonLoading} onPress={handleResponse} title="SUBMIT" loadingTitle="UPDATING" />
            </View>
          )}
          <View style={[tw.h32]} />
        </View>
      </ScrollView>
    </View>
  );
};

export default ShowingMessages;
