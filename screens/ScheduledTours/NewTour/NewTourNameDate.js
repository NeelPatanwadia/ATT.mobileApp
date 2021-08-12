import React, { useState, useContext, useEffect } from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  useColorScheme,
} from 'react-native';
import { NavigationEvents } from 'react-navigation';
import Modal from 'react-native-modal';
import { color, tw } from 'react-native-tailwindcss';
import DateTimePicker from '@react-native-community/datetimepicker';
import dateFormat from 'dateformat';
import { roundUpToNearest15MinuteInterval } from '../../../helpers/dateHelpers';
import { BodyText, PrimaryButton, PrimaryInput, FlexLoader } from '../../../components';
import { notificationService, tourService, userService } from '../../../services';
import { ClockIcon, DateIcon } from '../../../assets/images';

import TourContext from '../TourContext';
import AgentTabContext from '../../../navigation/AgentTabContext';
import { buildDeleteShowingRequest, buildTourCreated } from '../../../notifications/messageBuilder';

const NewTourNameDate = ({
  navigation,
  screenProps: {
    user,
    user: { id: agentId },
  },
}) => {
  const { tours, setTours, tour, setTour, client, setClient } = useContext(TourContext);
  const { setNavigationParams } = useContext(AgentTabContext);
  const { name, startTime = 0 } = tour;
  const [tourName, setTourName] = useState(name || '');
  const [date, setDate] = useState(null);
  const [hasSetDate, setHasSetDate] = useState(false);
  const [hasSetTime, setHasSetTime] = useState(false);
  const [tempDate, setTempDate] = useState(null);
  const [tempTime, setTempTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    date: '',
    time: '',
  });

  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const isDarkMode = useColorScheme() === 'dark';

  const resetTempDate = () => setTempDate(date);
  const resetTempTime = () => setTempTime(date);

  const dateStr = date && hasSetDate ? dateFormat(date, 'longDate') : '';
  const timestamp = date ? Math.floor(date.getTime() / 1000) : null;

  useEffect(() => {
    if (tourName) {
      validateTourName(tourName);
    }
  }, [tourName]);

  useEffect(() => {
    if (date && Platform.OS === 'ios') {
      setTempDate(date);
      setTempTime(date);
    }
  }, [date]);

  useEffect(() => {
    if (startTime) {
      const oldDate = new Date(parseInt(startTime) * 1000);
      const oldTime = dateFormat(startTime * 1000, 'hh:MMtt');

      setHasSetDate(true);
      setHasSetTime(true);
      setTempDate(oldDate);
      setTempTime(oldTime);
      setDate(oldDate);
    }
  }, [startTime]);

  // Android is dumb and will keep reopening the modal if you attempt to set the state on close
  useEffect(() => {
    if (showDateModal && Platform.OS === 'android') {
      setShowDateModal(false);
    }
  }, [showDateModal]);

  useEffect(() => {
    if (showTimeModal && Platform.OS === 'android') {
      setShowTimeModal(false);
    }
  }, [showTimeModal]);

  const onNext = async () => {
    setLoading(true);

    try {
      const fieldsValid = validateTourFields();

      if (!fieldsValid) {
        setLoading(false);

        return;
      }

      const newTour = {
        ...tour,
        agentId,
        name: tourName,
        startTime: timestamp,
      };

      if (newTour.id) {
        if (JSON.parse(tour.startTime) !== JSON.parse(timestamp)) {
          const BuyingAgent = await userService.queries.getUser(agentId);
          const { brokerage, firstName, lastName } = BuyingAgent;
          const TourStops = await tourService.queries.listTourStops(tour.id);
          const tourDate = dateFormat(tour.startTime * 1000, 'dd/mm/yyyy hh:MMtt');

          TourStops.map(async ts => {
            await tourService.mutations.deleteTourStop(ts.id);
            if (ts.requestSent) {
              const { address, listingAgentId, listingAgent } = ts.propertyOfInterest.propertyListing;
              const { firstName: laFirstName, lastName: laLastName } = listingAgent;
              const { push, sms, email } = buildDeleteShowingRequest({
                address: address.includes(',') ? address.split(',')[0] : address,
                baName: `${firstName} ${lastName}`,
                laName: `${laFirstName} ${laLastName}`,
                brokerage,
                date: tourDate,
              });

              await notificationService.mutations.createNotification({
                userId: listingAgentId,
                pushMessage: push,
                smsMessage: sms,
                email,
              });
            }

            return null;
          });

          const newArr = TourStops.map(ts => {
            const {
              propertyOfInterestId,
              propertyOfInterest: {
                propertyListing: { isCustomListing },
              },
            } = ts;

            return {
              propertyOfInterestId,
              isCustomListing,
            };
          });

          await tourService.mutations.batchUpdateTourStops(tour.id, newArr);
          setTour(newTour);
          delete newTour.clientName;
          delete newTour.totalDuration;

          const updatedTour = await tourService.mutations.updateTour({
            id: newTour.id,
            agentId,
            name: tourName,
            startTime: timestamp,
          });

          const tempTours = tours.map(prevTour =>
            prevTour.id === updatedTour.id
              ? { ...prevTour, name: updatedTour.name, startTime: updatedTour.startTime }
              : prevTour
          );

          setTours(tempTours);
        } else {
          setTour(newTour);
          delete newTour.clientName;
          delete newTour.totalDuration;

          const updatedTour = await tourService.mutations.updateTour({
            id: newTour.id,
            agentId,
            name: tourName,
            startTime: timestamp,
          });

          const tempTours = tours.map(prevTour =>
            prevTour.id === updatedTour.id
              ? { ...prevTour, name: updatedTour.name, startTime: updatedTour.startTime }
              : prevTour
          );

          setTours(tempTours);
          const dbTourStops = await tourService.queries.listTourStops(tour.id);

          await updateTourStopTime(dbTourStops);
        }
      } else {
        const createdTour = await tourService.mutations.createTour(newTour);

        setTour(createdTour);

        await notifyBuyer(createdTour);
        if (client) setClient(client);
      }

      setLoading(false);
      navigation.navigate('NewTourHomes');
    } catch (error) {
      console.log('Error setting creating tour: ', error);
      setErrors(prevState => ({
        ...prevState,
        error: 'An error occurred attempting to create your tour.',
      }));
      setLoading(false);
    }
  };

  const updateTourStopTime = async tourStops => {
    if (!tourStops.length) return;
    const dateSelected = new Date(timestamp * 1000);
    const year = dateSelected.getFullYear();
    const month = dateSelected.getMonth();
    const day = dateSelected.getDate();

    tourStops.map(async stop => {
      const time = new Date(stop.startTime * 1000);
      const updatedDateTime = new Date(year, month, day, time.getHours(), time.getMinutes(), '00');
      const updatedTime = Math.floor(updatedDateTime.getTime() / 1000);

      await tourService.mutations.updateTourStop({
        id: stop.id,
        startTime: parseInt(updatedTime),
      });
    });
  };

  const notifyBuyer = async createdTour => {
    try {
      const datetimeOfTour = new Date(parseInt(createdTour.startTime) * 1000);
      const formattedDate = dateFormat(datetimeOfTour, 'dddd, mmmm dS, yyyy');
      const formattedTime = dateFormat(datetimeOfTour, 'h:MM TT');
      const { push } = buildTourCreated({
        baName: `${user.firstName} ${user.lastName}`,
        brokerage: user.brokerage,
        datetime: `${formattedDate} at ${formattedTime}`,
      });

      await notificationService.mutations.createNotification({
        userId: createdTour.clientId,
        pushMessage: push,
      });
    } catch (error) {
      console.warn('Error notifying buyer of new tour: ', error);
    }
  };

  const validateTourFields = () => {
    try {
      const nameValid = validateTourName(tourName);
      const dateValid = validateTourDate(date);
      const timeValid = validateTourTime(date);

      return nameValid && dateValid && timeValid;
    } catch (error) {
      console.log('Error validating new tour fields: ', error);
      setErrors(prevState => ({
        ...prevState,
        error: 'Error validating new tour',
      }));
    }
  };

  const validateTourName = nameToValidate => {
    if (!nameToValidate) {
      setErrors(prevState => ({
        ...prevState,
        name: 'Tour Name is required',
      }));

      return false;
    }

    setErrors(prevState => ({ ...prevState, name: '' }));

    return true;
  };

  const validateTourDate = tourDate => {
    if (!tourDate) {
      setErrors(prevState => ({ ...prevState, date: 'Date is required' }));

      return false;
    }

    setErrors(prevState => ({ ...prevState, date: '' }));

    return true;
  };

  const validateTourTime = tourTime => {
    if (!tourTime) {
      setErrors(prevState => ({
        ...prevState,
        time: 'Tour Start Time is required',
      }));

      return false;
    }

    setErrors(prevState => ({ ...prevState, time: '' }));

    return true;
  };

  const openDatePicker = () => {
    if (!tempDate) {
      setTempDate(roundUpToNearest15MinuteInterval(new Date()));
    }

    setShowDateModal(true);
  };

  const datePicker = () => {
    const borderColor = errors.date ? tw.borderRed500 : tw.borderGray700;

    return (
      <View>
        <TouchableOpacity onPress={openDatePicker} activeOpacity={0.9} style={[tw.wFull, tw.flexCol, tw.mY2]}>
          <View style={[tw.wFull, tw.flexRow]}>
            <View style={[tw.relative, tw.flex1, tw.borderB, tw.pL2, borderColor]}>
              <BodyText style={[tw.mT6]}>Date</BodyText>
              <BodyText xl style={[tw.textGray700, tw.pY2]}>
                {dateStr || ''}
              </BodyText>
              <DateIcon style={[tw.absolute, tw.right0, tw.bottom0, tw.mR4, tw.mB2]} width={20} height={20} />
            </View>
          </View>

          {errors.date ? <BodyText style={[tw.textXs, tw.textRed500, tw.mL2, tw.mT2]}>{errors.date}</BodyText> : null}
        </TouchableOpacity>
        {Platform.OS === 'ios' ? (
          <Modal
            isVisible={showDateModal}
            onBackdropPress={() => {
              setHasSetDate(true);
              setShowDateModal(false);
              resetTempDate();
            }}
          >
            <View style={[tw.mT2, isDarkMode ? tw.bgGray800 : tw.bgWhite, tw.textCenter]}>
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
                Select Tour Date
              </BodyText>
              <DateTimePicker
                value={tempDate || roundUpToNearest15MinuteInterval(new Date())}
                mode="date"
                display="spinner"
                onChange={(event, evtDate) => {
                  setTempDate(roundUpToNearest15MinuteInterval(evtDate));
                }}
              />
              <View style={[tw.m4]}>
                <PrimaryButton
                  containerStyle={[tw.pX2]}
                  title="Confirm Date"
                  onPress={() => {
                    setDate(tempDate);
                    setHasSetDate(true);
                    setShowDateModal(false);
                    setErrors(prevState => ({ ...prevState, date: '' }));
                  }}
                />
              </View>
            </View>
          </Modal>
        ) : (
          showDateModal && (
            <DateTimePicker
              value={date || roundUpToNearest15MinuteInterval(new Date())}
              mode="date"
              display="spinner"
              onChange={(event, evtDate) => {
                if (evtDate) {
                  if (date) {
                    evtDate.setHours(date.getHours());
                    evtDate.setMinutes(date.getMinutes());
                  }

                  setDate(evtDate);
                  setHasSetDate(true);
                  setErrors(prevState => ({ ...prevState, date: '' }));
                }
              }}
            />
          )
        )}
      </View>
    );
  };

  const timePicker = () => {
    const borderColor = errors.time ? tw.borderRed500 : tw.borderGray700;
    const timeStr = date && hasSetTime ? dateFormat(date, 'shortTime') : '';

    return (
      <View>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[tw.wFull, tw.flexCol, tw.mY2]}
          onPress={() => setShowTimeModal(true)}
        >
          <View style={[tw.wFull, tw.flexRow]}>
            <View style={[tw.relative, tw.flex1, tw.borderB, tw.pL2, borderColor]}>
              <BodyText style={[tw.mT6]}>Tour Start Time</BodyText>
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

          {errors.time ? <BodyText style={[tw.textXs, tw.textRed500, tw.mL2, tw.mT2]}>{errors.time}</BodyText> : null}
        </TouchableOpacity>
        {Platform.OS === 'ios' ? (
          <Modal
            isVisible={showTimeModal}
            onBackdropPress={() => {
              setShowTimeModal(false);
              resetTempTime();
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
                Select Tour Time
              </BodyText>

              <DateTimePicker
                value={tempTime || roundUpToNearest15MinuteInterval(new Date())}
                mode="time"
                display="spinner"
                minuteInterval={15}
                onChange={(event, evtTime) => setTempTime(roundUpToNearest15MinuteInterval(evtTime))}
              />

              <View style={[tw.m4]}>
                <PrimaryButton
                  containerStyle={[tw.pX2]}
                  title="Confirm Time"
                  onPress={() => {
                    setDate(roundUpToNearest15MinuteInterval(tempTime || new Date()));
                    setErrors(prevState => ({ ...prevState, time: '' }));
                    setHasSetTime(true);
                    setShowTimeModal(false);
                  }}
                />
              </View>
            </View>
          </Modal>
        ) : (
          showTimeModal && (
            <DateTimePicker
              value={date || roundUpToNearest15MinuteInterval(new Date())}
              mode="time"
              display="spinner"
              minuteInterval={15}
              onChange={(event, evtDate) => {
                if (evtDate) {
                  if (date) {
                    evtDate.setDate(date.getDate());
                    evtDate.setMonth(date.getMonth());
                    evtDate.setFullYear(date.getFullYear());
                  }

                  setDate(roundUpToNearest15MinuteInterval(evtDate));
                  setHasSetTime(true);
                  setErrors(prevState => ({ ...prevState, time: '' }));
                }

                setShowTimeModal(false);
              }}
            />
          )
        )}
      </View>
    );
  };

  if (!tour) {
    return <FlexLoader />;
  }

  return (
    <ScrollView contentContainerStyle={[tw.flex1]}>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: name ? 'Edit Tour' : 'Create Tour',
            showBackBtn: true,
            showSettingsBtn: true,
          })
        }
      />
      <TouchableWithoutFeedback style={[tw.wFull]} onPress={Keyboard.dismiss}>
        <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol, tw.flex1]}>
          <View style={[tw.mY8, tw.pX8]}>
            <BodyText style={[tw.mL2]}>Tour Name</BodyText>
            <PrimaryInput
              placeholder=""
              autoCapitalize="words"
              onChangeText={newTourName => setTourName(newTourName)}
              value={tourName}
              errorMessage={errors.name}
              onBlur={() => validateTourName(tourName)}
            />
            {datePicker()}
            {timePicker()}
          </View>
          <View style={[tw.mB4, tw.pX8, tw.mTAuto]}>
            <PrimaryButton title="Next" onPress={onNext} loading={loading} loadingTitle="Saving" />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
};

export default NewTourNameDate;
