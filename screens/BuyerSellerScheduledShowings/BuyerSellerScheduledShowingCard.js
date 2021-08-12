import React from 'react';
import dateformat from 'dateformat';
import { View, TouchableOpacity } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { BodyText, StatusIcon } from '../../components';
import { hoursToMilliseconds } from '../../helpers';
import { ChevronRightIcon } from '../../assets/images';

const BuyerSellerScheduledShowingCard = ({
  onPress,
  style = [],
  icon = <ChevronRightIcon width={18} height={18} fill={color.blue400} stroke={color.white} />,
  showing,
}) => {
  const {
    propertyOfInterest: {
      propertyListing: { address, city, state },
    },
    status,
    startTime = 0,
    duration = 0,
  } = showing;

  const showingDateStr = dateformat(startTime * 1000, 'mm/dd/yyyy');
  const startTimeStr = dateformat(startTime * 1000, 'h:MMtt');
  const endTimeStr = dateformat(startTime * 1000 + hoursToMilliseconds(duration), 'h:MMtt');
  const showingTimeStr = `${startTimeStr} - ${endTimeStr}`;

  const cityState = `${city}, ${state}`;

  return (
    <TouchableOpacity
      onPress={() => onPress(showing)}
      activeOpacity={0.9}
      style={[tw.shadow, tw.wFull, tw.pY4, tw.bgGray100, tw.mY1, tw.pX4, tw.flexRow, tw.itemsCenter, ...style]}
    >
      <StatusIcon status={status} />
      <View style={[tw.flex1, tw.flexCol, tw.justifyCenter]}>
        <View style={[tw.flexRow, tw.justifyStart, tw.itemsCenter, tw.mT1]}>
          <BodyText semibold md>{`${showingDateStr} ${showingTimeStr}`}</BodyText>
        </View>
        <View style={[tw.flexCol, tw.justifyCenter, tw.mT1]}>
          <BodyText md>{address.includes(',') ? address.split(',')[0] : address}</BodyText>
          <BodyText md>{cityState}</BodyText>
        </View>
      </View>
      <View style={[tw.justifyCenter, tw.p2, tw.pX8, tw.w12]}>{icon}</View>
    </TouchableOpacity>
  );
};

export default BuyerSellerScheduledShowingCard;
