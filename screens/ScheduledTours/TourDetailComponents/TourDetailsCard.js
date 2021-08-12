import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { tw } from 'react-native-tailwindcss';

import { BodyText, CustomPill, StatusIcon } from '../../../components';
import { ChevronRightIcon } from '../../../assets/images';

const TourDetailsCard = ({
  onPress,
  style = [],
  icon = <ChevronRightIcon height={15} width={15} />,
  tourStop,
  tourStopTimeStr,
}) => {
  const {
    propertyOfInterest: {
      propertyListing: { listingAgent, isCustomListing },
    },
  } = tourStop;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[tw.shadow, tw.wFull, tw.bgGray100, tw.mY1, tw.pX4, tw.flexRow, tw.itemsCenter, tw.pY4, ...style]}
      disabled={isCustomListing}
    >
      <StatusIcon status={tourStop.status} />
      <View style={[tw.flexCol, tw.justifyCenter, tw.flex1]}>
        <BodyText md bold style={[tw.textBlue500]}>
          {tourStopTimeStr}
        </BodyText>
        <BodyText style={[tw.mY2]} md>
          {tourStop.propertyOfInterest.propertyListing.address.includes(',')
            ? tourStop.propertyOfInterest.propertyListing.address.split(',')[0]
            : tourStop.propertyOfInterest.propertyListing.address}
        </BodyText>
        <View style={[tw.flexRow]}>
          <BodyText md italic>
            Seller's Agent:
          </BodyText>
          <BodyText md italic style={[tw.mL1]}>
            {listingAgent ? `${listingAgent.firstName} ${listingAgent.lastName}` : 'Not Available'}
          </BodyText>
        </View>
      </View>
      <View style={[tw.justifyCenter, tw.pL2, tw.mLAuto]}>{isCustomListing ? <CustomPill /> : icon}</View>
    </TouchableOpacity>
  );
};

export default TourDetailsCard;
