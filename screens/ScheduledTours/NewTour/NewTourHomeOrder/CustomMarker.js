import React from 'react';
import { View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { Marker } from 'react-native-maps';
import { MapPinIcon, ChevronRightIcon } from '../../../../assets/images';
import { BodyText, AgentModal, PrimaryButton } from '../../../../components';
import { durationToString } from '../../../../helpers';

const CustomMarker = ({ isPrimary, label, coordinate, tourStop, updateLocation, navigation }) => {
  const primaryColor = isPrimary ? color.blue500 : color.white;

  const updateDuration = newDuration => {
    if (tourStop) {
      updateLocation({ ...tourStop, duration: newDuration });
    }
  };

  const durations = [];
  let currentDuration = 0.25;

  while (currentDuration <= 10) {
    durations.push(currentDuration);
    currentDuration += 0.25;
  }

  const durationCards = durations.map((durationOption, idx) => (
    <DurationCard
      key={`durationOption-${idx}`}
      durationOption={durationOption}
      onPress={() => {
        updateDuration(durationOption);
        navigation.goBack(null);
      }}
    />
  ));

  return (
    <AgentModal
      title="Showing Duration"
      trigger={
        <Marker
          coordinate={coordinate}
          flat
          pinColor={primaryColor}
          tracksViewChanges={Platform.OS !== 'android'}
          key={`custom-marker-${(tourStop && tourStop.id) || 'start'}-${label}`}
        >
          <CustomPin label={label} isPrimary={isPrimary} />
        </Marker>
      }
      navigation={navigation}
      style={[tw.pX0]}
    >
      <View style={[tw.hFull]}>
        <View style={[tw.w5_6, tw.selfCenter]}>
          <BodyText xl2 center>
            How long do you plan to be here?
          </BodyText>
        </View>
        <ScrollView style={[tw.hFull]}>{durationCards}</ScrollView>
        <View style={[tw.h48]} />
      </View>
      <PrimaryButton
        title="Done"
        onPress={() => {
          navigation.goBack(null);
        }}
        style={[tw.bgBlue500]}
      />
    </AgentModal>
  );
};

const DurationCard = ({ onPress, style = [], durationOption }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    style={[tw.shadow, tw.wFull, tw.h20, tw.bgGray100, tw.mT1, tw.pX4, tw.flexRow, ...style]}
  >
    <View style={[tw.flex1, tw.flexRow, tw.itemsCenter, tw.pR2, tw.pL4]}>
      <BodyText bold style={[tw.wFull]}>
        {durationToString(durationOption, 'long')}
      </BodyText>
    </View>
    <View style={[tw.hFull, tw.justifyCenter, tw.p2, tw.pX1]}>
      <View style={[tw.w10, tw.h10, tw.border2, tw.borderBlue500, tw.roundedFull, tw.itemsCenter, tw.justifyCenter]}>
        <BodyText bold style={[tw.textBlue500]}>
          {durationToString(durationOption)}
        </BodyText>
      </View>
    </View>
    <View style={[tw.hFull, tw.justifyCenter, tw.p2]}>
      <ChevronRightIcon width={18} height={18} fill={color.blue400} stroke={color.white} />
    </View>
  </TouchableOpacity>
);

const CustomPin = ({ isPrimary, label }) => {
  const primaryColor = isPrimary ? color.blue500 : color.white;
  const secondaryColor = isPrimary ? color.blue400 : color.gray500;

  return (
    <View style={[tw.relative]}>
      <MapPinIcon
        width={32}
        height={37}
        fill={secondaryColor}
        stroke={primaryColor}
        style={[Platform.OS === 'ios' ? tw.mB6 : null]}
      />
      <View
        style={[
          tw.absolute,
          tw.top0,
          tw.left0,
          tw.mT1,
          tw.mL2,
          isPrimary ? tw.bgBlue500 : tw.bgGray600,
          tw.roundedFull,
          tw.w4,
          tw.h4,
          tw.justifyCenter,
          tw.itemsCenter,
        ]}
      >
        <BodyText style={[tw.textWhite, tw.textSm]}>{label}</BodyText>
      </View>
    </View>
  );
};

export default CustomMarker;
