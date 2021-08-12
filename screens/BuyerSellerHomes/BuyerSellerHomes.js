import React, { useContext, useEffect, useState } from 'react';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { View, TouchableOpacity, ScrollView, Image, AppState, ActivityIndicator } from 'react-native';
import { graphqlOperation, API } from 'aws-amplify';
import { color, tw } from 'react-native-tailwindcss';
import Swipeable from 'react-native-swipeable-row';
import { FontAwesome5 } from '@expo/vector-icons';
import { BodyText, Badge } from '../../components';
import { propertyService } from '../../services';
import { ChevronRightIcon, Logo, HeartIcon, HeartFullIcon } from '../../assets/images';
import BuyerSellerTabContext from '../../navigation/BuyerSellerTabContext';
import { onPropertyOfInterestChange } from '../../src/graphql/subscriptions';
import { EVENT_TYPES, logEvent, APP_REGIONS } from '../../helpers/logHelper';

const PropertyOfInterestRow = ({ propertyOfInterest, onPress, removeProperty, loading }) => {
  const likeIcon =
    propertyOfInterest.status && propertyOfInterest.status === 'liked' ? (
      <HeartFullIcon width={20} height={20} fill={color.blue500} />
    ) : (
      <HeartIcon width={25} height={25} fill={color.blue500} />
    );

  const { seenByClient, propertyListing, mediaUrl } = propertyOfInterest;

  return (
    <Swipeable
      key={propertyOfInterest.id}
      rightButtons={[
        <TouchableOpacity
          onPress={() => removeProperty()}
          style={[tw.w20, tw.hFull, tw.flexCol, tw.itemsCenter, tw.justifyCenter, tw.bgRed500, tw.mL2]}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <FontAwesome5 name="trash" color="white" style={[tw.text2xl]} />
          )}
        </TouchableOpacity>,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        style={[tw.shadow, tw.wFull, tw.pY1, tw.bgGray100, tw.mY1, tw.pR6, tw.pL4, tw.flexRow]}
      >
        <View style={[tw.flexCol, tw.itemsCenter, tw.justifyCenter, tw.w4]}>
          {!seenByClient && <Badge noCountNeeded sm />}
        </View>
        <View style={[tw.itemsCenter, tw.justifyCenter]}>
          {mediaUrl ? (
            <Image style={[tw.h16, tw.w16, tw.mL1, tw.mB1]} source={{ uri: mediaUrl }} resizeMode="contain" />
          ) : (
            <View style={[tw.h16, tw.w16, tw.mL1, tw.mB1, tw.itemsCenter, tw.justifyCenter, tw.bgBlue100]}>
              <BodyText center sm>
                No Images
              </BodyText>
            </View>
          )}
        </View>
        <View style={[tw.flex1, tw.flexRow, tw.itemsCenter]}>
          <View style={[tw.flex1, tw.mL4]}>
            <BodyText>{`${
              propertyListing.address.includes(',') ? propertyListing.address.split(',')[0] : propertyListing.address
            }`}</BodyText>
            <BodyText>{`${propertyListing.city}, ${propertyListing.state}, ${propertyListing.zip}`}</BodyText>
          </View>
          <View style={[tw.itemsEnd, tw.mR4]}>{likeIcon}</View>
          <View style={[tw.selfCenter, tw.mR2]}>
            <ChevronRightIcon width={15} height={15} />
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const BuyerSellerHomes = ({ navigation, isFocused, screenProps: { user } }) => {
  const { setNavigationParams } = useContext(BuyerSellerTabContext);
  const [propertiesOfInterest, setPropertiesOfInterest] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionRetryCount, setSubscriptionRetryCount] = useState(0);
  const [propertyRemoving, setPropertyRemoving] = useState({});

  useEffect(() => {
    getClientProperties();
    initSubscription();

    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }

      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, [isFocused]);

  const getClientProperties = async () => {
    try {
      let clientProps = await propertyService.queries.listPropertiesOfInterest({ clientId: user.id });

      clientProps = clientProps
        .sort((a, b) => (b.createdAt < a.createdAt ? -1 : 1))
        .filter(prop => prop.activeForClient);
      setPropertiesOfInterest(clientProps);
    } catch (error) {
      console.warn('Error getting client properties: ', error);
    }
  };

  const initSubscription = async () => {
    try {
      const propertySubscription = await API.graphql(
        graphqlOperation(onPropertyOfInterestChange, { client_id: user.id })
      ).subscribe({
        error: err => {
          console.error('NEW PROPERTY OF INTEREST SUBSCRIPTION ERROR: ', err);

          // Subscription sometimes disconnects if idle for too long
          handleSubscriptionRetry();

          const errMessage = err && err.error ? JSON.stringify(err.error) : 'Unknown';

          logEvent({
            message: `NEW PROPERTY OF INTEREST SUBSCRIPTION ERROR: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        },
        next: () => {
          getClientProperties();
        },
      });

      setSubscription(propertySubscription);
    } catch (error) {
      console.log('Error on property subscription: ', error);
    }
  };

  const handleAppStateChange = async newState => {
    if (newState === 'active') {
      if (subscription) {
        try {
          await subscription.unsubscribe();
        } catch (err) {
          const errMessage = err && err.error ? JSON.stringify(err.error) : 'Unknown';

          logEvent({
            message: `NEW PROPERTY OF INTEREST SUBSCRIPTION ERROR ON APP STATE CHANGE: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        }
        await initSubscription();
        setSubscriptionRetryCount(0);
      }

      getClientProperties();
    }
  };

  const handleSubscriptionRetry = () => {
    if (subscriptionRetryCount < 5) {
      const count = subscriptionRetryCount + 1;

      logEvent({
        message: `BUYER SELLER HOMES SUBSCRIPTION RETRY ${count}`,
        eventType: EVENT_TYPES.WARNING,
        appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
      });

      setTimeout(() => {
        setSubscriptionRetryCount(count);
        initSubscription();
      }, count * 5000);
    } else {
      logEvent({
        message: `BUYER SELLER HOMES SUBSCRIPTION MAX RETRY ATTEMPTS: ${subscriptionRetryCount}`,
        eventType: EVENT_TYPES.ERROR,
        appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
      });
    }
  };

  const propertyHasBeenSeen = async selectedProperty => {
    try {
      await propertyService.mutations.updatePropertyOfInterest({
        id: selectedProperty.id,
        seen_by_client: true,
      });
    } catch (error) {
      console.warn('Error updating property seen status: ', error);
    }
  };

  const navigateProperty = selectedPropertyOfInterest => {
    propertyHasBeenSeen(selectedPropertyOfInterest);
    navigation.navigate('BuyerSellerHomeDetails', { propertyOfInterestId: selectedPropertyOfInterest.id });
  };

  const removeProperty = async propertyOfInterest => {
    setPropertyRemoving(prevState => ({ ...prevState, [propertyOfInterest.id]: true }));
    try {
      await propertyService.mutations.updatePropertyOfInterest({
        id: propertyOfInterest.id,
        active_for_client: false,
      });

      setPropertiesOfInterest(prevProp => [...prevProp].filter(prop => prop.id !== propertyOfInterest.id));
    } catch (error) {
      console.log('Error removing property', error);
    }

    setPropertyRemoving(prevState => ({ ...prevState, [propertyOfInterest.id]: false }));
  };

  const propertyRows = propertiesOfInterest.map((prop, idx) => (
    <PropertyOfInterestRow
      key={`property-${idx}`}
      propertyOfInterest={prop}
      onPress={() => navigateProperty(prop)}
      removeProperty={() => removeProperty(prop)}
      loading={propertyRemoving[prop.id]}
    />
  ));

  let nonIdealState = <View />;

  if (propertiesOfInterest.length === 0) {
    nonIdealState = (
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
        <View style={[tw.w5_6, tw.selfCenter, tw.pT16]}>
          <View style={[tw.flexRow, tw.wFull, tw.justifyCenter]}>
            <Image source={Logo} style={[tw.h24, tw.wFull, tw.mB8]} resizeMode="contain" />
          </View>
          <BodyText center style={[tw.mT8]}>
            You don't have any homes.
          </BodyText>
          <BodyText center style={[tw.mT4]}>
            Ask your agent to pick out some houses for you.
          </BodyText>
        </View>
      </View>
    );
  }

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'My Homes',
            showSettingsBtn: true,
          })
        }
      />
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
        <ScrollView style={[tw.wFull, tw.flex1, tw.mY4]}>{propertyRows}</ScrollView>
        {nonIdealState}
      </View>
    </>
  );
};

export default withNavigationFocus(BuyerSellerHomes);
