import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { BodyText, StatusIcon } from '../../components';

const BuyerSellerTourStopCard = ({ style = [], tourStop, tourStopTimeStr, onPress }) => {
  const {
    propertyOfInterest: {
      propertyListing: { address = '', city = '', state = '', zip = '' },
    },
    status,
  } = tourStop;

  const statusIcon = (
    <View style={[tw.mL2, tw.mR4, tw.w6, tw.h6]}>
      <StatusIcon status={status} />
    </View>
  );

  return (
    <TouchableOpacity
      style={[tw.wFull, tw.h20, tw.bgGray100, tw.mY1, tw.pX4, tw.flexRow, tw.itemsCenter, ...style]}
      onPress={onPress}
    >
      {statusIcon}
      <View style={[tw.hFull, tw.flex1, tw.flexCol, tw.justifyCenter]}>
        <BodyText md semibold style={[tw.textBlue500]}>
          {tourStopTimeStr}
        </BodyText>
        <BodyText md style={[tw.mY2]}>{`${address.includes(',') ? address.split(',')[0] : address}`}</BodyText>
        <BodyText md>{`${city}, ${state} ${zip}`}</BodyText>
      </View>
    </TouchableOpacity>
  );
};

export default BuyerSellerTourStopCard;
