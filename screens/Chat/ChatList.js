import dateFormat from 'dateformat';
import React, { useContext, useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { Badge, BodyText, FlexLoader } from '../../components';
import AgentTabContext from '../../navigation/AgentTabContext';
import { chatService } from '../../services';
import ShowingContext from '../ScheduledShowings/ShowingContext';

const ListChats = ({ chats, onPress, newMessages }) => {
  const { chatTitle, lastMessage, lastMessageTime } = chats;

  const formattedDate = dateFormat(lastMessageTime * 1000, 'dS mmm');

  let showMessageBadge = false;

  if (newMessages && newMessages.length > 0) {
    const listitngProperty = newMessages.find(x => x.chatId === chats.id);

    if (listitngProperty && listitngProperty.propertyListingId) {
      showMessageBadge = true;
    }
  }

  return (
    <TouchableOpacity style={[tw.flexRow, tw.pY2, tw.mB2, tw.pX3, tw.shadow, tw.bgGray100]} onPress={onPress}>
      <View style={[tw.w6, tw.itemsCenter, tw.justifyCenter]}>{showMessageBadge ? <Badge noCountNeeded /> : null}</View>
      <View style={[tw.flexCol, tw.flex1]}>
        <BodyText lg semibold>
          {chatTitle}
        </BodyText>
        <View style={[tw.flexRow, tw.mT2]}>
          <Text numberOfLines={1} style={[tw.flex1, tw.textGray700, tw.textLg, tw.fontLight]}>
            {lastMessage}
          </Text>
          <BodyText style={[tw.pX2]}>{formattedDate}</BodyText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ChatList = ({ navigation, isFocused, screenProps: { user, newMessages } }) => {
  const { setNavigationParams } = useContext(AgentTabContext);
  const { selectedPropertyListing } = useContext(ShowingContext);
  const [chatList, setChatList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { id: propertyListingId } = selectedPropertyListing;

  const onChatPress = selectedChat =>
    navigation.navigate('ScheduleChatScreen', { chatId: selectedChat.id, receiverId: selectedChat.buyingAgentId });

  useEffect(() => {
    getList({ hideLoader: false });
  }, []);

  useEffect(() => {
    if (newMessages && newMessages.length > 0) {
      getList({ hideLoader: true });
    }
  }, [newMessages.length]);

  useEffect(() => {
    if (isFocused) getList({ hideLoader: true });
  }, [isFocused]);

  const ListEmptyComponent = () => (
    <View style={[tw.itemsCenter]}>
      <BodyText lg semibold>
        No Chats Found
      </BodyText>
    </View>
  );

  const getList = async ({ hideLoader }) => {
    if (!hideLoader) setIsLoading(true);
    try {
      const chatListInput = {
        listingAgentId: user.id,
        propertyListingId,
        userId: user.id,
      };
      const list = await chatService.queries.getListOfChatsByPropertyIdAndListingAgentId(chatListInput);

      setChatList(list);
    } catch (error) {
      console.log('Error getting list of chats', error);
    }
    setIsLoading(false);
  };

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
          data={chatList}
          style={[tw.pT4]}
          ListEmptyComponent={ListEmptyComponent}
          renderItem={({ item: chats }) => (
            <ListChats newMessages={newMessages} chats={chats} onPress={() => onChatPress(chats)} />
          )}
          keyExtractor={(item, index) => `chat-${index}`}
        />
      )}
    </>
  );
};

export default withNavigationFocus(ChatList);
