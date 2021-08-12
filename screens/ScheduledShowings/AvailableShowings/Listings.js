import React, { useContext } from 'react';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { View } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import AgentTabContext from '../../../navigation/AgentTabContext';
import ShowingContext from '../ShowingContext';
import { Badge, BodyText, PrimaryButton } from '../../../components';

const Listings = ({ navigation, screenProps: { newMessages } }) => {
  const { setNavigationParams } = useContext(AgentTabContext);
  const { selectedPropertyListing } = useContext(ShowingContext);

  const onUpcomingShowingPress = () => navigation.navigate('ScheduledShowings');
  const onAvailableShowingPress = () => navigation.navigate('ListAvailableShowings');
  const onMessagePress = () => navigation.navigate('ScheduleChatList');

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

  let showMessageBadge = false;

  if (newMessages && newMessages.length > 0) {
    const newMessage = newMessages.find(x => x.propertyListingId === selectedPropertyListing.id);

    if (newMessage && newMessage.propertyListingId) {
      showMessageBadge = true;
    }
  }

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Listings',
            showSettingsBtn: true,
            showBackBtn: true,
          })
        }
      />
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.pX8]}>
        <View style={[tw.mT5]}>
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
        <View style={[tw.flex1, tw.justifyCenter]}>
          <PrimaryButton title="SHOWINGS" onPress={onUpcomingShowingPress} />
          <PrimaryButton title="AVAILABLE SHOWING TIMES" style={[tw.mT5]} onPress={onAvailableShowingPress} />
          <PrimaryButton
            leftIcon={showMessageBadge ? <Badge noCountNeeded md /> : false}
            title="MESSAGES"
            style={[tw.mT5]}
            onPress={onMessagePress}
          />
        </View>
      </View>
    </>
  );
};

export default withNavigationFocus(Listings);
