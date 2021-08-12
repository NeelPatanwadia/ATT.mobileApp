import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { BodyText, Badge } from '../../components';
import { ChevronRightIcon } from '../../assets/images';

const ListingIndexCard = ({
  onPress,
  style = [],
  icon = <ChevronRightIcon width={18} height={18} fill={color.blue400} stroke={color.white} />,
  listing,
  showingRequestCounts,
  newMessages,
}) => {
  const { address, city, state } = listing;

  const cityState = `${city}, ${state}`;

  let badgeCount = 0;

  if (showingRequestCounts && showingRequestCounts.length > 0) {
    const listingCountInfo = showingRequestCounts.find(x => x.propertyListingId === listing.id);

    if (listingCountInfo && listingCountInfo.count) {
      badgeCount = listingCountInfo.count;
    }
  }

  let showMessageBadge = false;

  if (newMessages && newMessages.length > 0) {
    const listitngProperty = newMessages.find(x => x.propertyListingId === listing.id);

    if (listitngProperty && listitngProperty.propertyListingId) {
      showMessageBadge = true;
    }
  }

  return (
    <TouchableOpacity
      onPress={() => onPress(listing)}
      activeOpacity={0.9}
      style={[tw.shadow, tw.bgGray100, tw.pY4, tw.mY1, tw.pL2, tw.pR4, tw.flexRow, tw.justifyBetween, ...style]}
    >
      <View style={[tw.flexCol, tw.itemsCenter, tw.justifyCenter, tw.w12, tw.mR2]}>
        {badgeCount ? <Badge count={badgeCount} md /> : showMessageBadge && <Badge noCountNeeded md />}
      </View>

      <View style={[tw.flexCol, tw.justifyCenter, tw.flex1]}>
        <View style={[tw.flexCol, tw.justifyCenter, tw.mT1]}>
          <BodyText semibold md style={[tw.flexWrap]}>
            {address.includes(',') ? address.split(',')[0] : address}
          </BodyText>
          <BodyText semibold md style={[tw.flexWrap]}>
            {cityState}
          </BodyText>
        </View>

        <View style={[tw.flexRow, tw.justifyStart, tw.itemsCenter, tw.mT2]}>
          <BodyText semibold md>
            Client:
          </BodyText>
          <BodyText style={[tw.mL2]}>
            {listing && listing.seller ? `${listing.seller.firstName} ${listing.seller.lastName}` : 'Not Available'}
          </BodyText>
        </View>
      </View>

      <View style={[tw.justifyCenter, tw.p2]}>{icon}</View>
    </TouchableOpacity>
  );
};

export default ListingIndexCard;
