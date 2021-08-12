import React, { useCallback, useContext, useEffect, useState } from 'react';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { FlatList, RefreshControl, View } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import AgentTabContext from '../../../navigation/AgentTabContext';
import ShowingContext from '../ShowingContext';
import { BodyText, FlexLoader, PrimaryButton, SecondaryButton } from '../../../components';
import AvailableListingCard from '../../../components/AvailableListingCard';
import { calendarService } from '../../../services';

const ListAvailableShowings = ({ navigation, isFocused }) => {
  const { setNavigationParams } = useContext(AgentTabContext);
  const { selectedPropertyListing, setAvailableTimeSlotListings } = useContext(ShowingContext);
  const [availableShowList, setAvailableShowList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

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

      setAvailableShowList(availableListings);
      setAvailableTimeSlotListings(availableListings);
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

  const selectAvailableCard = availableTimings => {
    navigation.navigate('AddAvailableShowingTimes', { selectedShowTimes: availableTimings });
  };

  const onAddShowTimePress = () => {
    navigation.navigate('AddAvailableShowingTimes');
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
            headerTitle: 'Available Show Times',
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
              availableTimings={availableTimings}
              onPress={() => selectAvailableCard(availableTimings)}
            />
          )}
          ListEmptyComponent={ListEmptyComponent}
          keyExtractor={(item, index) => `availableTiming-${index}`}
          showsVerticalScrollIndicator={false}
        />
        <View style={[tw.pT2, tw.pX8, tw.mB2, tw.borderT, tw.borderGray300]}>
          <PrimaryButton title="ADD AVAILABLE SHOWING TIMES" onPress={onAddShowTimePress} />
          {availableShowList.length > 0 && (
            <SecondaryButton
              title="REMOVE SHOWING TIMES"
              style={[tw.border2, tw.borderBlue500, tw.mT2]}
              textStyle={[tw.textBlue500]}
              onPress={() => navigation.navigate('RemoveShowTimes')}
            />
          )}
        </View>
      </View>
    </>
  );
};

export default withNavigationFocus(ListAvailableShowings);
