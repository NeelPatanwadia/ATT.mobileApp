import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import dateformat from 'dateformat';
import { colors, tw } from 'react-native-tailwindcss';
import { calendarService, messageService, notificationService, tourService } from '../../../services';
import { BodyText, CustomPill, PrimaryButton, SecondaryButton, StatusIcon } from '../../../components';
import TourContext from '../TourContext';
import { buildApproveShowingRequest, buildSendShowingRequest } from '../../../notifications/messageBuilder';
import { hoursToSeconds, snakeKeys } from '../../../helpers';

const NewTourConfirm = ({ navigation, screenProps: { user } }) => {
  const { client, setClient, tour, tours, tourStops, setTourStops, setTours, setTour, setCopiedTourId } = useContext(
    TourContext
  );
  const { name: tourName, startTime = 0 } = tour;
  const [loading, setLoading] = useState();
  const [requestsSending, setRequestsSending] = useState({});
  const [unsuccessfulSendRequests, setUnsuccessfulSendRequests] = useState([]);
  const [selfApproveLoading, setSelfApproveLoading] = useState({});

  useEffect(() => {
    getStops();
  }, []);

  const getStops = async () => {
    try {
      const stops = await tourService.queries.listTourStops(tour.id);
      const stopsWithTimes = await calculateDriveTimes(stops);

      setTourStops(stopsWithTimes);
    } catch (error) {
      console.warn('Error getting tour stops: ', error);
    }
  };

  const calculateDriveTimes = async calcTourStops => {
    try {
      let previousAddress = tour.addressStr || false;

      const newTourStops = [];

      for (const tourStop of calcTourStops.sort((a, b) => a.order > b.order)) {
        const newTourStop = { ...tourStop };

        const {
          propertyOfInterest: {
            propertyListing: { address, city, state, zip },
          },
        } = tourStop;

        const thisAddress = `${address.includes(',') ? address.split(',')[0] : address}+${city}+${state}+${zip}`;

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

  const checkAllShowingRequestSent = () => {
    let allSent = true;

    for (const ts of tourStops) {
      if (ts.showingRequestRequired === true) {
        allSent = false;
        break;
      }
    }

    return allSent;
  };

  const checkAllApproved = () => {
    let allApproved = true;

    for (const ts of tourStops) {
      if (!ts.status) {
        allApproved = false;
        break;
      } else if (ts.status && ts.status === 'pending') {
        allApproved = false;
        break;
      }
    }

    return allApproved;
  };

  const sendShowingRequests = async () => {
    setLoading(true);

    try {
      const newTourEndTime = parseInt(tourEndTime.getTime() / 1000);
      const newTourStartTime = parseInt(tourStartTime.getTime() / 1000);

      await tourService.mutations.updateTour({ id: tour.id, endTime: newTourEndTime, startTime: newTourStartTime });

      const updatedTour = { ...tour, endTime: newTourEndTime };

      setTour(updatedTour);

      const updatedTours = tours.map(t => (t.id === tour.id ? updatedTour : t));

      setTours(updatedTours);

      const unsuccessfulResults = [];
      const updatedTourStops = [];

      for (const ts of tourStops) {
        const sendResult = await sendShowingRequest(ts);

        if (!sendResult.wasSuccessful) {
          console.log('UNSUCCESSFUL RESULT: ', sendResult);
          unsuccessfulResults.push(sendResult.tourStop.id);
        }

        updatedTourStops.push(sendResult.tourStop);
        setClient(client);
      }

      setUnsuccessfulSendRequests(unsuccessfulResults);
      setTourStops(updatedTourStops);
      setRequestsSending({});
      setLoading(false);
      setCopiedTourId(null);
      if (checkAllShowingRequestSent() && checkAllApproved()) {
        Alert.alert(
          'Congratulations!\nAll Approved',
          `All showing requests have been approved. No showing requests will be sent to the Listing Agents.`,
          [
            {
              text: 'Ok',
              onPress: () => navigation.navigate('ScheduledTours', { focus: false }),
              style: 'default',
            },
          ]
        );
      } else if (checkAllShowingRequestSent()) {
        Alert.alert(
          'Congratulations!',
          'All showing requests have already been sent. No new requests will be sent at this time.',
          [
            {
              text: 'Ok',
              onPress: () => navigation.navigate('ScheduledTours', { focus: false }),
              style: 'default',
            },
          ]
        );
      } else if (!unsuccessfulResults.length > 0) {
        congratulationAlert();
      }
    } catch (error) {
      console.warn('Error sending showing requests: ', error);
    }

    setLoading(false);
  };

  const congratulationAlert = () => {
    Alert.alert(
      'Congratulations!',
      `You've just set up your tour.  Now sit back and relax and see the approvals come back`,
      [
        {
          text: 'Ok',
          onPress: () => navigation.navigate('ScheduledTours', { focus: false }),
          style: 'default',
        },
      ]
    );
  };

  const sendShowingRequest = async tourStop => {
    if (tourStop.requestSent && !tourStop.showingRequestRequired) {
      return {
        wasSuccessful: true,
        tourStop,
      };
    }

    if (tourStop.propertyOfInterest.propertyListing.isCustomListing) {
      return {
        wasSuccessful: true,
        tourStop,
      };
    }

    let updatedTourStop = { ...tourStop };
    let wasSuccessful = false;

    try {
      setRequestsSending(prevState => ({ ...prevState, [tourStop.id]: true }));

      const updatedTourStopInput = {
        id: tourStop.id,
        estDriveDuration: tourStop.estDriveDuration,
        estDriveStr: tourStop.estDriveStr,
        status: tourStop.showingRequestRequired ? 'pending' : tourStops.status,
        startTime: tourStop.startTime,
        requestSent: true,
        showingRequestRequired: false,
        lastRequestSentByUserId: user.id,
      };

      await tourService.mutations.updateTourStopRequestStatus(updatedTourStopInput);

      const messageSent = await sendMessage(tourStop);
      const notificationSent = await notifyUser(tourStop);

      updatedTourStop = {
        ...tourStop,
        requestSent: true,
        showingRequestRequired: false,
        lastRequestSentByUserId: user.id,
      };

      wasSuccessful = messageSent && notificationSent;
    } catch (error) {
      console.warn('Error sending showing request: ', error);
    }

    return { wasSuccessful, tourStop: updatedTourStop };
  };

  const notifyUser = async tourStop => {
    try {
      const tourStopStartTime = new Date(tourStop.startTime * 1000);

      const dateOfTour = dateformat(tourStopStartTime, 'mm/dd/yy');
      const timeRangeStart = dateformat(tourStopStartTime, 'h:MMtt');

      const tourStopEndTime = new Date(
        tourStopStartTime.getTime() + Number.parseFloat(tourStop.duration || 0) * 3600000
      );

      const timeRangeEnd = dateformat(tourStopEndTime, 'h:MMtt');

      const {
        propertyOfInterest: { propertyListing },
      } = tourStop;

      const laName = `${propertyListing.listingAgent.firstName} ${propertyListing.listingAgent.lastName}`;

      const { push, sms, email } = buildSendShowingRequest({
        baName: `${user.firstName} ${user.lastName}`,
        laName,
        address: propertyListing.address.includes(',')
          ? propertyListing.address.split(',')[0]
          : propertyListing.address,
        brokerage: `${user.brokerage}`,
        date: dateOfTour,
        phone: user.cellPhone,
        timeRange: `${timeRangeStart} to ${timeRangeEnd}`,
      });

      await notificationService.mutations.createNotification({
        userId: propertyListing.listingAgentId,
        pushMessage: push,
        smsMessage: sms,
        email,
        routeName: 'ShowingDetails',
        routeParams: {
          showingId: tourStop.id,
        },
        routeKey: tourStop.id,
      });

      return true;
    } catch (error) {
      console.log('Error sending showing notification request: ', error);

      return false;
    }
  };

  const sendMessage = async tourStop => {
    try {
      const msgDateStr = dateformat(new Date(), 'mm/dd/yy');
      const msgTimeStr = dateformat(new Date(), 'h:MMtt');
      const startDate = new Date(parseInt(tourStop.startTime) * 1000);
      const showingDate = dateformat(startDate, 'mm/dd/yy');
      const showingTime = dateformat(startDate, 'h:MMtt');

      const endTime = dateformat(
        new Date(parseInt(tourStop.startTime + hoursToSeconds(tourStop.duration)) * 1000),
        'h:MMtt'
      );

      const messageStr = `Showing request sent on ${msgDateStr} at ${msgTimeStr} for ${showingDate} from ${showingTime}-${endTime}`;

      const message = {
        toUser: tourStop.propertyOfInterest.propertyListing.listingAgentId,
        fromUser: user.id,
        message: messageStr,
        tourStopId: tourStop.id,
      };

      await messageService.mutations.createMessage(message);

      return true;
    } catch (error) {
      console.warn('Error sending message: ', error);

      return false;
    }
  };

  const onSelfApprovePress = async tourStop => {
    setSelfApproveLoading(prev => ({ ...prev, [tourStop.id]: true }));
    const {
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

    setSelfApproveLoading(prev => ({ ...prev, [tourStop.id]: false }));
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

  const promptApproveTime = tourStop => {
    Alert.alert(
      'Approve Time',
      'This will confirm the tour appointment on behalf of the listing agent. Are you sure you want to continue?',
      [
        {
          text: 'Continue',
          onPress: () => approveTime(tourStop),
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

  const approveTime = async tourStop => {
    setSelfApproveLoading(prev => ({ ...prev, [tourStop.id]: true }));
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
      try {
        await messageService.mutations.createMessage(
          snakeKeys({
            fromUser: user.id,
            toUser: tourStop.propertyOfInterest.propertyListing.listingAgentId,
            message: 'This time has been approved.',
            tourStopId: tourStop.id,
          })
        );

        await notifyUserselfApproval(tourStop);
      } catch (error) {
        console.log('Error sending message: ', error);
      }
    } catch (error) {
      console.log('Error approving time: ', error);
    }
    setSelfApproveLoading(prev => ({ ...prev, [tourStop.id]: true }));
  };

  const notifyUserselfApproval = async tourStop => {
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
      const timeRangeStart = dateformat(tourStopStartTime, 'h:MMtt');
      const tourStopEndTime = new Date(
        tourStopStartTime.getTime() + Number.parseFloat(tourStop.duration || 0) * 3600000
      );
      const timeRangeEnd = dateformat(tourStopEndTime, 'h:MMtt');

      templateTokens.timeRange = `${timeRangeStart} to ${timeRangeEnd}`;

      const { push, sms, email } = buildApproveShowingRequest(templateTokens);

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

  let tourEndTime = new Date(parseInt(startTime) * 1000);
  let tourStartTime = new Date(parseInt(startTime) * 1000);

  const tourStopCards = tourStops
    .sort((a, b) => a.order > b.order)
    .map((tourStop, idx) => {
      const stopStartTimeStr = dateformat(new Date(parseInt(tourStop.startTime) * 1000), 'h:MMtt');
      const durationSeconds = parseFloat(tourStop.duration) * 60 * 60;
      const estDriveStr = tourStop.estDriveStr ? tourStop.estDriveStr : 'calculating';

      const stopTime = new Date(parseInt(tourStop.startTime + parseInt(durationSeconds)) * 1000);
      const stopStartTime = new Date(parseInt(tourStop.startTime) * 1000);

      if (stopTime > tourEndTime) {
        tourEndTime = stopTime;
      }

      if (stopStartTime < tourStartTime) {
        tourStartTime = stopStartTime;
      }

      const stopEndTimeStr = dateformat(stopTime, 'h:MMtt');

      const durationStr = `${stopStartTimeStr}-${stopEndTimeStr}`;

      return (
        <TourStopCard
          key={`tourStop-${idx}`}
          id={tourStop.id}
          tourStopDetails={tourStop}
          propertyListing={tourStop.propertyOfInterest.propertyListing}
          durationStr={durationStr}
          estDriveStr={estDriveStr}
          requestSent={tourStop.requestSent}
          showingRequestRequired={tourStop.showingRequestRequired}
          selfApproveLoading={selfApproveLoading[tourStop.id]}
          loading={requestsSending[tourStop.id]}
          onSelfApprovePress={() => onSelfApprovePress(tourStop)}
          sendRequestFailed={unsuccessfulSendRequests.find(res => res === tourStop.id)}
          onPress={() =>
            navigation.navigate({
              routeName: 'TourStopDetails',
              params: { tourStopId: tourStop.id, isFrom: 'TourConfirmScreen' },
              key: tourStop.id,
            })
          }
        />
      );
    });

  const tourDateStr = dateformat(startTime * 1000, 'mm/dd/yyyy');
  const startTimeStr = dateformat(tourStartTime, 'h:MMtt');
  const endTimeStr = dateformat(tourEndTime, 'h:MMtt');
  const timeRangeStr = `${startTimeStr}-${endTimeStr}`;
  const clientName = client ? `${client.firstName} ${client.lastName}` : '';

  let finishTitle = 'SEND SHOWING REQUESTS';
  let loadingFinishTitle = 'SENDING REQUESTS';

  if (tourStops && tourStops.length > 0 && unsuccessfulSendRequests.length === 0) {
    if (
      !tourStops.find(
        ts => (ts.showingRequestRequired || !ts.requestSent) && !ts.propertyOfInterest.propertyListing.isCustomListing
      )
    ) {
      finishTitle = 'CONFIRM SCHEDULE';
      loadingFinishTitle = 'SAVING TOUR';
    }
  }

  return (
    <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.pT8]}>
      <View style={[tw.mL1, tw.pX4, tw.pB2, tw.borderB, tw.borderGray300]}>
        <BodyText md style={[tw.textGray700]} lg>{`${clientName}: ${tourName}`}</BodyText>
        <BodyText md bold style={[tw.mY2, tw.mB2]}>
          {tourDateStr} {timeRangeStr}
        </BodyText>
      </View>
      <ScrollView style={[tw.wFull, tw.flex1, tw.mT2]}>
        <BodyText md italic center style={[tw.m4, tw.mT2, tw.selfCenter]}>
          Based on your selections, we have created the following schedule, please confirm or revise and recalculate.
        </BodyText>
        {tourStopCards}
        <View style={[tw.mY2, tw.mX4]}>
          <SecondaryButton
            title="REVISE SCHEDULE"
            onPress={() => navigation.goBack(null)}
            style={[tw.border2, tw.borderBlue500, tw.mB4, tw.mT2]}
            textStyle={[tw.textBlue500]}
          />
          <PrimaryButton
            style={[tw.mT0]}
            title={finishTitle}
            onPress={sendShowingRequests}
            loading={loading}
            loadingTitle={loadingFinishTitle}
            disabled={!!tourStops.find(stop => !stop.startTime)}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const TourStopCard = ({
  onPress,
  style = [],
  durationStr,
  estDriveStr,
  propertyListing: { address, city, state, zip, isCustomListing },
  requestSent,
  showingRequestRequired,
  loading,
  sendRequestFailed,
  tourStopDetails: { status },
  onSelfApprovePress,
  selfApproveLoading,
}) => {
  let iconStatus = 'newMessage';

  if (requestSent && !showingRequestRequired) {
    if (status && status === 'approved') iconStatus = 'approved';
    else iconStatus = 'showingRequestSend';
  }

  if (sendRequestFailed) {
    iconStatus = 'error';
  }

  if (isCustomListing) {
    iconStatus = 'approved';
  }

  return (
    <View>
      {estDriveStr && estDriveStr !== 'Start Here' && (
        <View style={[tw.insetAuto, tw.wFull, tw.h8, tw.bgPrimary, tw.mY1, tw.pX4, tw.flexRow]}>
          <View style={[tw.flex1, tw.flexCol, tw.justifyCenter, tw.mY1]}>
            <BodyText heavy italic style={[tw.textBlue400]}>
              Estimated drive time
            </BodyText>
          </View>
          <View style={[tw.flex1, tw.flexCol, tw.justifyCenter, tw.itemsEnd, tw.mR2, tw.mY1]}>
            <BodyText heavy italic style={[tw.textBlue400]}>
              {estDriveStr}
            </BodyText>
          </View>
        </View>
      )}
      <TouchableOpacity
        disabled
        onPress={onPress}
        style={[tw.shadow, tw.wFull, tw.pY4, tw.bgGray100, tw.mY1, tw.pX4, tw.itemsCenter, ...style]}
      >
        <View style={[tw.flexRow]}>
          <View style={[tw.justifyCenter, tw.itemsCenter]}>
            {loading ? (
              <ActivityIndicator size="small" style={[tw.mR4]} color={colors.gray500} />
            ) : (
              <StatusIcon status={iconStatus} />
            )}
          </View>

          <View style={[tw.flexRow, tw.flex1]}>
            <View style={[tw.flex1, tw.flexCol, tw.justifyCenter, tw.mY1]}>
              <BodyText>{address.includes(',') ? address.split(',')[0] : address}</BodyText>
              <BodyText>{`${city}, ${state} ${zip}`}</BodyText>
              <BodyText>{durationStr}</BodyText>
              {isCustomListing ? <CustomPill containerStyle={[tw.mT2]} /> : null}
            </View>
            {(status && status === 'approved') || isCustomListing ? null : (
              <View style={[tw.justifyCenter, tw.itemsEnd]}>
                <SecondaryButton
                  title="SELF APPROVE"
                  onPress={() => onSelfApprovePress()}
                  loading={selfApproveLoading}
                  disabled={selfApproveLoading}
                  style={[tw.border2, tw.borderBlue500]}
                  textStyle={[tw.textBlue500, tw.textSm, tw.pX2]}
                />
              </View>
            )}
          </View>
        </View>
        {sendRequestFailed ? (
          <BodyText style={[tw.textRed500, tw.mL16, tw.wFull, tw.textLeft, tw.mT1]}>
            Error sending request, try again.
          </BodyText>
        ) : null}
      </TouchableOpacity>
    </View>
  );
};

export default NewTourConfirm;
