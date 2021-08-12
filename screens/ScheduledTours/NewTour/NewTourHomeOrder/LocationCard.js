import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { HamburgerIcon } from '../../../../assets/images';
import { ShowingsIconOutline } from '../../../../assets/images/tab-icons';
import { BodyText, CustomPill } from '../../../../components';
import ShowingTimePicker from './ShowingTimePicker';

const LocationCard = ({
  onLongPress,
  showOrderBadge,
  isActive,
  style = [],
  tourStartTime,
  tourStop,
  propertyListing,
  updateTimeOnTourStop,
  index,
  onCalenderPress,
}) => (
  <View
    activeOpacity={0.7}
    style={[
      tw.shadow,
      tw.wFull,
      tw.pY4,
      tw.bgGray100,
      tw.mY1,
      tw.flexRow,
      tw.itemsCenter,
      tw.overflowVisible,
      ...style,
    ]}
  >
    <TouchableOpacity onPressIn={onLongPress} style={[tw.justifyCenter, tw.pX6]}>
      <HamburgerIcon width={20} height={20} fill={color.gray700} stroke={color.white} />
    </TouchableOpacity>

    <View style={[tw.flexRow, tw.justifyBetween, tw.itemsCenter, tw.flex1]}>
      <View style={[tw.flex1]}>
        <BodyText>
          {propertyListing.address.includes(',') ? propertyListing.address.split(',')[0] : propertyListing.address}
        </BodyText>
        <View style={[tw.flexRow, tw.itemsCenter]}>
          <BodyText
            style={[tw.flex1]}
          >{`${propertyListing.city}, ${propertyListing.state} ${propertyListing.zip}`}</BodyText>
          {!propertyListing.isCustomListing && (
            <TouchableOpacity onPress={onCalenderPress} style={[tw.p1, tw.selfEnd, tw.mS1]}>
              <ShowingsIconOutline width={22} height={22} fill={color.black} />
            </TouchableOpacity>
          )}
        </View>
        {propertyListing.isCustomListing ? <CustomPill containerStyle={[tw.mT2]} /> : null}
      </View>

      {isActive ? (
        <View
          style={[
            tw.w8,
            tw.h8,
            tw.mR6,
            isActive ? tw.bgBlue400 : tw.bgBlue500,
            tw.roundedFull,
            tw.itemsCenter,
            tw.justifyCenter,
            !showOrderBadge && !isActive && tw.hidden,
          ]}
        >
          <BodyText bold style={[tw.textWhite]}>
            {index}
          </BodyText>
        </View>
      ) : (
        <ShowingTimePicker
          tourStartTime={tourStartTime}
          tourStop={tourStop}
          index={index}
          updateTimeOnTourStop={updateTimeOnTourStop}
        />
      )}
    </View>
  </View>
);

export default LocationCard;
