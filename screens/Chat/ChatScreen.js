import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, FlatList, Keyboard, Platform, TextInput, TouchableOpacity } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { NavigationEvents } from 'react-navigation';
import { BodyText, FlexLoader } from '../../components';
import ChatMessage from '../../components/ChatMessage';
import AgentTabContext from '../../navigation/AgentTabContext';
import { chatService } from '../../services';

const ChatScreen = ({
  navigation,
  screenProps: { user, newMessages, setShowListingBatch, setShowBuyingBatch, setNewMessages },
}) => {
  const { setNavigationParams } = useContext(AgentTabContext);
  const keyboardShowListener = useRef(null);
  const keyboardWillHideListener = useRef(null);
  const FlatlistRef = useRef(null);
  const [textMessage, setTextMessage] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messageSending, setMessageSending] = useState(false);

  const chatId = navigation.getParam('chatId');
  const receiverId = navigation.getParam('receiverId');

  useEffect(() => {
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
    if (newMessages.length > 0) {
      console.log('new meesage ', newMessages);
      updateMessages();
    }
  }, [newMessages.length]);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      keyboardShowListener.current = Keyboard.addListener('keyboardDidShow', event =>
        setKeyboardOffset(event.endCoordinates.height - 35)
      );
      keyboardWillHideListener.current = Keyboard.addListener('keyboardWillHide', () => setKeyboardOffset(0));
    }

    return () => {
      if (Platform.OS === 'ios') {
        keyboardShowListener.current.remove();
        keyboardWillHideListener.current.remove();
      }
    };
  }, []);

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
    setIsLoading(true);
    try {
      const chatMessages = await chatService.mutations.chatGetMessages({ chatId, userId: user.id });

      await chatMessages.sort(() => -1);
      setMessages(chatMessages);
      setUnreadMessages();
    } catch (error) {
      setMessages([]);
      console.log('Error getting chat messages', error);
    }
    setIsLoading(false);
  };

  const onSendPress = async () => {
    setMessageSending(true);
    const messageDetails = {
      message: textMessage.trim(),
      senderId: user.id,
      receiverId,
      senderName: `${user.firstName} ${user.lastName}`,
      sendTime: Math.floor(new Date().getTime() / 1000),
      chatId,
    };
    const tempArr = [].concat({ ...messageDetails, isSending: true }, ...messages);

    setTextMessage('');
    setMessages(tempArr);
    if (tempArr.length > 3) FlatlistRef.current.scrollToIndex({ index: 0, viewPosition: 0 });
    setMessageSending(false);
    try {
      const response = await chatService.mutations.chatSendMessage(messageDetails);
      const Arr = tempArr.map(message =>
        message.sendTime === messageDetails.sendTime && message.message === messageDetails.message
          ? { ...messageDetails, messageId: response.id }
          : message
      );

      setMessages(Arr);
    } catch (error) {
      console.log('Error sending message', error);
      const Arr = tempArr.map(message =>
        message.sendTime === messageDetails.sendTime && message.message === messageDetails.message
          ? { ...messageDetails, error: true }
          : message
      );

      setMessages(Arr);
    }
  };

  const ListEmptyComponent = () => (
    <View style={[tw.itemsCenter, tw.mT2]}>
      <BodyText xl semibold>
        No Messages Found
      </BodyText>
    </View>
  );

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Chats',
            showSettingsBtn: true,
            showBackBtn: true,
          })
        }
      />
      {isLoading ? (
        <FlexLoader />
      ) : (
        <FlatList
          ref={FlatlistRef}
          data={messages}
          extraData={messages.length}
          ListEmptyComponent={ListEmptyComponent}
          style={{ marginBottom: Platform.OS === 'ios' ? keyboardOffset : 0 }}
          renderItem={({ item }) => <ChatMessage item={item} user={user} />}
          inverted={messages.length > 0}
          keyExtractor={(item, index) => `message-${index}`}
        />
      )}
      <View
        style={[
          tw.wFull,
          tw.flexRow,
          tw.pR2,
          tw.bgWhite,
          {
            bottom: Platform.OS === 'ios' ? keyboardOffset : 0,
            maxHeight: 100,
            minHeight: 50,
            borderWidth: 0.5,
            borderColor: color.gray700,
          },
        ]}
      >
        <View style={[tw.flex1]}>
          <TextInput
            placeholder="Enter Message"
            placeholderTextColor={color.gray700}
            textAlignVertical="top"
            onChangeText={text => setTextMessage(text)}
            value={textMessage}
            maxLength={2000}
            style={[tw.textLg, tw.mX1]}
            multiline
          />
        </View>
        {textMessage.length !== 0 && (
          <TouchableOpacity
            onPress={onSendPress}
            disabled={messageSending}
            style={[tw.itemsCenter, tw.bgBlue400, tw.selfCenter, tw.p2, { borderRadius: 100 }]}
          >
            <BodyText semibold style={[tw.textWhite]}>
              SEND
            </BodyText>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

export default ChatScreen;
