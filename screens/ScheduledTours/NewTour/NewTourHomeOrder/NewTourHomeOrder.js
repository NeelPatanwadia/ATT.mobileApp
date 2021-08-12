import React, { useEffect, useRef, useState, useContext } from 'react';
import { Alert, View } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import MapView, { Polyline } from 'react-native-maps';
import dateFormat from 'dateformat';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { BodyText, PanelScreen, PrimaryButton, FlexLoader } from '../../../../components';
import { calcRegion, hoursToSeconds, splitScreenRegion } from '../../../../helpers';
import { calendarService, tourService } from '../../../../services';
import LocationCard from './LocationCard';
import CustomMarker from './CustomMarker';
import TourContext from '../../TourContext';
import useTimeString from '../../../../helpers/useTimeString';
import CalendarView from '../../../../components/CalendarView';

const AVAILABLE_COLOR = color.availableSlot;
const BOOKED_COLOR = color.bookedSlot;
const PENDING_COLOR = color.pendingSlot;
const NewTourHomeOrder = ({ navigation, screenProps: { user } }) => {
  const { client, tour, tourStops, setTourStops } = useContext(TourContext);
  const [initialRegionSet, setInitialRegionSet] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState(null);
  const [showOrderBadge, setShowOrderBadge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manuallyChangedOrder, setManuallyChangedOrder] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [myEvents, setMyEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const mapView = useRef(null);
  const { startTime = 0, endTime = 0, totalDuration = 0 } = tour;
  const { tourDateStr, timeStr } = useTimeString(startTime, endTime, totalDuration);

  useEffect(() => {
    getStops();
  }, []);

  useEffect(() => {
    checkStopTimes();
  }, [tourStops]);

  const getShowings = async listingId => {
    const paramsStartTime = new Date(startTime * 1000).setHours(0, 0, 0) / 1000;
    const paramsEndTime = new Date(startTime * 1000).setHours(23, 59, 59) / 1000;

    setCalendarLoading(true);
    try {
      const params = {
        listing_id: listingId,
      };

      if (startTime) {
        params.start_time = paramsStartTime;
        params.end_datetime = paramsEndTime;
      }

      const Listings = await calendarService.queries.agentTimeSlotDetails(params);
      const bookedListing = Listings.filter(list => list.status !== 'available').sort(
        (a, b) => parseInt(a.startTime) - parseInt(b.startTime)
      );
      const availableListings = Listings.filter(list => list.status === 'available').sort(
        (a, b) => parseInt(a.startTime) - parseInt(b.startTime)
      );

      const tempArr = [];

      availableListings.map(availableValue => {
        const {
          startTime: availableStartTime,
          endDatetime: availableEndTime,
          duration: availableDuration,
        } = availableValue;
        const endDateTime = availableEndTime || availableStartTime + availableDuration * 60 * 60;
        const availableStartDate = dateFormat(availableStartTime * 1000, 'isoUtcDateTime');
        const availableEndDate = dateFormat(endDateTime * 1000, 'isoUtcDateTime');

        tempArr.push({
          id: tempArr.length + 1,
          startDate: availableStartDate,
          endDate: availableEndDate,
          color: AVAILABLE_COLOR,
        });
        bookedListing.map(bookedValue => {
          const {
            startTime: bookedStartTime,
            endDatetime: bookedEndTime,
            duration: bookedDuration,
            status: bookedStatus,
            buyingAgentEmailAddress,
            buyingAgentFirstName,
            buyingAgentLastName,
            buyingAgentBrokerage,
            tourName,
          } = bookedValue;
          const bookedEndDateTime = bookedEndTime || bookedStartTime + bookedDuration * 60 * 60;
          const bookedStartDate = dateFormat(bookedStartTime * 1000, 'isoUtcDateTime');
          const bookedEndDate = dateFormat(bookedEndDateTime * 1000, 'isoUtcDateTime');

          if (availableStartTime <= bookedStartTime && bookedStartTime <= availableEndTime) {
            const timeRange = `${dateFormat(bookedStartTime * 1000, 'h:MMtt')} - ${dateFormat(
              bookedEndDateTime * 1000,
              'h:MMtt'
            )}`;
            const tempEnd = tempArr[tempArr.length - 1].endDate;
            const description =
              buyingAgentEmailAddress === user.emailAddress
                ? `${timeRange}\n${buyingAgentFirstName} ${buyingAgentLastName}${
                    buyingAgentBrokerage ? ` - ${buyingAgentBrokerage}` : ''
                  } - ${tourName}`
                : `${timeRange}`;

            tempArr[tempArr.length - 1].endDate = bookedStartDate;
            tempArr.push({
              id: tempArr.length + 1,
              startDate: bookedStartDate,
              endDate: bookedEndDate,
              description,
              color: bookedStatus === 'pending' ? PENDING_COLOR : BOOKED_COLOR,
            });
            tempArr.push({
              id: tempArr.length + 1,
              startDate: bookedEndDate,
              endDate: tempEnd,
              color: AVAILABLE_COLOR,
            });
          }

          return null;
        });

        return null;
      });

      if (availableListings.length === 0 && bookedListing.length !== 0) {
        bookedListing.map(bookedValue => {
          const {
            startTime: bookedStartTime,
            endDatetime: bookedEndTime,
            duration: bookedDuration,
            status: bookedStatus,
            buyingAgentEmailAddress,
            buyingAgentFirstName,
            buyingAgentLastName,
            buyingAgentBrokerage,
            tourName,
          } = bookedValue;
          const bookedEndDateTime = bookedEndTime || bookedStartTime + bookedDuration * 60 * 60;
          const bookedStartDate = dateFormat(bookedStartTime * 1000, 'isoUtcDateTime');
          const bookedEndDate = dateFormat(bookedEndDateTime * 1000, 'isoUtcDateTime');
          const timeRange = `${dateFormat(bookedStartTime * 1000, 'h:MMtt')} - ${dateFormat(
            bookedEndDateTime * 1000,
            'h:MMtt'
          )}`;
          const description =
            buyingAgentEmailAddress === user.emailAddress
              ? `${timeRange}\n${buyingAgentFirstName} ${buyingAgentLastName}${
                  buyingAgentBrokerage ? ` - ${buyingAgentBrokerage}` : ''
                } - ${tourName}`
              : `${timeRange}`;

          tempArr.push({
            id: tempArr.length + 1,
            startDate: bookedStartDate,
            endDate: bookedEndDate,
            description,
            color: bookedStatus === 'pending' ? PENDING_COLOR : BOOKED_COLOR,
          });

          return null;
        });
      }
      setMyEvents(tempArr);
    } catch (error) {
      console.log('Error getting available time listing', error);
    }
    setCalendarLoading(false);
  };

  const checkStopTimes = () => {
    // Using array.every() to check each element against the previous with early bailout
    if (!tourStops.length) {
      return;
    }

    let isChronological = true;
    let hasOverlap = false;

    // This could probably be more efficient but... there should never be a lot of tourStops so its probably fine
    for (let i = 0; i < tourStops.length; i++) {
      const currentStop = tourStops[i];

      if (i !== 0) {
        const prevStop = tourStops[i - 1];

        if (
          isChronological &&
          prevStop &&
          currentStop &&
          prevStop.startTime &&
          prevStop.duration &&
          currentStop.startTime &&
          currentStop.duration
        ) {
          const prevStopArrival = prevStop.startTime;
          const departureTime = currentStop.startTime;

          const prevStopOutOfOrder = prevStopArrival > departureTime;

          if (prevStopOutOfOrder) {
            isChronological = false;
          }
        }
      }

      if (!hasOverlap) {
        for (let j = 0; j < tourStops.length; j++) {
          if (i !== j) {
            const stop = tourStops[j];

            if (stop && stop.startTime && stop.duration && currentStop.startTime && currentStop.duration) {
              const stopStart = stop.startTime;
              const stopEnd = stopStart + hoursToSeconds(stop.duration);

              const currentStopStart = currentStop.startTime;
              const currentStopEnd = currentStopStart + hoursToSeconds(currentStop.duration);

              if (
                (stopStart > currentStopStart && stopStart < currentStopEnd) ||
                (stopEnd < currentStopEnd && stopEnd > currentStopStart) ||
                (stopStart <= currentStopStart && stopEnd >= currentStopEnd)
              ) {
                hasOverlap = true;
              }
            }
          }
        }
      }
    }

    return { isChronological, hasOverlap };
  };

  const getStops = async () => {
    try {
      const dbTourStops = await tourService.queries.listTourStops(tour.id);

      checkStopTimes(dbTourStops);
      const propertyListings = dbTourStops.map(stop => stop.propertyOfInterest.propertyListing);

      const regionCoordinates = propertyListings.map(({ latitude, longitude }) => ({ latitude, longitude }));

      const newRegion = calcRegion(regionCoordinates);
      const splitRegion = splitScreenRegion(newRegion);

      setRegion(splitRegion);
      setTourStops(dbTourStops);
      setInitialRegionSet(true);
    } catch (error) {
      console.warn('Error loading tour stops: ', error);
    }
  };

  const updateRegion = () => {
    try {
      if (!mapReady) {
        return;
      }

      const newRegion = calcRegion(getTourPath());
      const splitRegion = splitScreenRegion(newRegion);

      mapView.current.animateToRegion(splitRegion, 300);
    } catch (error) {
      console.warn('Error updating map region: ', error);
    }
  };

  const updateLocation = async tourStop => {
    try {
      await tourService.mutations.updateTourStop({
        id: tourStop.id,
        order: tourStop.order,
        duration: tourStop.duration,
      });

      const newTourStops = [...tourStops].map(stop => {
        if (stop.id !== tourStop.id) {
          return stop;
        }

        return tourStop;
      });

      setTourStops(newTourStops.sort((a, b) => a.order < b.order));
    } catch (error) {
      console.warn('Error updating tour stop order: ', error);
    }
  };

  const ValidatedAvailableTime = (availableListings, startedTime, endedTime) => {
    let isValid = false;

    if (availableListings.length === 0) {
      isValid = true;

      return isValid;
    }

    for (let i = 0; i < availableListings.length; i++) {
      // selected start time and end time inside available time slot range
      if (
        Math.floor(startedTime) >= Math.floor(availableListings[i].startTime) &&
        Math.floor(startedTime) <= Math.floor(availableListings[i].endDatetime) &&
        Math.floor(endedTime) >= Math.floor(availableListings[i].startTime) &&
        Math.floor(endedTime) <= Math.floor(availableListings[i].endDatetime)
      ) {
        isValid = true;
        break;
      } else {
        isValid = false;
      }
    }

    return isValid;
  };

  const onCalenderPress = tourStop => {
    setShowCalendarModal(true);
    getShowings(tourStop.propertyOfInterest.propertyListing.listingId);
  };

  const getMarkers = () => {
    let markers = [];

    try {
      markers = tourStops.map(tourStop => {
        const {
          propertyListing: { latitude, longitude },
        } = tourStop.propertyOfInterest;

        const isPrimary = tourStop.order === 1 && !tour.addressStr;
        const currentOrder = isPrimary ? 'S' : tourStop.order;

        return (
          <CustomMarker
            key={`cust-marker-${tourStop.id}-${currentOrder || 'S'}`}
            isPrimary={isPrimary}
            label={currentOrder || 'S'}
            coordinate={{
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            }}
            tourStop={tourStop}
            updateLocation={updateLocation}
            navigation={navigation}
          />
        );
      });

      if (tour.addressStr) {
        markers = [
          <CustomMarker
            key="cust-marker-start"
            isPrimary
            label="S"
            coordinate={{
              latitude: parseFloat(tour.latitude),
              longitude: parseFloat(tour.longitude),
            }}
            navigation={navigation}
          />,
          ...markers,
        ];
      }
    } catch (error) {
      console.warn('Error getting markers: ', error);
    }

    return markers;
  };

  const renderLocationCard = ({ item: tourStop, drag, isActive }) => {
    const locationOrder = tourStop.order === 1 && !tour.addressStr ? 'S' : tourStop.order;

    return (
      <LocationCard
        style={[isActive && tw.shadow, tw.z10]}
        index={locationOrder}
        tourStartTime={tour.startTime}
        tourStop={tourStop}
        propertyListing={tourStop.propertyOfInterest.propertyListing}
        onLongPress={drag}
        showOrderBadge={showOrderBadge}
        updateLocation={updateLocation}
        updateTimeOnTourStop={updateTimeOnTourStop}
        isActive={isActive}
        navigation={navigation}
        onCalenderPress={() => onCalenderPress(tourStop)}
      />
    );
  };

  const checkForNextPage = () => {
    const { isChronological, hasOverlap } = checkStopTimes();

    if (!isChronological || hasOverlap) {
      const message = buildOrderConflictMessage(isChronological, hasOverlap);

      Alert.alert('Showing Order Conflict', message, [
        {
          text: 'Yes, Continue Anyway',
          onPress: () => reOrderTourStops(isChronological),
        },
        {
          text: 'No, Revise Schedule',
        },
      ]);
    } else {
      nextPage(tourStops);
    }
  };

  const reOrderTourStops = async isChronological => {
    if (!isChronological) {
      let updatedOrder = [];

      updatedOrder = tourStops.sort((a, b) => a.startTime >= b.startTime);

      const newTourStops = updatedOrder.map((tStop, idx) => ({
        ...tStop,
        order: idx + 1,
      }));

      setManuallyChangedOrder(false);
      setTourStops(newTourStops);
      nextPage(newTourStops);
    } else {
      nextPage(tourStops);
    }
  };

  const nextPage = async newTourStops => {
    setLoading(true);

    try {
      await Promise.all(
        newTourStops.map(tourStop => {
          const updatedTourStop = {
            id: tourStop.id,
            order: tourStop.order,
            duration: tourStop.duration,
            startTime: tourStop.startTime,
          };

          if (tourStop.showingRequestRequired) {
            updatedTourStop.showingRequestRequired = true;
          }

          return tourService.mutations.updateTourStop(updatedTourStop);
        })
      );

      const updateTourInput = {
        id: tour.id,
        manually_ordered_showings: tour.manuallyOrderedShowings || manuallyChangedOrder,
      };

      await tourService.mutations.updateTour(updateTourInput);

      getStops();
      setLoading(false);
      navigation.navigate('NewTourConfirm');
    } catch (error) {
      setLoading(false);
    }
  };

  const buildOrderConflictMessage = (isChronological, hasOverlap) => {
    let message = '';

    if (!isChronological) {
      message =
        'The showings are not in chronological order.\nContinuing will automatically update your tour in chronological order.';
    } else if (hasOverlap) {
      message =
        'One or more properties may have overlapping times.\nAre you sure you want to continue with this schedule?';
    }

    return message;
  };

  const reorderStops = ({ data }) => {
    setShowOrderBadge(false);
    const newTourStops = data.map((tStop, idx) => ({
      ...tStop,
      order: idx + 1,
    }));

    setManuallyChangedOrder(true);
    setTourStops(newTourStops);
  };

  const sortedTourStops = tourStops.sort((a, b) => a.order > b.order);

  const getLastCoordinate = () => {
    try {
      const lastStop = sortedTourStops[sortedTourStops.length - 1];

      const {
        propertyOfInterest: {
          propertyListing: { latitude, longitude },
        },
      } = lastStop;

      return {
        latitude,
        longitude,
      };
    } catch (error) {
      console.warn('Error getting last location coordinate: ', error);
    }
  };

  const getFirstCoordinate = () => {
    try {
      const firstStop = sortedTourStops[0];

      if (tour.addressStr) {
        return {
          latitude: parseFloat(tour.latitude),
          longitude: parseFloat(tour.longitude),
        };
      }

      return {
        latitude: firstStop.propertyOfInterest.propertyListing.latitude,
        longitude: firstStop.propertyOfInterest.propertyListing.longitude,
      };
    } catch (error) {
      console.warn('Error getting first location coordinate: ', error);
    }
  };

  const getTourPath = () => {
    try {
      let tourCoordinates = sortedTourStops
        .map(stop => stop.propertyOfInterest.propertyListing)
        .map(({ latitude, longitude }) => ({ latitude, longitude }));

      if (tour.addressStr) {
        const tourStartLatLong = {
          latitude: parseFloat(tour.latitude),
          longitude: parseFloat(tour.longitude),
        };

        tourCoordinates = [tourStartLatLong, ...tourCoordinates];
      }

      return tourCoordinates;
    } catch (error) {
      console.warn('Error getting tour coordinates: ', error);
    }
  };

  const updateTimeOnTourStop = async (tourStop, duration, arrivalTime, arrivalDate) => {
    const startedDate = arrivalDate.getTime() / 1000;
    const endedDate = new Date(arrivalDate).setTime(arrivalDate.setSeconds(0) + duration * 60 * 60 * 1000) / 1000;
    const listings = await calendarService.queries.getTourStopIfExists({
      propertyListingId: tourStop.propertyOfInterest.propertyListing.id,
      startTime: startedDate,
      endTime: endedDate,
    });

    const paramsStartTime = new Date(startTime * 1000).setHours(0, 0, 0) / 1000;
    const paramsEndTime = new Date(startTime * 1000).setHours(23, 59, 59) / 1000;
    const {
      propertyOfInterest: {
        propertyListing: { listingId, isCustomListing },
      },
    } = tourStop;
    const params = {
      listing_id: listingId,
    };

    if (startTime) {
      params.start_time = paramsStartTime;
      params.end_datetime = paramsEndTime;
    }

    if (isCustomListing) {
      const updatedTourStops = tourStops.map(stop => {
        if (stop.id === tourStop.id) {
          const updatedStop = {
            ...stop,
            startTime: parseInt(arrivalTime),
            duration,
          };

          if ((stop.startTime && parseInt(stop.startTime) !== parseInt(arrivalTime)) || duration > stop.duration) {
            updatedStop.showingRequestRequired = true;
          }

          return updatedStop;
        }

        return stop;
      });

      setTourStops(updatedTourStops);
    } else {
      const Listings = await calendarService.queries.agentTimeSlotDetails(params);
      const availableListings = Listings.filter(list => list.status === 'available').sort(
        (a, b) => parseInt(a.startTime) - parseInt(b.startTime)
      );

      if (listings.length === 0) {
        if (ValidatedAvailableTime(availableListings, startedDate, endedDate)) {
          const updatedTourStops = tourStops.map(stop => {
            if (stop.id === tourStop.id) {
              const updatedStop = {
                ...stop,
                startTime: parseInt(arrivalTime),
                duration,
              };

              if ((stop.startTime && parseInt(stop.startTime) !== parseInt(arrivalTime)) || duration > stop.duration) {
                updatedStop.showingRequestRequired = true;
              }

              return updatedStop;
            }

            return stop;
          });

          setTourStops(updatedTourStops);
        } else {
          setTimeout(() => {
            Alert.alert(
              'Time Requested Not Available',
              'Please check the calendar to see available times or call the Listing Agent.',
              [
                {
                  text: 'Ok',
                  onPress: () => {},
                },
              ]
            );
          }, 500);
        }
      } else {
        setTimeout(() => {
          Alert.alert('Slot already been taken', 'Please select another time slot.', [
            {
              text: 'Ok',
              onPress: () => {},
            },
          ]);
        }, 500);
      }
    }
  };

  const renderCalendarModal = () => {
    const tourMonth = dateFormat(startTime ? startTime * 1000 : new Date(), 'mmmm', true);
    const tourDate = startTime ? new Date(startTime * 1000) : new Date();

    return (
      <CalendarView
        tourDate={tourDate}
        tourMonth={tourMonth}
        myEvents={myEvents}
        calendarLoading={calendarLoading}
        setShowCalendarModal={value => setShowCalendarModal(value)}
        showCalendarModal={showCalendarModal}
      />
    );
  };

  const clientName = client ? `${client.firstName} ${client.lastName}` : '';

  if (tourStops.length === 0) return <FlexLoader />;

  return (
    <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol]}>
      <View style={[tw.wFull, tw.flex1, tw.flexCol]}>
        <View style={[tw.w5_6, tw.selfCenter, tw.mB4]}>
          <View style={[tw.mT3, tw.mB16]}>
            <BodyText lg center>{`${clientName}: ${tour.name}`}</BodyText>
            <BodyText md center style={[tw.mY2, tw.mB2]}>
              {tourDateStr} {timeStr}
            </BodyText>
            <BodyText italic center>
              {tour.manuallyOrderedShowings ? 'Route optimization skipped' : 'We have optimized your route'}
            </BodyText>
          </View>
        </View>
        <View style={[tw.relative, tw.flexCol, tw.flex1, tw.bgPrimary]}>
          {initialRegionSet ? (
            <PanelScreen
              map={
                <MapView
                  style={[tw.wFull, tw.z0, tw.hFull]}
                  onRegionChangeComplete={setRegion}
                  region={region}
                  onMapReady={() => setMapReady(true)}
                  ref={mapView}
                >
                  {getMarkers()}
                  <Polyline
                    coordinates={getTourPath()}
                    strokeColor={color.blue400}
                    strokeColors={[color.blue400]}
                    strokeWidth={4}
                  />
                  <Polyline
                    coordinates={[getLastCoordinate(), getFirstCoordinate()]}
                    strokeColor={color.blue500}
                    strokeColors={[color.blue500]}
                    strokeWidth={2}
                  />
                </MapView>
              }
              onNext={console.log}
              updateRegion={updateRegion}
            >
              <DraggableFlatList
                data={sortedTourStops}
                renderItem={renderLocationCard}
                style={[tw.bgPrimary]}
                keyExtractor={(location, idx) => `location-${idx}`}
                autoscrollThreshold={60}
                onDragBegin={() => setShowOrderBadge(true)}
                onDragEnd={reorderStops}
              />
            </PanelScreen>
          ) : (
            <FlexLoader />
          )}
        </View>
      </View>

      <View style={[tw.w5_6, tw.selfCenter, tw.pY2, tw.mX4]}>
        <PrimaryButton
          title="Next"
          onPress={checkForNextPage}
          loading={loading}
          disabled={!!tourStops.find(stop => !stop.startTime)}
        />
      </View>
      {renderCalendarModal()}
    </View>
  );
};

export default NewTourHomeOrder;
