import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { BodyText } from '../../components';
import { ChevronRightIcon } from '../../assets/images';

const BuyerSellerListingIndexCard = ({
  onPress,
  style = [],
  icon = <ChevronRightIcon width={15} height={15} fill={color.blue400} stroke={color.white} />,
  propertyListing,
}) => {
  const { address, city, state } = propertyListing;

  return (
    <TouchableOpacity
      onPress={() => onPress(propertyListing)}
      activeOpacity={0.9}
      style={[tw.shadow, tw.wFull, tw.pY4, tw.bgGray100, tw.mY1, tw.pX8, tw.flexRow, ...style]}
    >
      <View style={[tw.flex1, tw.flexCol, tw.justifyCenter]}>
        <View style={[tw.flexRow, tw.justifyStart, tw.itemsCenter, tw.mT1]}>
          <BodyText semibold md>
            {address.includes(',') ? address.split(',')[0] : address}
          </BodyText>
        </View>
        <View style={[tw.flexRow, tw.justifyStart, tw.itemsCenter, tw.mT2]}>
          <BodyText>{`${city}, ${state}`}</BodyText>
        </View>
      </View>
      <View style={[tw.justifyCenter, tw.pY2]}>{icon}</View>
    </TouchableOpacity>
  );
};

export default BuyerSellerListingIndexCard;
