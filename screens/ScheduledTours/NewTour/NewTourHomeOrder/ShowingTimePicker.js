import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Platform, useColorScheme } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { tw } from 'react-native-tailwindcss';
import Modal from 'react-native-modal';
import dateformat from 'dateformat';
import { FontAwesome5 } from '@expo/vector-icons';
import { BodyText, PrimaryButton, DropdownInput } from '../../../../components';
import { durationToString } from '../../../../helpers';
import { ClockIcon } from '../../../../assets/images';
import { roundUpToNearest15MinuteInterval } from '../../../../helpers/dateHelpers';

const ShowingTimePicker = ({ tourStartTime, tourStop, updateTimeOnTourStop, index }) => {
  const [showForm, setShowForm] = useState(false);
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(tourStop.duration);
  const [arrivalTime, setArrivalTime] = useState(
    tourStop.startTime ? new Date(parseInt(tourStop.startTime * 1000)) : null
  );
  const [tempTime, setTempTime] = useState(arrivalTime || new Date(parseInt(tourStartTime * 1000)));
  const tourStartDate = new Date(parseInt(tourStartTime) * 1000);

  const isDarkMode = useColorScheme() === 'dark';

  // Android is dumb and will keep reopening the modal if you attempt to set the state on close
  useEffect(() => {
    if (timeModalOpen && Platform.OS === 'android') {
      setTimeModalOpen(false);
    }
  }, [timeModalOpen]);

  useEffect(() => {
    setSelectedDuration(tourStop.duration);
  }, [tourStop.duration]);

  useEffect(() => {
    if (tourStop.startTime) {
      setArrivalTime(new Date(parseInt(tourStop.startTime * 1000)));
    }
  }, [tourStop.startTime]);

  useEffect(() => {
    if (arrivalTime) {
      setTempTime(arrivalTime);
    }
  }, [arrivalTime]);

  const durations = [];
  let currentDuration = 0.25;

  while (currentDuration <= 10) {
    durations.push(currentDuration);
    currentDuration += 0.25;
  }

  const renderTimePicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <Modal
          isVisible={timeModalOpen}
          onBackdropPress={() => {
            setTempTime(arrivalTime || new Date(parseInt(tourStartTime * 1000)));
            setTimeModalOpen(false);
          }}
        >
          <View style={[tw.mT2, isDarkMode ? tw.bgGray800 : tw.bgWhite]}>
            <BodyText
              style={[
                tw.textLg,
                tw.mY2,
                tw.wFull,
                tw.textCenter,
                tw.borderB2,
                tw.borderGray500,
                isDarkMode ? tw.textGray300 : null,
              ]}
            >
              Showing Arrival Time
            </BodyText>

            <DateTimePicker
              value={roundUpToNearest15MinuteInterval(tempTime)}
              mode="time"
              display="spinner"
              minuteInterval={15}
              onChange={(event, evtTime) => setTempTime(evtTime)}
            />

            <View style={[tw.m4]}>
              <PrimaryButton
                containerStyle={[tw.pX2]}
                title="Confirm Time"
                onPress={() => {
                  setArrivalTime(tempTime);
                  setTimeModalOpen(false);
                }}
              />
            </View>
          </View>
        </Modal>
      );
    }

    if (timeModalOpen) {
      return (
        <DateTimePicker
          value={roundUpToNearest15MinuteInterval(tempTime)}
          mode="time"
          display="spinner"
          minuteInterval={15}
          onChange={(event, evtDate) => {
            if (evtDate) {
              if (tourStartDate) {
                evtDate.setDate(tourStartDate.getDate());
                evtDate.setMonth(tourStartDate.getMonth());
                evtDate.setFullYear(tourStartDate.getFullYear());
              }

              setArrivalTime(roundUpToNearest15MinuteInterval(evtDate));
            }

            setTimeModalOpen(false);
          }}
        />
      );
    }

    return null;
  };

  return (
    <View style={[tw.mX4, tw.flexCol]}>
      <View>
        <TouchableOpacity
          onPress={() => setShowForm(true)}
          style={[tw.flexCol, tw.w20, tw.itemsCenter, tw.justifyBetween]}
        >
          <View style={[tw.flexRow, tw.mL2, tw.wFull, tw.itemsCenter]}>
            <ClockIcon height={15} width={15} style={[tw.mR2]} fill="#000" />

            <BodyText style={[tw.textBlue400]} sm>
              {tourStop.startTime ? dateformat(new Date(parseInt(tourStop.startTime) * 1000), 'h:MMtt') : 'Set Time'}
            </BodyText>
          </View>
          <View style={[tw.mL2, tw.mT1, tw.flexRow, tw.wFull, tw.itemsCenter]}>
            <FontAwesome5 name="hourglass-half" style={[tw.mL1, tw.mR2]} />

            <BodyText style={[tw.textBlue400]} sm>
              {durationToString(tourStop.duration, 'short')}
            </BodyText>
          </View>
        </TouchableOpacity>

        <Modal isVisible={showForm} onBackdropPress={() => setShowForm(false)}>
          <View style={[tw.w5_6, tw.p4, tw.selfCenter, tw.bgWhite]}>
            <View style={[tw.flexRow, tw.justifyBetween, tw.itemsCenter]}>
              <BodyText style={[tw.flex1]}>
                {tourStop.propertyOfInterest.propertyListing.address.includes(',')
                  ? tourStop.propertyOfInterest.propertyListing.address.split(',')[0]
                  : tourStop.propertyOfInterest.propertyListing.address}
              </BodyText>

              <View style={[tw.w8, tw.h8, tw.roundedFull, tw.bgBlue500, tw.itemsCenter, tw.justifyCenter]}>
                <BodyText bold style={[tw.textWhite]}>
                  {index}
                </BodyText>
              </View>
            </View>

            <View style={[tw.wFull, tw.flexRow]}>
              <View style={[tw.relative, tw.flex1, tw.borderB, tw.borderGray700, tw.pL2]}>
                <BodyText style={[tw.mT6]}>Arrival Time</BodyText>
                <TouchableOpacity style={[tw.flexRow]} onPress={() => setTimeModalOpen(true)}>
                  <BodyText md style={[tw.textGray700, tw.pY2]}>
                    {arrivalTime ? dateformat(arrivalTime, 'm/d/yyyy h:MMtt') : 'Choose a Time'}
                  </BodyText>
                  <ClockIcon style={[tw.absolute, tw.right0, tw.bottom0, tw.mR2, tw.mB2]} width={20} height={20} />
                </TouchableOpacity>
              </View>
            </View>

            {renderTimePicker()}

            <BodyText style={[tw.mT4]}>Showing Duration</BodyText>
            <DropdownInput
              options={durations.map(duration => ({
                value: duration,
                label: durationToString(duration, 'text'),
              }))}
              value={selectedDuration}
              displayValue={durationToString(selectedDuration, 'text')}
              onSelect={selection => setSelectedDuration(selection)}
            />

            <PrimaryButton
              style={[tw.mT8]}
              title="Confirm Time"
              disabled={!selectedDuration || !arrivalTime}
              onPress={() => {
                updateTimeOnTourStop(tourStop, selectedDuration, parseInt(arrivalTime.getTime() / 1000), arrivalTime);
                setShowForm(false);
              }}
            />
          </View>
        </Modal>
      </View>
    </View>
  );
};

export default ShowingTimePicker;
