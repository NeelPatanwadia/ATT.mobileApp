import React, { useCallback, useContext, useEffect, useState } from 'react';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import dateFormat from 'dateformat';
import AgentTabContext from '../../../navigation/AgentTabContext';
import ShowingContext from '../ShowingContext';
import { BodyText, FlexLoader, PrimaryButton, SecondaryButton } from '../../../components';
import AvailableListingCard from '../../../components/AvailableListingCard';
import { calendarService, notificationService, tourService } from '../../../services';
import { buildEditDeleteLAAvailabilitySlot } from '../../../notifications/messageBuilder';

const RemoveShowTimes = ({ navigation, isFocused }) => {
  const { setNavigationParams } = useContext(AgentTabContext);
  const { selectedPropertyListing } = useContext(ShowingContext);
  const [availableShowList, setAvailableShowList] = useState([]);
  const [refreshScreen, setRefreshScreen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isFocused && !refreshing) {
      getShowings();
    }
  }, [isFocused]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getShowings(true).then(() => setRefreshing(false));
  }, [refreshing]);

  const getShowings = async (useLoading = false) => {
    try {
      if (!useLoading) {
        setLoading(true);
      }
      const currentDate = Math.floor(new Date().setHours(0, 0, 0) / 1000);
      const Listings = await calendarService.queries.agentTimeSlotDetails({
        listing_id: selectedPropertyListing.listingId,
      });

      const availableListings = Listings.filter(
        list => list.startTime >= currentDate && list.status === 'available'
      ).sort((a, b) => parseInt(a.startTime) - parseInt(b.startTime));

      const tempArray = availableListings.map(value => ({ ...value, isSelected: false }));

      setAvailableShowList(tempArray);
    } catch (error) {
      console.log('Error getting available time listing', error);
    }
    setLoading(false);
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

  const onRemoveConfirmationPress = async () => {
    let tempArr = [];

    setDeleting(true);

    availableShowList.map(value => (value.isSelected ? tempArr.push(value) : null));
    await Promise.all(
      tempArr.map(async value => {
        const { listingId, startTime, endDatetime } = value;
        const params = {
          listing_id: listingId,
          start_time: startTime,
          end_datetime: endDatetime,
        };

        const data = await calendarService.queries.agentTimeSlotDetails(params);

        const bookedSlot = data.filter(dataValue => dataValue.status !== 'available');

        await Promise.all(
          bookedSlot.map(async dataValue => {
            await sendNotificationOnEditDeleteLASlot(dataValue);

            return tourService.mutations.deleteTourStop(dataValue.tourstopId);
          })
        );

        const apiData = {
          id: value.availbilityId,
          isActive: false,
        };

        return calendarService.mutations.updateListingAgentAvailbility(apiData);
      })
    );
    tempArr = availableShowList.filter(value => !value.isSelected);
    setAvailableShowList(tempArr);
    setDeleting(false);
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

  const onRemovePress = () => {
    const isNonSelected = availableShowList.every(value => !value.isSelected);

    if (isNonSelected) return;
    Alert.alert('Remove Available Times', 'Are you sure want to remove selected available times ?', [
      {
        text: 'Cancel',
        onPress: () => {},
      },
      {
        text: 'Yes, Remove',
        onPress: () => onRemoveConfirmationPress(),
      },
    ]);
  };

  const toggleSelected = availableTimings => {
    const tempArr = availableShowList.map(value =>
      value.availbilityId === availableTimings.availbilityId
        ? { ...value, isSelected: !availableTimings.isSelected }
        : value
    );

    setAvailableShowList(tempArr);
    setRefreshScreen(!refreshScreen);
  };

  const ListEmptyComponent = () => (
    <BodyText style={[tw.pX6]} lg bold>
      No Available Showing Timers Set
    </BodyText>
  );

  if (loading) {
    return <FlexLoader />;
  }

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Set Showing Times',
            showSettingsBtn: true,
            showBackBtn: true,
          })
        }
      />
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
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
        <FlatList
          style={[tw.mT5]}
          data={availableShowList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item: availableTimings }) => (
            <AvailableListingCard
              onSelectorPress={() => toggleSelected(availableTimings)}
              availableTimings={availableTimings}
              // onPress={() => console.log('availableTimings===>', availableTimings)}
            />
          )}
          ListEmptyComponent={ListEmptyComponent}
          keyExtractor={(item, index) => `availableTiming-${index}`}
          showsVerticalScrollIndicator={false}
        />
        <View style={[tw.pT2, tw.pX8, tw.mB2, tw.borderT, tw.borderGray300]}>
          <PrimaryButton
            title="REMOVE"
            onPress={onRemovePress}
            loading={deleting}
            loadingTitle="REMOVING"
            disabled={availableShowList.every(value => !value.isSelected)}
          />
          {availableShowList.length > 0 && (
            <SecondaryButton
              title="CANCEL"
              style={[tw.border2, tw.borderBlue500, tw.mT2]}
              textStyle={[tw.textBlue500]}
              onPress={() => navigation.goBack()}
            />
          )}
        </View>
      </View>
    </>
  );
};

export default withNavigationFocus(RemoveShowTimes);
