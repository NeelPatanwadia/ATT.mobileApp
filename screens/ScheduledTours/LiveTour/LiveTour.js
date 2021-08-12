import React, { useState, useContext, useEffect, useRef } from 'react';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { AsyncStorage, Image, View, TouchableOpacity, Linking, ActivityIndicator, FlatList } from 'react-native';
import { color, colors, tw } from 'react-native-tailwindcss';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as Location from 'expo-location';
import dateFormat from 'dateformat';
import { BodyText, SecondaryButton, CheckboxCircle, PrimaryInput } from '../../../components';
import { chatService, notificationService, propertyService, tourService } from '../../../services';
import { CompassIcon, SentIcon } from '../../../assets/images';
import AgentTabContext from '../../../navigation/AgentTabContext';
import TourContext from '../TourContext';
import Carousel from './Carousel';
import LiveTourStopCard from './LiveTourStopCard';
import {
  buildNextOnTour,
  buildLeftHome,
  buildInterested,
  buildNotInterested,
  buildCustomFeedback,
} from '../../../notifications/messageBuilder';
import { logEvent, EVENT_TYPES, APP_REGIONS } from '../../../helpers/logHelper';
import { AsyncStorageKeys } from '../../../constants/AppConstants';
import ChatMessage from '../../../components/ChatMessage';

const LiveTour = ({
  navigation,
  screenProps: { user, newMessages, setShowListingBatch, setShowBuyingBatch, setNewMessages },
}) => {
  const { tour, tours, setTours, tourStop, setTourStop, tourStops, setTourStops } = useContext(TourContext);
  const { startTime = 0 } = tour;
  const { setNavigationParams } = useContext(AgentTabContext);
  const FlatlistRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [propertyImages, setPropertyImages] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const initInterest = tourStop.clientInterested && tourStop.clientInterested === 'yes';
  const initNotInterest = tourStop.clientInterested && tourStop.clientInterested === 'no';
  const [interested, setInterested] = useState(initInterest);
  const [notInterested, setNotInterested] = useState(initNotInterest);
  const [comments, setComments] = useState(tourStop.comments);
  const [nextLoading, setNextLoading] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [errorMessage, setErrorMessage] = useState();
  const [chatId, setChatId] = useState(null);

  const propListing = tourStop.propertyOfInterest.propertyListing;

  const directionsUrl = `http://maps.apple.com/?daddr=${
    propListing.address.includes(',') ? propListing.address.split(',')[0] : propListing.address
  }+${propListing.city}+${propListing.state}+${propListing.zip}&dirflg=d`;

  const sortedTourStops = tourStops.sort((a, b) => a.order - b.order);
  const foundIndex = sortedTourStops.findIndex(stop => stop.id === tourStop.id);

  const nextStop =
    (foundIndex || foundIndex === 0) && sortedTourStops && sortedTourStops.length > foundIndex + 1
      ? sortedTourStops[foundIndex + 1]
      : null;

  const prevStop = foundIndex && sortedTourStops && sortedTourStops.length > 1 ? sortedTourStops[foundIndex - 1] : null;

  const pageProgress = `${foundIndex + 1}/${tourStops.length}`;
  const messageDisabled = sendingFeedback || !comments;

  useEffect(() => {
    getImages();
    startGeofence();
    getMessages();

    return async () => {
      try {
        await chatService.mutations.chatGetMessages({ chatId, userId: user.id });
      } catch (error) {
        console.log('Error getting message', error);
      }
    };
  }, []);

  useEffect(() => {
    processTourStops();
  }, [tourStops]);

  useEffect(() => {
    if (newMessages.length > 0) {
      updateMessages();
    }
  }, [newMessages.length]);

  const updateMessages = () => {
    const newUnreadMessages = newMessages
      .filter(message => parseInt(message.chatId) === parseInt(chatId))
      .filter(
        message => messages.findIndex(localMsg => parseInt(localMsg.messageId) === parseInt(message.messageId)) === -1
      )
      .sort((a, b) => parseInt(a.sendTime) - parseInt(b.sendTime));

    setMessages([].concat(...newUnreadMessages, ...messages));

    setUnreadMessages();
  };

  const setUnreadMessages = async () => {
    if (!chatId) return null;

    const tempArr = newMessages.filter(value => parseInt(value.chatId) !== parseInt(chatId));

    if (tempArr && tempArr.length > 0) {
      const newListingMessage = tempArr.findIndex(value => value.listingAgentId === user.id);
      const newBuyingMessage = tempArr.findIndex(value => value.buyingAgentId === user.id);

      setShowListingBatch(newListingMessage !== -1);
      setShowBuyingBatch(newBuyingMessage !== -1);
    } else {
      setShowListingBatch(false);
      setShowBuyingBatch(false);
    }
    setNewMessages(tempArr);
  };

  const getMessages = async () => {
    const {
      propertyOfInterest: {
        clientId,
        propertyListingId,
        propertyListing: { listingAgentId },
      },
    } = tourStop;

    try {
      const chatMessages = await chatService.mutations.chatGetMessages({
        buyingAgentId: user.id,
        listingAgentId,
        clientId,
        propertyListingId,
        userId: user.id,
      });

      await chatMessages.sort(() => -1);
      setMessages(chatMessages);
      setChatId(chatMessages[0].chatId);
      setUnreadMessages();
    } catch (error) {
      setChatId(null);
      setMessages([]);
      console.log('Error getting chat messages', error);
    }
  };

  const processTourStops = async () => {
    try {
      const storedTourStops = [...tourStops];

      for (let i = 0; i < storedTourStops.length; i++) {
        storedTourStops[i].buyingAgent = user;
      }

      await AsyncStorage.setItem(AsyncStorageKeys.StoreTourStops, JSON.stringify(storedTourStops));
    } catch (error) {
      console.log('Error setting the stored tour stops for geofencing: ', error);
    }
  };

  const sendFeedback = async () => {
    try {
      if (!interested && !notInterested) {
        return;
      }

      setSendingFeedback(true);

      const {
        propertyOfInterest: { propertyListing },
      } = tourStop;

      const { listingAgent } = propertyListing;

      const laName = `${listingAgent.firstName} ${listingAgent.lastName}`;

      const templateTokens = {
        laName,
        baName: `${user.firstName} ${user.lastName}`,
        brokerage: user.brokerage,
        address: propertyListing.address.includes(',')
          ? propertyListing.address.split(',')[0]
          : propertyListing.address,
        message: null,
      };

      let push = '';
      let sms = '';
      let email = {};

      if (interested) {
        ({ push, sms, email } = buildInterested(templateTokens));
      } else if (notInterested) {
        ({ push, sms, email } = buildNotInterested(templateTokens));
      } else if (comments) {
        ({ push, sms, email } = buildCustomFeedback(templateTokens));
      } else {
        return;
      }

      await notificationService.mutations.createNotification({
        userId: listingAgent.id,
        pushMessage: push,
        smsMessage: sms,
        email,
        routeName: 'ShowingDetails',
        routeParams: {
          showingId: tourStop.id,
        },
        routeKey: tourStop.id,
      });
    } catch (error) {
      logEvent({
        message: `Error sending feedback notification: ${JSON.stringify(error)}`,
        appRegion: APP_REGIONS.NOTIFICATION,
        eventType: EVENT_TYPES.ERROR,
      });
    }

    setSendingFeedback(false);
  };

  const onSendPress = async () => {
    setSendingFeedback(true);
    const {
      startTime: tourStopStartTime,
      propertyOfInterest: {
        client: { id: clientId },
        propertyListingId,
        propertyListing: { listingAgentId },
      },
    } = tourStop;
    const dateStr = dateFormat((tourStopStartTime || 0) * 1000, 'mm/dd/yyyy');

    if (listingAgentId) {
      const messageDetails = {
        message: comments.trim(),
        senderId: user.id,
        receiverId: listingAgentId,
        senderName: `${user.firstName} ${user.lastName}`,
        sendTime: Math.floor(new Date().getTime() / 1000),
      };

      if (chatId) {
        messageDetails.chatId = chatId;
      } else {
        messageDetails.clientId = clientId;
        messageDetails.buyingAgentId = user.id;
        messageDetails.chatTitle = `${user.firstName} ${user.lastName} - ${dateStr}`;
        messageDetails.listingAgentId = listingAgentId;
        messageDetails.propertyListingId = propertyListingId;
      }
      const tempArr = [].concat({ ...messageDetails, isSending: true }, ...messages);

      setComments('');
      setMessages(tempArr);
      if (tempArr.length > 3) FlatlistRef.current.scrollToIndex({ index: 0, viewPosition: 0 });

      try {
        const chat = await chatService.mutations.chatSendMessage(messageDetails);
        const Arr = tempArr.map(message =>
          message.sendTime === messageDetails.sendTime && message.message === messageDetails.message
            ? { ...messageDetails, chatId: chat.chatId, messageId: chat.id }
            : message
        );

        setMessages(Arr);
        setChatId(chat.chatId);
      } catch (error) {
        console.log('Error sending message', error);
        const Arr = tempArr.map(message =>
          message.sendTime === messageDetails.sendTime && message.message === messageDetails.message
            ? { ...messageDetails, error: true }
            : message
        );

        setMessages(Arr);
      }
    }
    setSendingFeedback(false);
  };

  const notifyNextProperty = async nextTourStop => {
    try {
      let upToDateTourStop = { ...nextTourStop };

      try {
        upToDateTourStop = await tourService.queries.getTourStop(nextTourStop.id);
      } catch (error) {
        logEvent({
          message: `Could not fetch latest tour stop data for tourStop: ${nextTourStop.id} proceding with in state data`,
          appRegion: APP_REGIONS.NOTIFICATION,
          eventType: EVENT_TYPES.WARNING,
        });
      }

      if (upToDateTourStop.nextUpSent) {
        logEvent({
          message: `Skipping up next notification for tour stop ${nextTourStop.id} -- notification already sent`,
          appRegion: APP_REGIONS.NOTIFICATION,
          eventType: EVENT_TYPES.INFO,
        });

        return;
      }

      const {
        propertyOfInterest: { propertyListing },
      } = upToDateTourStop;

      const { listingAgent } = await propertyListing;

      const laName = `${listingAgent.firstName} ${listingAgent.lastName}`;

      const templateTokens = {
        laName,
        baName: `${user.firstName} ${user.lastName}`,
        brokerage: user.brokerage,
        address: propertyListing.address.includes(',')
          ? propertyListing.address.split(',')[0]
          : propertyListing.address,
      };

      let upNextNotifcationSent = false;

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

          upNextNotifcationSent = true;
        } catch (error) {
          logEvent({
            message: `Error sending next up notification to listing agent for tour stop ${
              nextTourStop.id
            } -- ${JSON.stringify(error)}`,
            appRegion: APP_REGIONS.NOTIFICATION,
            eventType: EVENT_TYPES.ERROR,
          });
        }
      } else {
        logEvent({
          message: `Skipping up next notification for tour stop ${nextTourStop.id} -- listing agent notifications disabled`,
          appRegion: APP_REGIONS.NOTIFICATION,
          eventType: EVENT_TYPES.INFO,
        });
      }

      if (upToDateTourStop.notifySeller) {
        try {
          const { seller } = propertyListing;

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

            upNextNotifcationSent = true;
          }
        } catch (error) {
          logEvent({
            message: `Error sending next up notification to seller for tour stop ${nextTourStop.id} -- ${JSON.stringify(
              error
            )}`,
            appRegion: APP_REGIONS.NOTIFICATION,
            eventType: EVENT_TYPES.ERROR,
          });
        }
      } else {
        logEvent({
          message: `Skipping up next notification for tour stop ${nextTourStop.id} -- seller notifications disabled`,
          appRegion: APP_REGIONS.NOTIFICATION,
          eventType: EVENT_TYPES.INFO,
        });
      }

      if (upNextNotifcationSent) {
        await tourService.mutations.updateTourStop({
          id: upToDateTourStop.id,
          nextUpSent: true,
          nextUpSentBy: 'Navigate Next',
        });
      }
    } catch (error) {
      logEvent({
        message: `Error sending next up notification for tour stop ${nextTourStop.id} -- ${JSON.stringify(error)}`,
        appRegion: APP_REGIONS.NOTIFICATION,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const notifySellerOfDeparture = async currentTourStop => {
    try {
      let upToDateTourStop = { ...currentTourStop };

      try {
        upToDateTourStop = await tourService.queries.getTourStop(currentTourStop.id);
      } catch (error) {
        logEvent({
          message: `Could not fetch latest tour stop data for tourStop: ${currentTourStop.id} proceding with in state data`,
          appRegion: APP_REGIONS.NOTIFICATION,
          eventType: EVENT_TYPES.WARNING,
        });
      }

      if (upToDateTourStop.haveLeftSent) {
        logEvent({
          message: `Skipping departure notification for tour stop ${currentTourStop.id} -- notification already sent`,
          appRegion: APP_REGIONS.NOTIFICATION,
          eventType: EVENT_TYPES.INFO,
        });

        return;
      }

      const {
        propertyOfInterest: { propertyListing },
      } = upToDateTourStop;

      if (propertyListing.seller && upToDateTourStop.notifySeller) {
        const { seller } = propertyListing;

        const sellerName = `${seller.firstName} ${seller.lastName}`;

        const { push, sms, email } = buildLeftHome({
          sellerName,
          address: propertyListing.address.includes(',')
            ? propertyListing.address.split(',')[0]
            : propertyListing.address,
        });

        await notificationService.mutations.createNotification({
          userId: seller.id,
          pushMessage: push,
          smsMessage: sms,
          email,
        });

        await tourService.mutations.updateTourStop({
          id: upToDateTourStop.id,
          haveLeftSent: true,
          haveLeftSentBy: 'Navigate Next',
        });
      } else {
        logEvent({
          message: `Skipping departure notification for tour stop ${
            currentTourStop.id
          } -- Has Seller: ${!!propertyListing.seller}, Notifications Enabled: ${upToDateTourStop.notifySeller}`,
          appRegion: APP_REGIONS.NOTIFICATION,
          eventType: EVENT_TYPES.INFO,
        });
      }
    } catch (error) {
      logEvent({
        message: `Error sending departure notification to seller on tourStop ${currentTourStop.id}: ${JSON.stringify(
          error
        )}`,
        appRegion: APP_REGIONS.NOTIFICATION,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const startGeofence = async () => {
    const { status } = await Location.requestPermissionsAsync();
    const storeGeoState = await AsyncStorage.getItem(AsyncStorageKeys.StoreGeoState).then(
      resp => JSON.parse(resp) || {}
    );

    await AsyncStorage.setItem(AsyncStorageKeys.StoreGeoState, JSON.stringify(storeGeoState));
    await AsyncStorage.setItem(AsyncStorageKeys.CurrentUser, JSON.stringify(user));

    if (status !== 'granted') {
      logEvent({
        message: `Location Permissions Denied -- Skipping GeoFence Triggers`,
        appRegion: APP_REGIONS.NOTIFICATION,
        eventType: EVENT_TYPES.WARNING,
      });
    } else {
      const fencedRegions = tourStops.map(
        ({
          id,
          propertyOfInterest: {
            propertyListing: { latitude, longitude },
          },
        }) => ({
          identifier: `${id}`,
          latitude,
          longitude,
          radius: 50,
          state: 2,
        })
      );

      Location.startGeofencingAsync('watch_tour_gps', fencedRegions);
    }

    linkToDirections();
  };

  const getImages = async () => {
    try {
      const propertyListingImages = await propertyService.queries.listPropertyListingImages(
        tourStop.propertyOfInterest.propertyListingId
      );

      setPropertyImages(propertyListingImages);

      if (propertyListingImages && propertyListingImages.length > 0) {
        propertyListingImages.map(img => Image.prefetch(img.mediaUrl));
      }

      setImagesLoaded(true);
    } catch (error) {
      console.warn('Error getting customer images: ', error);
    }
  };

  const linkToDirections = () => {
    try {
      Linking.openURL(directionsUrl);
    } catch (error) {
      logEvent({
        message: `Error getting directions for Live Tour ${tour && tour.id ? tour.id : 'UNKNOWN'}: ${JSON.stringify(
          error
        )}`,
        appRegion: APP_REGIONS.LIVE_TOUR,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const liveTourCards = [
    <LiveTourStopCard tourStop={tourStop} nextStop={nextStop} startTime={startTime} />,
    ...propertyImages.map((propertyImage, idx) => (
      <View style={[tw.w48, tw.h48]}>
        <Image key={`propertyImage-${idx}`} style={[tw.wFull, tw.h48]} source={{ uri: propertyImage.mediaUrl }} />
      </View>
    )),
  ];

  const saveTourStop = async () => {
    try {
      const {
        clientInterested: TSClientInterested,
        propertyOfInterest: {
          propertyListing: { isCustomListing },
        },
      } = tourStop;

      if (!isCustomListing && !TSClientInterested) {
        await sendFeedback();
      }

      const clientInterested = interested ? 'yes' : 'no';

      await tourService.mutations.updateTourStop({
        id: tourStop.id,
        clientInterested,
        comments,
      });

      const newTourStops = tourStops.map(ts => (tourStop.id === ts.id ? { ...ts, clientInterested, comments } : ts));

      setTourStops(newTourStops);
    } catch (error) {
      console.warn('Error saving tour stop: ', error);
    }
  };

  const navigateBack = async () => {
    try {
      setNextLoading(true);
      await saveTourStop();

      if (prevStop) {
        try {
          await logEvent({
            message: `Navigating to Previous Tour Stop: ${prevStop.id} on Live Tour`,
            appRegion: APP_REGIONS.LIVE_TOUR,
            eventType: EVENT_TYPES.INFO,
          });

          await tourService.mutations.updateTour({ id: tour.id, currentTourStopId: prevStop.id });
        } catch (error) {
          setErrorMessage('There has been an error navigating back');
          console.log('Error setting current tour stop on back: ', error);
        }

        setTourStop(prevStop);

        setNextLoading(false);
        navigation.navigate({ routeName: 'LiveTour', params: { tourStopId: prevStop.id }, key: prevStop.id });
      } else {
        await logEvent({
          message: `Backing out of Live Tour ${tour.id}`,
          appRegion: APP_REGIONS.LIVE_TOUR,
          eventType: EVENT_TYPES.INFO,
        });

        const newTours = tours.map(mapTour => (tour.id === mapTour.id ? { ...mapTour, status: null } : mapTour));

        setTours(newTours);

        await tourService.mutations.updateTour({ id: tour.id, status: null, currentTourStopId: null });

        setNextLoading(false);
        navigation.navigate('ScheduledTours', null);
      }
    } catch (error) {
      setNextLoading(false);
      setErrorMessage('There has been an error navigating back');

      await logEvent({
        message: `Error saving tour stop info on back for Live Tour ${
          tour && tour.id ? tour.id : 'UNKNOWN'
        }: ${JSON.stringify(error)}`,
        appRegion: APP_REGIONS.LIVE_TOUR,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const navigateNext = async () => {
    try {
      setNextLoading(true);

      await saveTourStop();

      if (!tourStop.propertyOfInterest.propertyListing.isCustomListing) {
        await notifySellerOfDeparture(tourStop);
      } else {
        logEvent({
          message: `Skipping departure on tourStop: ${tourStop.id} because its a custom listing`,
          appRegion: APP_REGIONS.NOTIFICATION,
          eventType: EVENT_TYPES.INFO,
        });
      }

      if (nextStop) {
        try {
          await logEvent({
            message: `Navigating to Next Tour Stop: ${nextStop.id} on Live Tour`,
            appRegion: APP_REGIONS.LIVE_TOUR,
            eventType: EVENT_TYPES.INFO,
          });

          await tourService.mutations.updateTour({
            id: tour.id,
            status: 'in-progress',
            currentTourStopId: nextStop.id,
          });
        } catch (error) {
          setErrorMessage('There has been an error navigating forward');
          console.log('Error updating current tour stop on next: ', error);
        }

        if (!nextStop.propertyOfInterest.propertyListing.isCustomListing) {
          await notifyNextProperty(nextStop);
        } else {
          await logEvent({
            message: `Skipping arriving notification on tourStop: ${nextStop.id} because its a custom listing`,
            appRegion: APP_REGIONS.NOTIFICATION,
            eventType: EVENT_TYPES.INFO,
          });
        }

        setTourStop(nextStop);
        setNextLoading(false);

        navigation.navigate({ routeName: 'LiveTour', params: { tourStopId: nextStop.id }, key: nextStop.id });
      } else {
        try {
          await logEvent({
            message: `Live Tour ${tour.id} completed`,
            appRegion: APP_REGIONS.LIVE_TOUR,
            eventType: EVENT_TYPES.INFO,
          });

          const newTours = tours.map(mapTour =>
            tour.id === mapTour.id ? { ...mapTour, status: 'complete' } : mapTour
          );

          setTours(newTours);

          await tourService.mutations.updateTour({ id: tour.id, status: 'complete', currentTourStopId: null });

          setNextLoading(false);

          navigation.navigate('ScheduledTours', null);
        } catch (error) {
          setErrorMessage('There has been an error finishing the tour.');
          console.warn('Error marking tour complete: ', error);
        }
      }
    } catch (error) {
      setNextLoading(false);

      await logEvent({
        message: `Error saving tour stop info on next for Live Tour ${
          tour && tour.id ? tour.id : 'UNKNOWN'
        }: ${JSON.stringify(error)} `,
        appRegion: APP_REGIONS.LIVE_TOUR,
        eventType: EVENT_TYPES.ERROR,
      });

      setErrorMessage('There has been an error navigating forward.');
      console.log('Error saving tour stop info on next: ', error);
    }
  };

  const toggleInterested = () => {
    const prevState = interested;

    setInterested(!prevState);

    if (!prevState) {
      setNotInterested(false);
    }
  };

  const toggleNotInterested = () => {
    const prevState = notInterested;

    setNotInterested(!prevState);

    if (!prevState) {
      setInterested(false);
    }
  };

  return (
    <>
      <NavigationEvents onWillFocus={() => setNavigationParams({ headerTitle: 'Live Tour', showBackBtn: false })} />
      <KeyboardAwareScrollView
        style={[tw.hFull, tw.bgPrimary]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
      >
        <View style={[tw.hFull, tw.bgPrimary]}>
          <View style={[tw.mT4, tw.wFull, tw.pX8, tw.selfCenter]}>
            <View style={[tw.flexRow, tw.justifyBetween]}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('AgentHomeDetails', {
                    propertyOfInterestId: tourStop.propertyOfInterestId,
                  })
                }
              >
                <BodyText bold xl>
                  {propListing && propListing.address.includes(',')
                    ? propListing.address.split(',')[0]
                    : propListing.address}
                </BodyText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[tw.w8, tw.h8, tw.roundedFull, tw.justifyCenter, tw.itemsCenter]}
                onPress={linkToDirections}
              >
                <CompassIcon width={28} height={28} />
              </TouchableOpacity>
            </View>
            <BodyText md>{`${propListing.city}, ${propListing.state}`}</BodyText>
          </View>
          {imagesLoaded && <Carousel items={liveTourCards} />}
          <View style={[tw.mT4, tw.wFull, tw.pX8]}>
            <View style={[tw.flexRow, tw.justifyBetween, tw.itemsCenter]}>
              {propListing.listingAgent ? (
                <>
                  <View style={[tw.flexRow]}>
                    <BodyText semibold lg>
                      Message Listing Agent
                    </BodyText>
                  </View>

                  <SecondaryButton
                    icon={
                      <SentIcon
                        height={16}
                        width={16}
                        style={[tw.mL2]}
                        fill={messageDisabled ? color.gray500 : color.blue500}
                      />
                    }
                    title="Send"
                    loading={sendingFeedback}
                    style={[
                      tw.border,
                      messageDisabled ? tw.borderGray500 : tw.borderBlue500,
                      tw.rounded,
                      tw.mT0,
                      tw.mB0,
                      tw.pX4,
                    ]}
                    textStyle={[messageDisabled ? tw.textGray500 : tw.textBlue500]}
                    onPress={() => onSendPress()}
                    disabled={messageDisabled}
                  />
                </>
              ) : null}
            </View>

            <View style={[tw.mY4]}>
              <TouchableOpacity style={[tw.flexRow, tw.mY2]} activeOpacity={0.7} onPress={toggleInterested}>
                <CheckboxCircle
                  sm
                  checked={interested}
                  borderColor={tw.borderBlue500}
                  color={tw.bgBlue500}
                  style={[tw.selfCenter]}
                />
                <BodyText lg style={[tw.mX3]}>
                  My client is interested
                </BodyText>
              </TouchableOpacity>
              <TouchableOpacity style={[tw.flexRow, tw.mY2]} activeOpacity={0.7} onPress={toggleNotInterested}>
                <CheckboxCircle
                  sm
                  checked={notInterested}
                  color={tw.bgBlue500}
                  borderColor={tw.borderBlue500}
                  style={[tw.selfCenter]}
                />
                <BodyText lg style={[tw.mX3]}>
                  My client is not interested
                </BodyText>
              </TouchableOpacity>
            </View>

            <View style={[tw.wFull, tw.flexCol, tw.justifyEnd]}>
              <View style={[tw.flexRow, tw.itemsEnd]}>
                <View style={[tw.flex1]}>
                  <PrimaryInput
                    placeholder={propListing.listingAgent ? 'Enter Message' : 'Enter Comment'}
                    value={comments}
                    onChangeText={setComments}
                    style={[tw.textMd, tw.pX4, tw.pY4, tw.textGray700, tw.border, tw.borderGray700, { minHeight: 75 }]}
                    maxLength={2000}
                    multiline
                  />
                </View>
              </View>
            </View>
          </View>
          <View style={[tw.flexRow, tw.itemsCenter, tw.justifyCenter, tw.alignCenter]}>
            <View style={[tw.flex1]}>
              <SecondaryButton title={prevStop ? 'Previous Home' : 'Back'} style={[tw.wFull]} onPress={navigateBack} />
            </View>
            <View style={[tw.pX4]}>
              <BodyText style={[tw.selfCenter]}>{pageProgress}</BodyText>
            </View>
            <View style={[tw.flex1, tw.justifyEnd]}>
              <SecondaryButton title={nextStop ? 'Next Home' : 'Finish'} style={[tw.wFull]} onPress={navigateNext} />
            </View>
          </View>
          {errorMessage ? (
            <View style={[tw.wFull, tw.justifyCenter, tw.itemsCenter]}>
              <BodyText style={[tw.textRed500]}>{errorMessage}</BodyText>
            </View>
          ) : null}
          {nextLoading ? (
            <View style={[tw.wFull, tw.justifyCenter, tw.itemsCenter]}>
              <ActivityIndicator size="small" color={colors.gray500} />
            </View>
          ) : null}
          <FlatList
            ref={FlatlistRef}
            data={messages}
            style={{ height: 500 }}
            extraData={messages}
            renderItem={({ item }) => <ChatMessage item={item} user={user} />}
            keyExtractor={(item, index) => `message-${index}`}
          />
        </View>
      </KeyboardAwareScrollView>
    </>
  );
};

export default withNavigationFocus(LiveTour);
