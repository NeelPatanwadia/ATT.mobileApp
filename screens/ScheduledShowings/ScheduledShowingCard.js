import React, { useContext } from 'react';
import dateformat from 'dateformat';
import { View, TouchableOpacity } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { BodyText, StatusIcon } from '../../components';
import { hoursToSeconds } from '../../helpers';
import { ChevronRightIcon } from '../../assets/images';
import ShowingContext from './ShowingContext';

const ScheduledShowingCard = ({
  onPress,
  style = [],
  icon = <ChevronRightIcon width={18} height={18} fill={color.blue400} stroke={color.white} />,
  showing,
}) => {
  const { selectedPropertyListing } = useContext(ShowingContext);
  const { startTime = 0, duration = 0, estDriveDuration = 0 } = showing;

  const showingDateStr = dateformat(startTime * 1000, 'mm/dd/yyyy');
  const arriveTime = startTime + estDriveDuration;
  const leaveTime = arriveTime + hoursToSeconds(duration);
  const showingTimeStr = `${dateformat(arriveTime * 1000, 'h:MMtt')} - ${dateformat(leaveTime * 1000, 'h:MMtt')}`;

  const getPropertyAddress = () => {
    if (showing && showing.propertyOfInterest && showing.propertyOfInterest.propertyListing) {
      const { address, city, state } = showing.propertyOfInterest.propertyListing;

      return `${address.includes(',') ? address.split(',')[0] : address}, ${city}, ${state}`;
    }

    return 'Address Not Available';
  };

  const getBuyersAgentName = () => {
    if (showing && showing.propertyOfInterest && showing.buyingAgent) {
      const { firstName, lastName } = showing.buyingAgent;

      return `${firstName} ${lastName}`;
    }

    return 'Not Available';
  };

  const getSellerName = () => {
    if (selectedPropertyListing && selectedPropertyListing.seller) {
      const { firstName, lastName } = selectedPropertyListing.seller;

      return `${firstName} ${lastName}`;
    }

    if (
      showing &&
      showing.propertyOfInterest &&
      showing.propertyOfInterest.propertyListing &&
      showing.propertyOfInterest.propertyListing.seller
    ) {
      const { firstName, lastName } = showing.propertyOfInterest.propertyListing.seller;

      return `${firstName} ${lastName}`;
    }

    return 'Not Available';
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(showing)}
      activeOpacity={0.9}
      style={[tw.shadow, tw.wFull, tw.h32, tw.bgGray100, tw.mY1, tw.pX4, tw.flexRow, tw.itemsCenter, ...style]}
    >
      <StatusIcon status={showing.status} />

      <View style={[tw.hFull, tw.flex1, tw.flexCol, tw.justifyCenter]}>
        <View style={[tw.flexRow, tw.justifyStart, tw.itemsCenter, tw.mT1]}>
          <BodyText semibold>{`${showingDateStr}, `}</BodyText>
          <BodyText bold>{showingTimeStr}</BodyText>
        </View>

        <View style={[tw.flexRow, tw.justifyStart, tw.itemsCenter, tw.mT1]}>
          <BodyText md semibold>
            Buyer's Agent:
          </BodyText>
          <BodyText style={[tw.mL2]} md>
            {getBuyersAgentName()}
          </BodyText>
        </View>

        <View style={[tw.flexRow, tw.justifyStart, tw.itemsCenter, tw.mT1]}>
          <BodyText semibold md>
            Client:
          </BodyText>
          <BodyText style={[tw.mL2]} md>
            {getSellerName()}
          </BodyText>
        </View>
        <View style={[tw.flexRow, tw.justifyStart, tw.itemsCenter, tw.mT1]}>
          <BodyText md>{getPropertyAddress()}</BodyText>
        </View>
      </View>
      <View style={[tw.hFull, tw.justifyCenter, tw.pR2]}>{icon}</View>
    </TouchableOpacity>
  );
};

export default ScheduledShowingCard;
