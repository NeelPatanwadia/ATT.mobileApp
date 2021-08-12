import React, { useState, useEffect } from 'react';
import { View, Platform, TouchableOpacity, useColorScheme } from 'react-native';
import dateformat from 'dateformat';
import { color, tw } from 'react-native-tailwindcss';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from 'react-native-modal';

import { BodyText, PrimaryButton } from '../../../components';
import { ClockIcon } from '../../../assets/images';
import { roundUpToNearest15MinuteInterval } from '../../../helpers/dateHelpers';

const DatePickerForm = ({ date, setDate }) => {
  const [showPicker, setShowPicker] = useState(Platform.OS === 'android');
  const [tempTime, setTempTime] = useState(date);

  useEffect(() => {
    setTempTime(date);
  }, [date]);

  useEffect(() => {
    if (showPicker && Platform.OS === 'android') {
      setShowPicker(false);
    }
  }, [showPicker]);

  const timeStr = date ? dateformat(date, 'mm/dd/yyyy h:MMtt') : '';

  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={[tw.wFull, tw.flexCol, tw.mY2]}>
      <TouchableOpacity
        onPress={() => {
          console.log('OPENING PICKER...');
          setShowPicker(true);
        }}
      >
        <View style={[tw.wFull, tw.flexRow]}>
          <View style={[tw.relative, tw.flex1, tw.borderB, tw.borderGray700, tw.pL2]}>
            <BodyText style={[tw.mT1]}>Proposed Arrival Time</BodyText>
            <BodyText md style={[tw.textGray700, tw.pY2]}>
              {timeStr || ''}
            </BodyText>
            <ClockIcon
              style={[tw.absolute, tw.right0, tw.bottom0, tw.mR2, tw.mB2]}
              width={20}
              height={20}
              fill={color.gray700}
              stroke={color.gray700}
            />
          </View>
        </View>
      </TouchableOpacity>

      <BodyText style={[tw.mT2, tw.mB4]}>
        Select a new time and we will send a new authorization request for this showing.
      </BodyText>

      {Platform.OS === 'ios' ? (
        <>
          <Modal isVisible={showPicker} onBackdropPress={() => setShowPicker(false)}>
            <View style={[tw.mT2, isDarkMode ? tw.bgGray800 : tw.bgWhite]}>
              <DateTimePicker
                value={tempTime}
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
                    setDate(roundUpToNearest15MinuteInterval(tempTime));
                    setShowPicker(false);
                  }}
                />
              </View>
            </View>
          </Modal>
        </>
      ) : (
        showPicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="spinner"
            minuteInterval={15}
            onChange={(event, evtDate) => {
              if (evtDate) {
                const hours = evtDate.getHours();
                const minutes = evtDate.getMinutes();

                let newDate = new Date(date);

                newDate.setHours(hours);
                newDate.setMinutes(minutes);

                newDate = roundUpToNearest15MinuteInterval(newDate);
                setDate(newDate);
              }

              setShowPicker(false);
            }}
          />
        )
      )}
    </View>
  );
};

export default DatePickerForm;
