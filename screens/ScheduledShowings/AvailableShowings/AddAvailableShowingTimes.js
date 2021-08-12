import React, { useContext, useEffect, useState } from 'react';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { color, tw } from 'react-native-tailwindcss';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import dateFormat from 'dateformat';
import { ScrollView, View, TouchableOpacity, Platform, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { roundUpToNearest15MinuteInterval } from '../../../helpers/dateHelpers';
import AgentTabContext from '../../../navigation/AgentTabContext';
import { BodyText, PrimaryButton, SecondaryButton } from '../../../components';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, DateIcon } from '../../../assets/images';
import ShowingContext from '../ShowingContext';
import { calendarService, notificationService, tourService } from '../../../services';
import { buildEditDeleteLAAvailabilitySlot } from '../../../notifications/messageBuilder';

const AddAvailableShowingTimes = ({ navigation }) => {
  const { setNavigationParams } = useContext(AgentTabContext);
  const { selectedPropertyListing, availableTimeSlotListings } = useContext(ShowingContext);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hasSetStartTime, setHasSetStartTime] = useState(false);
  const [hasSetEndTime, setHasSetEndTime] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [tempMarkedDate, setTempMarkedDate] = useState({});
  const [selectedMarkedDate, setSelectedMarkedDate] = useState({});
  const [isUpdate, setIsUpdate] = React.useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    date: '',
    startTime: '',
    endTime: '',
  });

  const [showDateModal, setShowDateModal] = useState(false);
  const [showStartTimeModal, setShowStartTimeModal] = useState(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState(false);

  const resetStartTime = () => setStartTime(startDate);
  const resetEndTime = () => setEndTime(endDate);
  const startTimeTimeStamp = startDate ? Math.floor(startDate.getTime() / 1000) : null;

  const selectedShowTimes = navigation.getParam('selectedShowTimes', null);

  useEffect(() => {
    if (selectedShowTimes) {
      const { startTime: selectedStartTime, endDatetime: selectedEndTime } = selectedShowTimes;
      const selectDate = new Date(selectedStartTime * 1000);
      const selectStartTime = new Date(selectedStartTime * 1000);
      const selectEndTime = new Date(selectedEndTime * 1000);
      const markedDateFormat = dateFormat(selectDate, 'isoDate');
      const marked = tempMarkedDate;

      marked[markedDateFormat] = { selected: true };
      setTempMarkedDate(marked);
      setSelectedMarkedDate(marked);

      setHasSetStartTime(true);
      setStartDate(roundUpToNearest15MinuteInterval(selectStartTime));
      setStartTime(roundUpToNearest15MinuteInterval(selectStartTime));

      setHasSetEndTime(true);
      setEndDate(roundUpToNearest15MinuteInterval(selectEndTime));
      setEndTime(roundUpToNearest15MinuteInterval(selectEndTime));
    }
  }, [selectedShowTimes]);

  useEffect(() => {
    if (startDate && Platform.OS === 'ios') {
      setStartDate(startDate);
      setStartTime(startDate);
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate && Platform.OS === 'ios') {
      setEndDate(endDate);
      setEndTime(endDate);
    }
  }, [endDate]);

  const validateAddAvailableShowingTimesFields = () => {
    try {
      const dateValid = validateDates(getDate());
      const startTimeValid = validateStartTime(startTime);
      const endTimeValid = validateEndTime(endTime);

      return dateValid && startTimeValid && endTimeValid;
    } catch (error) {
      console.log('Error validating add available showing times fields: ', error);
      setErrors(prevState => ({
        ...prevState,
        error: 'Error validating add available showing times',
      }));
    }
  };

  const validateDates = dates => {
    if (!dates) {
      setErrors(prevState => ({
        ...prevState,
        date: 'Date is required',
      }));

      return false;
    }

    setErrors(prevState => ({ ...prevState, date: '' }));

    return true;
  };

  const validateStartTime = time => {
    if (!time) {
      setErrors(prevState => ({ ...prevState, startTime: 'Start time is required' }));

      return false;
    }

    setErrors(prevState => ({ ...prevState, startTime: '' }));

    return true;
  };

  const validateEndTime = time => {
    if (!time) {
      setErrors(prevState => ({
        ...prevState,
        endTime: 'End time is required',
      }));

      return false;
    }
    if (Math.floor(new Date(time).getTime() / 1000) <= Math.floor(new Date(startTime).getTime() / 1000)) {
      setErrors(prevState => ({
        ...prevState,
        endTime: 'Please select an end time greatet then start time',
      }));

      return false;
    }

    setErrors(prevState => ({ ...prevState, endTime: '' }));

    return true;
  };

  const getStartTimeStamp = orignalDate => {
    const startTimeDate = new Date(orignalDate);
    const startHours = new Date(startTime).getHours();
    const startMinutes = new Date(startTime).getMinutes();

    startTimeDate.setHours(startHours);
    startTimeDate.setMinutes(startMinutes);
    startTimeDate.setDate(startTimeDate.getDate() + 1);

    return startTimeDate.getTime() / 1000;
  };

  const getEndTimeStamp = orignalDate => {
    const endTimeDate = new Date(orignalDate);
    const endHours = new Date(endTime).getHours();
    const endMinutes = new Date(endTime).getMinutes();

    endTimeDate.setHours(endHours);
    endTimeDate.setMinutes(endMinutes);
    endTimeDate.setDate(endTimeDate.getDate() + 1);

    return endTimeDate.getTime() / 1000;
  };

  const onConfirmPress = async () => {
    if (isTimeAlreayPresent()) {
      Alert.alert('Slot Already Present', 'Selected time slot is already present in the available timings');
    } else {
      setLoading(true);
      try {
        const fieldsValid = validateAddAvailableShowingTimesFields();

        if (!fieldsValid) {
          return;
        }
        await Promise.all(
          getOrignalDate().map(orignalDate => {
            const firstSlot = availableTimeSlotListings.filter(
              item => item.endDatetime === getStartTimeStamp(orignalDate)
            );
            const secondSlot = availableTimeSlotListings.filter(
              item => item.startTime === getEndTimeStamp(orignalDate)
            );

            const apiData = {
              listingAgentId: selectedPropertyListing.listingAgentId,
              propertyListingId: selectedPropertyListing.id,
              startDatetime: getStartTimeStamp(orignalDate),
              endDatetime: getEndTimeStamp(orignalDate),
              firstSlotId: firstSlot.length > 0 ? firstSlot[0].availbilityId : null,
              secondSlotId: secondSlot.length > 0 ? secondSlot[0].availbilityId : null,
              firstSlotStartTime: firstSlot.length > 0 ? Math.floor(firstSlot[0].startTime) : null,
              secondSlotEndTime: secondSlot.length > 0 ? Math.floor(secondSlot[0].endDatetime) : null,
            };

            return calendarService.mutations.addListingAgentAvailbility(apiData);
          })
        );
        setLoading(false);
        navigation.goBack();
      } catch (error) {
        console.log('Error setting add available showing times: ', error);
        setErrors(prevState => ({
          ...prevState,
          error: 'An error occurred attempting to add available showing times.',
        }));
        setLoading(false);
      }
    }
  };

  const updateTimeSlot = async stopsToRemove => {
    setLoading(true);
    try {
      const fieldsValid = validateAddAvailableShowingTimesFields();

      if (!fieldsValid) {
        return;
      }

      if (stopsToRemove) {
        await Promise.all(
          stopsToRemove.map(async dataValue => {
            await sendNotificationOnEditDeleteLASlot(dataValue);

            return tourService.mutations.deleteTourStop(dataValue.tourstopId);
          })
        );
      }
      await Promise.all(
        getOrignalDate().map(orignalDate => {
          const firstSlot = availableTimeSlotListings.filter(
            item => item.endDatetime === getStartTimeStamp(orignalDate)
          );
          const secondSlot = availableTimeSlotListings.filter(item => item.startTime === getEndTimeStamp(orignalDate));
          const apiData = {
            id: selectedShowTimes.availbilityId,
            listingAgentId: selectedPropertyListing.listingAgentId,
            propertyListingId: selectedPropertyListing.id,
            startDatetime: getStartTimeStamp(orignalDate),
            endDatetime: getEndTimeStamp(orignalDate),
            firstSlotId: firstSlot.length > 0 ? firstSlot[0].availbilityId : null,
            secondSlotId: secondSlot.length > 0 ? secondSlot[0].availbilityId : null,
            firstSlotStartTime: firstSlot.length > 0 ? Math.floor(firstSlot[0].startTime) : null,
            secondSlotEndTime: secondSlot.length > 0 ? Math.floor(secondSlot[0].endDatetime) : null,
          };

          return calendarService.mutations.updateListingAgentAvailbility(apiData);
        })
      );
      setLoading(false);
      navigation.goBack();
    } catch (error) {
      console.log('Error setting update available showing times: ', error);
      setErrors(prevState => ({
        ...prevState,
        error: 'An error occurred attempting to update available showing times.',
      }));
      setLoading(false);
    }
  };

  const sendNotificationOnEditDeleteLASlot = async data => {
    const timeRangeStart = dateFormat(data.startTime * 1000, 'h:MMtt');
    const timeRangeEnd = dateFormat((data.startTime + data.duration * 3600) * 1000, 'h:MMtt');
    const { push, sms, email } = buildEditDeleteLAAvailabilitySlot({
      laName: `${data.listingAgentFirstName} ${data.listingAgentLastName}`,
      baName: `${data.buyingAgentFirstName} ${data.buyingAgentLastName}`,
      date: dateFormat(data.startTime * 1000, 'ddd mmm dd yyyy'),
      address: data.address,
      timeRange: `${timeRangeStart} to ${timeRangeEnd}`,
    });

    const sentNotification = await notificationService.mutations.createNotification({
      userId: data.clientId,
      pushMessage: push,
      smsMessage: sms,
      email,
    });

    return sentNotification;
  };

  const onUpdatePress = async () => {
    const stopsToRemove = await getRemoveStops();

    if (isTimeAlreayPresent()) {
      Alert.alert('Slot Already Present', 'Selected time slot is already present in the available timings');
    } else if (stopsToRemove.length) {
      Alert.alert(
        'Tour stop may be removed',
        'Previous time slots contains some booked slot.\nContinuing will remove booked slots.',
        [
          {
            text: 'Cancel',
            onPress: () => console.log('Cancel Pressed'),
          },
          {
            text: 'Continue',
            onPress: () => updateTimeSlot(stopsToRemove),
          },
        ]
      );
    } else {
      updateTimeSlot();
    }
  };

  const onCancelPress = () => {
    navigation.goBack();
  };

  const onDayPress = day => {
    if (selectedShowTimes) {
      const marked = {};

      if (!marked[day.dateString]) {
        marked[day.dateString] = { selected: true };
      } else {
        delete marked[day.dateString];
      }
      setIsUpdate(!isUpdate);
      setTempMarkedDate(marked);
    } else {
      const marked = tempMarkedDate;

      if (!marked[day.dateString]) {
        marked[day.dateString] = { selected: true };
      } else {
        delete marked[day.dateString];
      }
      setIsUpdate(!isUpdate);
      setTempMarkedDate(marked);
    }
  };

  const getPropertyAddress = () => {
    if (selectedPropertyListing) {
      return `${
        selectedPropertyListing.address.includes(',')
          ? selectedPropertyListing.address.split(',')[0]
          : selectedPropertyListing.address
      }`;
    }

    return 'Address Not Available';
  };

  const onSelectDates = () => {
    setSelectedMarkedDate(tempMarkedDate);
    setShowDateModal(false);
    setErrors(prevState => ({ ...prevState, date: '' }));
  };

  const getDate = () => {
    if (!selectedMarkedDate) return '';

    return Object.keys(selectedMarkedDate)
      .map(value => dateFormat(value, 'mmm dd', true))
      .join(', ');
  };

  const getOrignalDate = () => {
    if (!selectedMarkedDate) return '';

    return Object.keys(selectedMarkedDate).map(value => value);
  };

  const datePicker = () => {
    const borderColor = errors.date ? tw.borderRed500 : tw.borderGray700;

    return (
      <View>
        <TouchableOpacity onPress={() => setShowDateModal(true)} activeOpacity={0.9} style={[tw.wFull, tw.mY2]}>
          <View style={[tw.wFull, tw.flexRow]}>
            <View style={[tw.flex1, tw.borderB, tw.pL2, borderColor]}>
              <BodyText style={[tw.mT6]}>Date</BodyText>
              <View style={[tw.flexRow, tw.justifyBetween]}>
                <BodyText xl style={[tw.textGray700, tw.pY2, tw.flex1]}>
                  {getDate()}
                </BodyText>
                <DateIcon style={[tw.mS3, tw.mR4, tw.selfEnd, tw.mY2]} width={20} height={20} />
              </View>
            </View>
          </View>

          {errors.date ? <BodyText style={[tw.textXs, tw.textRed500, tw.mL2, tw.mT2]}>{errors.date}</BodyText> : null}
        </TouchableOpacity>
        <Modal
          isVisible={showDateModal}
          onShow={() => {
            setTempMarkedDate({ ...selectedMarkedDate });
          }}
          onBackdropPress={() => {
            setShowDateModal(false);
            setTempMarkedDate({});
          }}
        >
          <View style={[tw.mT2, tw.bgWhite, tw.textCenter]}>
            <BodyText style={[tw.textLg, tw.mY2, tw.wFull, tw.textCenter, tw.borderB2, tw.borderGray500]}>
              Select Date
            </BodyText>
            <Calendar
              // Initially visible month. Default = Date()
              current={new Date()}
              // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
              minDate={new Date()}
              // Handler which gets executed on day press. Default = undefined
              onDayPress={day => onDayPress(day)}
              // Month format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting
              monthFormat="MMMM yyyy"
              // Replace default arrows with custom ones (direction can be 'left' or 'right')
              renderArrow={direction =>
                direction === 'left' ? (
                  <ChevronLeftIcon width={15} height={15} />
                ) : (
                  <ChevronRightIcon width={15} height={15} />
                )
              }
              // Do not show days of other months in month page. Default = false
              hideExtraDays
              // day from another month that is visible in calendar page. Default = false
              disableMonthChange
              // If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday.
              firstDay={1}
              // Show week numbers to the left. Default = false
              showWeekNumbers
              // Handler which gets executed when press arrow icon left. It receive a callback can go back month
              onPressArrowLeft={subtractMonth => subtractMonth()}
              // Handler which gets executed when press arrow icon right. It receive a callback can go next month
              onPressArrowRight={addMonth => addMonth()}
              // Disable all touch events for disabled days. can be override with disableTouchEvent in markedDates
              disableAllTouchEventsForDisabledDays
              markedDates={{ ...tempMarkedDate }}
            />
            <View style={[tw.m4]}>
              <PrimaryButton containerStyle={[tw.pX2]} title="SELECT DATES" onPress={() => onSelectDates()} />
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const startTimePicker = () => {
    const borderColor = errors.startTime ? tw.borderRed500 : tw.borderGray700;
    const timeStr = startDate && hasSetStartTime ? dateFormat(startDate, 'shortTime') : '';

    return (
      <View>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[tw.wFull, tw.flexCol, tw.mY2]}
          onPress={() => setShowStartTimeModal(true)}
        >
          <View style={[tw.wFull, tw.flexRow]}>
            <View style={[tw.relative, tw.flex1, tw.borderB, tw.pL2, borderColor]}>
              <BodyText style={[tw.mT6]}>Start Time</BodyText>
              <BodyText lg style={[tw.textGray700, tw.pY2]}>
                {timeStr || ''}
              </BodyText>
              <ClockIcon
                style={[tw.absolute, tw.right0, tw.bottom0, tw.mR4, tw.mB2]}
                width={20}
                height={20}
                fill={color.gray700}
                stroke={color.gray700}
              />
            </View>
          </View>

          {errors.startTime ? (
            <BodyText style={[tw.textXs, tw.textRed500, tw.mL2, tw.mT2]}>{errors.startTime}</BodyText>
          ) : null}
        </TouchableOpacity>
        {Platform.OS === 'ios' ? (
          <Modal
            isVisible={showStartTimeModal}
            onBackdropPress={() => {
              setShowStartTimeModal(false);
              resetStartTime();
            }}
          >
            <View style={[tw.mT2, tw.bgWhite]}>
              <BodyText style={[tw.textLg, tw.mY2, tw.wFull, tw.textCenter, tw.borderB2, tw.borderGray500]}>
                Select Start Time
              </BodyText>

              <DateTimePicker
                value={startTime || roundUpToNearest15MinuteInterval(new Date())}
                mode="time"
                display="spinner"
                minuteInterval={15}
                textColor="black"
                onChange={(event, evtTime) => setStartTime(roundUpToNearest15MinuteInterval(evtTime))}
              />

              <View style={[tw.m4]}>
                <PrimaryButton
                  containerStyle={[tw.pX2]}
                  title="SELECT START TIME"
                  onPress={() => {
                    if (endDate) {
                      setEndDate(null);
                      setEndTime(null);
                      resetEndTime();
                      setStartDate(roundUpToNearest15MinuteInterval(startTime || new Date()));
                      setErrors(prevState => ({ ...prevState, startTime: '' }));
                      setHasSetStartTime(true);
                      setShowStartTimeModal(false);
                    } else {
                      setStartDate(roundUpToNearest15MinuteInterval(startTime || new Date()));
                      setErrors(prevState => ({ ...prevState, startTime: '' }));
                      setHasSetStartTime(true);
                      setShowStartTimeModal(false);
                      // startTimeTimeStamp = new Date(startDate).getTime();
                    }
                  }}
                />
              </View>
            </View>
          </Modal>
        ) : (
          showStartTimeModal && (
            <DateTimePicker
              value={startDate || roundUpToNearest15MinuteInterval(new Date())}
              mode="time"
              display="spinner"
              minuteInterval={15}
              onChange={(event, evtDate) => {
                setShowStartTimeModal(false);
                if (evtDate) {
                  if (startDate) {
                    evtDate.setDate(startDate.getDate());
                    evtDate.setMonth(startDate.getMonth());
                    evtDate.setFullYear(startDate.getFullYear());
                    // startTimeTimeStamp = new Date(startDate).getTime();
                  }

                  setStartDate(roundUpToNearest15MinuteInterval(evtDate));
                  setHasSetStartTime(true);
                  setErrors(prevState => ({ ...prevState, startTime: '' }));
                }
              }}
            />
          )
        )}
      </View>
    );
  };

  const endTimePicker = () => {
    const borderColor = errors.endTime ? tw.borderRed500 : tw.borderGray700;
    const timeStr = endDate && hasSetEndTime ? dateFormat(endDate, 'shortTime') : '';

    return (
      <View>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[tw.wFull, tw.flexCol, tw.mY2]}
          onPress={() => setShowEndTimeModal(true)}
        >
          <View style={[tw.wFull, tw.flexRow]}>
            <View style={[tw.relative, tw.flex1, tw.borderB, tw.pL2, borderColor]}>
              <BodyText style={[tw.mT6]}>End Time</BodyText>
              <BodyText lg style={[tw.textGray700, tw.pY2]}>
                {timeStr || ''}
              </BodyText>
              <ClockIcon
                style={[tw.absolute, tw.right0, tw.bottom0, tw.mR4, tw.mB2]}
                width={20}
                height={20}
                fill={color.gray700}
                stroke={color.gray700}
              />
            </View>
          </View>

          {errors.endTime ? (
            <BodyText style={[tw.textXs, tw.textRed500, tw.mL2, tw.mT2]}>{errors.endTime}</BodyText>
          ) : null}
        </TouchableOpacity>
        {Platform.OS === 'ios' ? (
          <Modal
            isVisible={showEndTimeModal}
            onBackdropPress={() => {
              setShowEndTimeModal(false);
              resetEndTime();
            }}
          >
            <View style={[tw.mT2, tw.bgWhite]}>
              <BodyText style={[tw.textLg, tw.mY2, tw.wFull, tw.textCenter, tw.borderB2, tw.borderGray500]}>
                Select End Time
              </BodyText>

              <DateTimePicker
                value={endTime || roundUpToNearest15MinuteInterval(new Date())}
                mode="time"
                display="spinner"
                minuteInterval={15}
                textColor="black"
                onChange={(event, evtTime) => setEndTime(roundUpToNearest15MinuteInterval(evtTime))}
              />

              <View style={[tw.m4]}>
                <PrimaryButton
                  containerStyle={[tw.pX2]}
                  title="SELECT END TIME"
                  onPress={() => {
                    const endTimeTimeStamp = Math.floor(
                      new Date(roundUpToNearest15MinuteInterval(endTime || new Date())).getTime() / 1000
                    );

                    if (endTimeTimeStamp > startTimeTimeStamp) {
                      setEndDate(roundUpToNearest15MinuteInterval(endTime || new Date()));
                      setErrors(prevState => ({ ...prevState, endTime: '' }));
                      setHasSetEndTime(true);
                      setShowEndTimeModal(false);
                    } else {
                      setShowEndTimeModal(false);
                      setErrors(prevState => ({
                        ...prevState,
                        endTime: 'Please select an end time greatet then start time.',
                      }));
                      setEndDate(null);
                    }
                  }}
                />
              </View>
            </View>
          </Modal>
        ) : (
          showEndTimeModal && (
            <DateTimePicker
              value={endDate || roundUpToNearest15MinuteInterval(new Date())}
              mode="time"
              display="spinner"
              minuteInterval={15}
              onChange={(event, evtDate) => {
                setShowEndTimeModal(false);
                if (evtDate) {
                  const endTimeTimeStamp = Math.floor(
                    new Date(roundUpToNearest15MinuteInterval(endTime || new Date())).getTime() / 1000
                  );

                  if (endDate) {
                    // endTimeTimeStamp = new Date(endDate).getTime();
                    evtDate.setDate(endDate.getDate());
                    evtDate.setMonth(endDate.getMonth());
                    evtDate.setFullYear(endDate.getFullYear());
                  }
                  if (endTimeTimeStamp > startTimeTimeStamp) {
                    setEndDate(roundUpToNearest15MinuteInterval(evtDate));
                    setHasSetEndTime(true);
                    setErrors(prevState => ({ ...prevState, endTime: '' }));
                  } else {
                    setErrors(prevState => ({
                      ...prevState,
                      endTime: 'Please select an end time greatet then start time.',
                    }));
                    setEndDate(null);
                  }
                }
              }}
            />
          )
        )}
      </View>
    );
  };

  const isTimeAlreayPresent = () => {
    let startDateTimeStamp;
    let endDateTimeStamp;

    getOrignalDate().map(orignalDate => {
      startDateTimeStamp = getStartTimeStamp(orignalDate);
      endDateTimeStamp = getEndTimeStamp(orignalDate);

      return null;
    });
    const tempArr = availableTimeSlotListings.filter(value => {
      const { startTime: startDateTime, endDatetime } = value;

      if (endDateTimeStamp <= startDateTime || endDatetime <= startDateTimeStamp) {
        return false;
      }
      if (selectedShowTimes && selectedShowTimes.availbilityId === value.availbilityId) {
        return false;
      }

      return true;
    });

    return tempArr.length !== 0;
  };

  const getRemoveStops = async () => {
    const { startTime: selectedStartTime, endDatetime: selectedEndTime } = selectedShowTimes;
    const params = {
      listing_id: selectedPropertyListing.listingId,
      start_time: selectedStartTime,
      end_datetime: selectedEndTime,
    };

    const Listings = await calendarService.queries.agentTimeSlotDetails(params);
    const isAnyBookedProperty = Listings.filter(value => value.status !== 'available').sort(
      (a, b) => parseInt(a.startTime) - parseInt(b.startTime)
    );
    const stopsToRemove = [];

    getOrignalDate().map(orignalDate => {
      const startDatetime = getStartTimeStamp(orignalDate);
      const endDatetime = getEndTimeStamp(orignalDate);

      isAnyBookedProperty.map(value => {
        const { startTime: bookedStartTime, duration: bookedDuration } = value;
        const bookedEndTime = bookedStartTime + bookedDuration * 60 * 60;

        if (bookedStartTime < startDatetime || bookedEndTime > endDatetime) {
          stopsToRemove.push(value);
        }

        return null;
      });

      return null;
    });

    return stopsToRemove;
  };

  return (
    <>
      <ScrollView contentContainerStyle={[tw.flex1]}>
        <NavigationEvents
          onWillFocus={() =>
            setNavigationParams({
              headerTitle: 'Available Show Times',
              showBackBtn: true,
              showSettingsBtn: true,
            })
          }
        />
        <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol, tw.flex1]}>
          <View style={[tw.mT5, tw.pX8]}>
            <BodyText xl bold>
              {getPropertyAddress()}
            </BodyText>
            <View style={[tw.flexRow, tw.mT2]}>
              <BodyText md bold>
                {`Client: ${
                  selectedPropertyListing && selectedPropertyListing.seller
                    ? `${selectedPropertyListing.seller.firstName} ${selectedPropertyListing.seller.lastName}`
                    : 'Not Available'
                }`}
              </BodyText>
            </View>
          </View>
          <View style={[tw.mY8, tw.pX8, tw.flex1]}>
            {datePicker()}
            {startTimePicker()}
            {endTimePicker()}
          </View>
          <View style={[tw.pT2, tw.pX8, tw.mB2, tw.borderT, tw.borderGray300]}>
            {selectedShowTimes ? (
              <>
                <PrimaryButton
                  title="UPDATE AVAILABLE TIME"
                  onPress={onUpdatePress}
                  loading={loading}
                  loadingTitle="UPDATING"
                />
                <SecondaryButton
                  title="CANCEL"
                  onPress={onCancelPress}
                  style={[tw.border2, tw.borderBlue500, tw.mT2]}
                  textStyle={[tw.textBlue500]}
                />
              </>
            ) : (
              <PrimaryButton
                title="CONFIRM AVAILABLE TIMES"
                onPress={onConfirmPress}
                loading={loading}
                loadingTitle="SAVING"
              />
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
};

export default withNavigationFocus(AddAvailableShowingTimes);
