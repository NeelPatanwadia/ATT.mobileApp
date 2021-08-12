import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import dateFormat from 'dateformat';
import { ChevronRightIcon } from '../assets/images';
import RoundSelectCircle from './RoundSelectCircle';
import { BodyText } from './textComponents';

const getFormattedTime = time => dateFormat(parseInt(time) * 1000, 'shortTime');
const getFormattedDate = date => dateFormat(parseInt(date) * 1000, 'mmm dd');

const AvailableListingCard = ({
  onPress,
  onSelectorPress,
  style = [],
  availableTimings: { startTime, duration, endDatetime, tourstopId, isSelected = false },
}) => {
  const endAvailbleTime = endDatetime || startTime + duration * 60 * 60;

  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      style={[tw.shadow, tw.wFull, tw.h16, tw.bgGray100, tw.mY2, tw.pX4, tw.flexRow, ...style]}
    >
      <View style={[tw.w5_6, tw.justifyBetween, tw.flex1, tw.flexRow, tw.itemsCenter, tw.mY1, tw.pE5]}>
        <View style={[tw.flexRow, tw.itemsCenter]}>
          {onSelectorPress && (
            <RoundSelectCircle
              key={`${tourstopId}-dot`}
              onPress={onSelectorPress}
              selected={isSelected}
              style={[tw.p2]}
              md
            />
          )}
          <View style={onSelectorPress ? [tw.mS3] : [tw.mS5]}>
            <BodyText medium style={[tw.textGray900]}>
              {getFormattedDate(startTime)}
            </BodyText>
            <BodyText sm style={[tw.textGray900, tw.mT1]}>
              {`From ${getFormattedTime(startTime)} To ${getFormattedTime(endAvailbleTime)}`}
            </BodyText>
          </View>
        </View>
        {onPress && <ChevronRightIcon width={15} height={15} />}
      </View>
    </TouchableOpacity>
  );
};

export default AvailableListingCard;
