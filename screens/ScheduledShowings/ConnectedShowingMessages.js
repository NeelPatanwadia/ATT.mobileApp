import React, { useEffect, useState } from 'react';
import { graphqlOperation, API } from 'aws-amplify';
import { View } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { withNavigation } from 'react-navigation';
import { BodyText, FlexLoader } from '../../components';
import { SentIcon, MessagesIcon } from '../../assets/images';

import { onCreateTourStopMessage } from '../../src/graphql/subscriptions';
import { messageService } from '../../services';
import { EVENT_TYPES, APP_REGIONS, logEvent } from '../../helpers/logHelper';

const ShowingMessage = ({ fromCurrentUser, message }) => {
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
            tw.flex1,
            !fromCurrentUser ? [tw.textRed500, tw.textRight] : tw.textGray700,
            // message.startsWith('New Suggested Time') || message.startsWith('Declined on')
            //   ? [tw.textRed500, tw.textRight]
            //   : tw.textGray700,
          ]}
          md
          bold={message.startsWith('New Suggested Time')}
          italic
        >
          {message}
        </BodyText>
      </View>
    </View>
  );
};

const ConnectedShowingMessages = ({ user, messages, tourStopId, setMessages }) => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    listShowingMessages();
    initSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [tourStopId]);

  const listShowingMessages = async () => {
    try {
      console.log('LISTING SHOWING MESSAGES..');
      const msgs = await messageService.queries.listTourStopMessages(tourStopId);

      setMessages(msgs);
    } catch (error) {
      console.warn('Error getting showing messages: ', error);
    }

    setLoading(false);
  };

  const initSubscription = async () => {
    try {
      console.log('INITING SUBSCRIPTION FOR SHOWING: ', tourStopId);
      const tourSubscription = await API.graphql(
        graphqlOperation(onCreateTourStopMessage, { tour_stop_id: tourStopId })
      ).subscribe({
        error: err => {
          console.error('SHOWING MESSAGES SUBSCRIPTION ERROR:', err);

          const errMessage = err && err.error ? JSON.stringify(err.error) : 'Unknown';

          logEvent({
            message: `SHOWING MESSAGES SUBSCRIPTION ERROR: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        },
        next: () => {
          listShowingMessages();
        },
      });

      setSubscription(tourSubscription);
    } catch (error) {
      console.log('Error on tour subscription: ', error);
    }
  };

  if (loading) {
    return <FlexLoader />;
  }

  if (!user || !tourStopId) return <FlexLoader />;

  const showingMessages = messages.map((mapTourStopMessage, idx) => {
    const fromCurrentUser = mapTourStopMessage.fromUser !== user.id;
    let message = '';

    if (mapTourStopMessage.message) {
      message = mapTourStopMessage.message;
    }

    return <ShowingMessage key={`showingMessage-${idx}`} message={message} fromCurrentUser={fromCurrentUser} />;
  });

  return showingMessages;
};

export default withNavigation(ConnectedShowingMessages);
