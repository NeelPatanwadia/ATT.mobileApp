import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';
import { View, TouchableOpacity, Image, Text } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { PlusIcon, Logo } from '../assets/images';
import { BodyText } from './textComponents';

function formatPhoneNumber(phoneNumberString) {
  const cleaned = `${phoneNumberString}`.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  return null;
}

const AgentCard = ({
  onPress,
  isSelected,
  onDeletePress,
  style = [],
  icon = <Image source={PlusIcon} style={{ width: 25, height: 25 }} resizeMode="contain" />,
  agent: { firstName, lastName, brokerage, cellPhone, logo },
  disabled,
}) => {
  const cellPhoneStr = formatPhoneNumber(cellPhone);
  const agentLogo = logo ? (
    <Image style={[tw.h24, tw.w24]} source={{ uri: logo }} />
  ) : (
    <View style={[tw.flexRow, tw.selfCenter, tw.justifyCenter]}>
      <Image source={Logo} style={[tw.h12, tw.wFull, tw.selfCenter]} resizeMode="contain" />
    </View>
  );

  return (
    <View style={[tw.shadow, tw.wFull, tw.h24, tw.bgGray100, tw.mY2, tw.flexRow, ...style]}>
      <View style={[tw.mX1, tw.h24, tw.w24, tw.justifyCenter]}>{agentLogo}</View>
      <View style={[tw.hFull, tw.flex1, tw.flexCol, tw.justifyCenter]}>
        <BodyText semibold style={[tw.textLg, tw.textBlue400]}>{`${firstName} ${lastName}`}</BodyText>
        <Text style={[tw.mY1]}>{brokerage}</Text>
        <BodyText>{cellPhoneStr}</BodyText>
      </View>
      {isSelected ? (
        <TouchableOpacity
          disabled={disabled}
          style={[tw.selfCenter, tw.itemsCenter, tw.bgRed500, tw.mR8, tw.pY2, tw.pX2, { borderRadius: 5 }]}
          onPress={onDeletePress}
        >
          <FontAwesome5 name="trash" color="white" style={[tw.textXs]} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity disabled={disabled} onPress={onPress} style={[tw.hFull, tw.justifyCenter, tw.p2, tw.pR8]}>
          {icon}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AgentCard;
