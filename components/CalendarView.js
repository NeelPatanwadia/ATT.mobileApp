import React from 'react';
import { SafeAreaView, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { tw } from 'react-native-tailwindcss';
import { ChevronLeftIcon } from '../assets/images';
import FlexLoader from './FlexLoader';
import WeekView from './react-native-week-view';
import { BodyText } from './textComponents';

const CalendarView = ({ showCalendarModal, setShowCalendarModal, tourMonth, calendarLoading, myEvents, tourDate }) => (
  <Modal
    isVisible={showCalendarModal}
    onBackdropPress={() => {
      setShowCalendarModal(false);
    }}
    onBackButtonPress={() => setShowCalendarModal(false)}
    style={[tw.m0]}
  >
    <SafeAreaView style={[tw.flex1, tw.bgWhite]}>
      <TouchableOpacity onPress={() => setShowCalendarModal(false)} style={[tw.pS2, tw.pY2, tw.selfStart, tw.pE2]}>
        <View style={[tw.flexRow, tw.alignCenter]}>
          <ChevronLeftIcon width={22} height={22} />
          <BodyText bold xl center>
            {tourMonth}
          </BodyText>
        </View>
      </TouchableOpacity>
      <View style={[tw.flex1, tw.mY1]}>
        {calendarLoading ? (
          <FlexLoader />
        ) : (
          <WeekView
            events={myEvents}
            selectedDate={tourDate}
            numberOfDays={1}
            hoursInDisplay={12}
            scrollBetweenDate={false}
            showsVerticalScrollIndicator={false}
            headerStyle={[tw.bgWhite]}
            headerTextStyle={[tw.textGray900, tw.textLg]}
            hourTextStyle={[tw.textGray700, tw.textSm]}
            eventContainerStyle={[{ width: '100%' }]}
            formatMonthHeader="MMM Y"
            is12HourFormat
          />
        )}
      </View>
    </SafeAreaView>
  </Modal>
);

export default CalendarView;
