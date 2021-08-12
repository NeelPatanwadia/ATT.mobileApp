import React from 'react';
import { View } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { FontAwesome5 } from '@expo/vector-icons';
import { CheckIcon, MessagesIcon } from '../assets/images';
import { BodyText } from './textComponents';

export default function TabBarIcon({ status }) {
  let statusIcon = (
    <View
      style={[
        tw.mR4,
        tw.border2,
        tw.roundedFull,
        tw.w5,
        tw.h5,
        tw.flex,
        tw.itemsCenter,
        tw.justifyCenter,
        tw.borderYellow500,
      ]}
    >
      <BodyText bold style={[tw.textYellow500]} xs>
        ?
      </BodyText>
    </View>
  );

  if (status === 'approved') {
    statusIcon = (
      <View
        style={[
          tw.mR4,
          tw.border2,
          tw.roundedFull,
          tw.w5,
          tw.h5,
          tw.flex,
          tw.itemsCenter,
          tw.justifyCenter,
          tw.borderMint800,
        ]}
      >
        <CheckIcon width={10} height={10} fill={color.mint800} stroke={color.mint800} />
      </View>
    );
  }

  if (status === 'showingRequestSend') {
    statusIcon = (
      <View
        style={[
          tw.mR4,
          tw.border2,
          tw.roundedFull,
          tw.w5,
          tw.h5,
          tw.flex,
          tw.itemsCenter,
          tw.justifyCenter,
          tw.borderMint800,
        ]}
      >
        <FontAwesome5 name="paper-plane" solid style={[tw.textMint800, tw.h3, tw.w3, { marginEnd: 1 }]} />
      </View>
    );
  }

  if (status === 'timeSuggested') {
    statusIcon = (
      <View
        style={[
          tw.mR4,
          tw.border2,
          tw.roundedFull,
          tw.w5,
          tw.h5,
          tw.flex,
          tw.itemsCenter,
          tw.justifyCenter,
          tw.borderRed500,
        ]}
      >
        <BodyText bold style={[tw.textRed500]} xs>
          !
        </BodyText>
      </View>
    );
  }

  if (status === 'newMessage') {
    statusIcon = (
      <View
        style={[tw.mR4, tw.roundedFull, tw.w5, tw.h5, tw.flex, tw.itemsCenter, tw.justifyCenter, tw.borderPurple500]}
      >
        <View style={[tw.border2, tw.borderBlue500, tw.roundedFull, tw.p1]}>
          <MessagesIcon width={10} height={10} fill={color.blue500} />
        </View>
      </View>
    );
  }

  if (status === 'error') {
    statusIcon = (
      <View
        style={[
          tw.mR4,
          tw.border2,
          tw.roundedFull,
          tw.bgRed500,
          tw.w5,
          tw.h5,
          tw.flex,
          tw.itemsCenter,
          tw.justifyCenter,
          tw.borderRed500,
        ]}
      >
        <BodyText bold style={[tw.textWhite]} xs>
          !
        </BodyText>
      </View>
    );
  }

  return statusIcon;
}
