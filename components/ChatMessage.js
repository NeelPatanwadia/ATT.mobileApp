import { FontAwesome5 } from '@expo/vector-icons';
import dateFormat from 'dateformat';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { BodyText } from './textComponents';

const ChatMessage = ({ item, user }) => {
  const { message, sendTime, senderId, senderName, isSending, error } = item;
  const { id: userId } = user;
  const dateTime = dateFormat(sendTime * 1000, 'mm/dd/yy hh:MMtt');
  const currentUser = senderId === userId;

  return (
    <View style={[tw.mX4]}>
      <View style={[tw.w9_12, tw.pY1, tw.mB4, currentUser && tw.selfEnd]}>
        <View style={[tw.flexRow]}>
          <View style={[tw.flex1, tw.flexCol]}>
            <BodyText style={[tw.mB1]} bold={currentUser}>
              {dateTime}
            </BodyText>
            {!currentUser && (
              <BodyText bold={currentUser} style={[tw.mB1]}>
                {senderName}
              </BodyText>
            )}
            <BodyText bold={currentUser}>{message}</BodyText>
          </View>
          <View style={[tw.justifyCenter]}>
            {currentUser && isSending && <ActivityIndicator color={color.gray500} />}
            {currentUser && error && <FontAwesome5 name="times-circle" style={[tw.textRed500, tw.textLg]} />}
          </View>
        </View>
      </View>
    </View>
  );
};

export default ChatMessage;
