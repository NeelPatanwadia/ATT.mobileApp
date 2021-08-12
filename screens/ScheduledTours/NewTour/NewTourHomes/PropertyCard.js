import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import dateFormat from 'dateformat';
import { BodyText, CustomPill } from '../../../../components';
import { PlusIcon, RemoveIcon } from '../../../../assets/images';

const PropertyCard = ({
  active,
  onPress,
  style = [],
  propertyOfInterest: {
    mediaUrl,
    lastTouredTime,
    propertyListing: { city, state, zip, address, isCustomListing, status },
  },
}) => {
  const cardIcon = active ? (
    <Image source={RemoveIcon} style={{ width: 22, height: 22 }} resizeMode="contain" />
  ) : (
    <Image source={PlusIcon} style={{ width: 22, height: 22 }} resizeMode="contain" />
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={status === 'Closed' && !active}
      activeOpacity={0.7}
      style={[tw.shadow, tw.wFull, tw.h20, tw.bgGray100, tw.mY1, tw.flexRow, tw.justifyCenter, ...style]}
    >
      <View style={[tw.flexRow, tw.w5_6, tw.justifyBetween]}>
        {mediaUrl ? (
          <Image style={[tw.h16, tw.w16, tw.mR1, tw.mB1]} source={{ uri: mediaUrl }} resizeMode="contain" />
        ) : (
          <View style={[tw.h16, tw.w16, tw.mR1, tw.mB1, tw.itemsCenter, tw.justifyCenter, tw.bgBlue100]}>
            <BodyText center sm>
              No Images
            </BodyText>
          </View>
        )}
        <View style={[tw.flexCol, tw.justifyCenter, tw.mY1, tw.flex1]}>
          <BodyText style={[tw.textGray900]}>{address.includes(',') ? address.split(',')[0] : address}</BodyText>
          <BodyText style={[tw.textGray900]}>{`${city}, ${state} ${zip}`}</BodyText>
          {lastTouredTime && (
            <BodyText bold>{`Toured on ${dateFormat(lastTouredTime * 1000, 'mmm dd, yyyy')}`}</BodyText>
          )}
          {isCustomListing ? <CustomPill containerStyle={[tw.mY2]} /> : null}
        </View>

        <View style={[tw.hFull, tw.justifyCenter, tw.itemsEnd]}>
          {status === 'Closed' ? (
            <BodyText semibold lg style={[tw.textRed500]}>
              Closed
            </BodyText>
          ) : (
            cardIcon
          )}
          {status === 'Closed' && active && (
            <Image source={RemoveIcon} style={{ width: 22, height: 22 }} resizeMode="contain" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default PropertyCard;
