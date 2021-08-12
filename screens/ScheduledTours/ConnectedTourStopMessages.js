import React, { useEffect, useState } from 'react';
import { graphqlOperation, API } from 'aws-amplify';
import { View } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { withNavigation } from 'react-navigation';
import { BodyText, FlexLoader, PrimaryButton } from '../../components';
import { SentIcon, MessagesIcon } from '../../assets/images';
import { messageService } from '../../services';
import { onCreateTourStopMessage } from '../../src/graphql/subscriptions';
import { APP_REGIONS, EVENT_TYPES, logEvent } from '../../helpers/logHelper';

const TourMessage = ({ fromCurrentUser, message }) => {
  let icon = <MessagesIcon width={18} height={18} fill={fromCurrentUser ? color.blue500 : color.red500} />;

  if (message.startsWith('New Suggested Time') || message.startsWith('Declined on')) {
    icon = <MessagesIcon width={18} height={18} fill={color.red500} />;
  }
  if (message.startsWith('Request sent on')) {
    icon = <SentIcon width={18} height={18} fill={fromCurrentUser ? color.blue500 : color.red500} />;
  }
  if (message.startsWith('This time has been approved')) {
    icon = <SentIcon width={18} height={18} fill={fromCurrentUser ? color.blue500 : color.red500} />;
  }

  return (
    <View style={[tw.flexRow, tw.wFull]}>
      <View
        style={[
          tw.flex1,
          fromCurrentUser ? tw.flexRow : tw.flexRowReverse,
          tw.itemsCenter,
          fromCurrentUser ? tw.mR4 : tw.mL4,
          tw.mB4,
        ]}
      >
        <View style={[tw.selfBaseline, tw.pT1]}>{icon}</View>
        <BodyText
          style={[
            tw.pX3,
            message.startsWith('New Suggested Time') || message.startsWith('Declined on')
              ? tw.textRed500
              : tw.textGray700,
          ]}
          md
          italic
          bold={message.startsWith('New Suggested Time') || message.startsWith('Declined on')}
        >
          {message}
        </BodyText>
      </View>
    </View>
  );
};

const ConnectedTourStopMessages = ({ tourStopId, user, isFromScreen, onApproveSuggestedTime, isLoading }) => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [tourMessages, setTourMessages] = useState([]);

  useEffect(() => {
    listTourMessages();
    initSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [tourStopId]);

  const listTourMessages = async () => {
    try {
      const msgs = await messageService.queries.listTourStopMessages(tourStopId);

      setTourMessages(msgs);
    } catch (error) {
      console.warn('Error getting tour stop messages: ', error);
    }

    setLoading(false);
  };

  const initSubscription = async () => {
    try {
      const tourSubscription = await API.graphql(
        graphqlOperation(onCreateTourStopMessage, { tour_stop_id: tourStopId })
      ).subscribe({
        error: err => {
          console.error('TOUR STOP MESSAGES SUBSCRIPTION ERROR: ', err);

          const errMessage = err && err.error ? JSON.stringify(err.error) : 'Unknown';

          logEvent({
            message: `TOUR STOP MESSAGES SUBSCRIPTION ERROR: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        },
        next: () => {
          listTourMessages();
        },
      });

      setSubscription(tourSubscription);
    } catch (error) {
      console.log('Error on tour subscription: ', error);
    }
  };

  const approveSuggestedTime = () => {
    if (tourMessages.length === 0) return null;
    const latestMessage = tourMessages[tourMessages.length - 1];
    // const fromCurrentUser = latestMessage.toUser !== user.id;
    const message = latestMessage.message ? latestMessage.message : '';

    if (message.startsWith('New Suggested Time') || message.startsWith('Declined on')) {
      return (
        <PrimaryButton
          onPress={() => onApproveSuggestedTime(message)}
          title="APPROVE SUGGESTED TIME"
          textStyle={[tw.mX2]}
          // style={[tw.w3_4, tw.selfEnd]}
          loading={isLoading}
          loadingTitle="UPDATING"
        />
      );
    }
  };

  if (loading) {
    return <FlexLoader />;
  }

  if (isFromScreen === 'TourConfirmScreen' && tourMessages.length > 0) {
    const latestMessage = tourMessages[tourMessages.length - 1];
    const fromCurrentUser = latestMessage.toUser !== user.id;
    let message = '';

    if (latestMessage.message) {
      message = latestMessage.message;
    }

    return (
      <TourMessage
        key={`mapTourStopMessageFromTourConfirm-${latestMessage.toUser}`}
        message={message}
        fromCurrentUser={fromCurrentUser}
      />
    );
  }

  return (
    <>
      {tourMessages.map((mapTourStopMessage, idx) => {
        const fromCurrentUser = mapTourStopMessage.toUser !== user.id;
        let message = '';

        if (mapTourStopMessage.message) {
          message = mapTourStopMessage.message;
        }

        if (idx !== 0 && message === tourMessages[idx - 1].message) {
          return null;
        }

        return <TourMessage key={`mapTourStopMessage-${idx}`} message={message} fromCurrentUser={fromCurrentUser} />;
      })}
      {approveSuggestedTime()}
    </>
  );
};

export default withNavigation(ConnectedTourStopMessages);
