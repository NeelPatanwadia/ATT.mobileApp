import { useEffect, useState } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { chatService } from '../services';
import { APP_REGIONS, EVENT_TYPES, logEvent } from '../helpers/logHelper';
import { chatReceiveNewMessage } from '../src/graphql/subscriptions';

const NewMessageHandler = ({ user, setNewMessages, setShowListingBatch, setShowBuyingBatch }) => {
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (user) getNewMessages();
  }, [user]);

  useEffect(() => {
    initSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const initSubscription = async () => {
    try {
      console.log('INITING SUBSCRIPTION FOR NEW MESSAGE FOR USER: ', user.id);
      const chatSubscription = await API.graphql(
        graphqlOperation(chatReceiveNewMessage, { receiver_id: user.id })
      ).subscribe({
        error: err => {
          console.error('NEW MESSAGE SUBSCRIPTION ERROR:', err);

          const errMessage = err && err.error ? JSON.stringify(err.error) : 'Unknown';

          logEvent({
            message: `NEW MESSAGE SUBSCRIPTION ERROR: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        },
        next: () => {
          getNewMessages();
        },
      });

      setSubscription(chatSubscription);
    } catch (error) {
      console.log('Error on tour subscription: ', error);
    }
  };

  const getNewMessages = async () => {
    try {
      const newChats = await chatService.queries.getNewReceivedChatByUserId({ userId: user.id });

      if (newChats && newChats.length > 0) {
        const newListingMessage = newChats.findIndex(value => value.listingAgentId === user.id);
        const newBuyingMessage = newChats.findIndex(value => value.buyingAgentId === user.id);

        setShowListingBatch(newListingMessage !== -1);
        setShowBuyingBatch(newBuyingMessage !== -1);
      } else {
        setShowListingBatch(false);
        setShowBuyingBatch(false);
      }
      setNewMessages(newChats);
    } catch (error) {
      console.log('Error getting new chats', error);
    }
  };

  return null;
};

export default NewMessageHandler;
