import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView } from 'react-navigation';
import {
  View,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { tw, color, colors } from 'react-native-tailwindcss';
import { FontAwesome5 } from '@expo/vector-icons';
import Carousel from 'react-native-snap-carousel';
import MapView, { Marker } from 'react-native-maps';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  MapPinIcon,
  CompassIcon,
  NotesIcon,
  messageBubbleImage,
} from '../../assets/images';
import { BodyText, FlexLoader, BuyerSellerModal, AgentModal, CustomPill } from '../../components';
import { calcRegion, splitScreenRegion } from '../../helpers';
import { logEvent, APP_REGIONS, EVENT_TYPES } from '../../helpers/logHelper';
import { chatService, propertyService } from '../../services';
import HomeDetailCollapsible from '../../components/HomeDetailCollapsible';

const initialRegion = {
  latitude: 44.0550811,
  longitude: -121.3571203,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const HomeDetails = ({ navigation, screenProps: { user } }) => {
  const smallMapView = useRef(null);
  const fullScreenMapView = useRef(null);
  const carouselRef = useRef(null);
  const [region, setRegion] = useState(initialRegion);
  const [fullScreenRegion, setFullScreenRegion] = useState(initialRegion);
  const [propertyImages, setPropertyImages] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageProgress, setImageProgress] = useState({});
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imageErrors, setImageErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyListing, setPropertyListing] = useState(null);
  const [propertyOfInterest, setPropertyOfInterest] = useState(null);
  const [propertyFullDetails, setPropertyFullDetails] = useState(null);
  const [isChatPresent, setIsChatPresent] = useState(null);

  const propertyOfInterestId = navigation.getParam('propertyOfInterestId', null);
  const propertyListingId = navigation.getParam('propertyListingId');

  useEffect(() => {
    if (propertyOfInterestId) {
      getPropertyOfInterest(propertyOfInterestId);
    }
  }, [propertyOfInterestId]);

  useEffect(() => {
    if (propertyListingId) {
      getPropertyListing(propertyListingId);
    }
  }, [propertyOfInterestId]);

  const getPropertyListingFullDetails = async id => {
    setLoading(true);
    try {
      const propFullDetail = await propertyService.queries.getPropertyListingFullDetails(id);

      setPropertyFullDetails(propFullDetail);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log('error getting propFullDetail ===>', error);
    }
  };

  const getPropertyOfInterest = async id => {
    setLoading(true);
    try {
      const propOfInterest = await propertyService.queries.getPropertyOfInterest(id);
      const {
        propertyListingId: propertyId,
        client: { id: clientId },
        propertyListing: { listingAgentId },
      } = propOfInterest;

      setPropertyOfInterest(propOfInterest);
      setPropertyListing(propOfInterest.propertyListing);

      getImages(propOfInterest.propertyListingId);
      updateRegion(propOfInterest.propertyListing);
      getPropertyListing(propOfInterest.propertyListingId);
      if (user.isAgent) {
        getPropertyListingFullDetails(propOfInterest.propertyListingId);
        try {
          const chatMessages = await chatService.mutations.chatGetMessages({
            buyingAgentId: user.id,
            propertyListingId: propertyId,
            clientId,
            listingAgentId,
            userId: user.id,
          });

          setIsChatPresent(chatMessages);
        } catch (error) {
          setIsChatPresent(null);
          console.log('error', error);
        }
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.warn('Error getting property of interest: ', error);
    }
  };

  const getPropertyListing = async id => {
    setLoading(true);
    try {
      const propListing = await propertyService.queries.getPropertyListing(id);

      // setPropertyOfInterest(null);
      setPropertyListing(propListing);

      getImages(propListing.id);
      if (user.isAgent && propertyListingId) getPropertyListingFullDetails(propListing.id);
      updateRegion(propListing);

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.warn('Error getting property listing: ', error);
    }
  };

  const getImages = async propListingId => {
    const propertyListingImages = await propertyService.queries.listPropertyListingImages(propListingId);

    setPropertyImages(propertyListingImages);

    if (propertyListingImages && propertyListingImages.length > 0) {
      propertyListingImages.map(async img => {
        if (img && img.mediaUrl) {
          try {
            await Image.prefetch(img.mediaUrl);
          } catch (error) {
            await logEvent({
              message: `Error Fetching Image - ${img ? img.id : `Invalid id`} ${JSON.stringify(error)}`,
              appRegion: APP_REGIONS.IMAGES,
              eventType: EVENT_TYPES.ERROR,
            });

            setImageErrors(prevState => [...prevState, { id: img.id, error }]);
          }
        }
      });
    }

    setImagesLoaded(true);
  };

  const updatePropertyStatus = async status => {
    try {
      await propertyService.mutations.updatePropertyOfInterest({
        id: propertyOfInterest.id,
        status,
      });

      const updatedProperty = { ...propertyOfInterest, status };

      setPropertyOfInterest(updatedProperty);
    } catch (error) {
      console.warn('Error updating property status: ', error);
    }
  };

  const updateRegion = propListing => {
    try {
      const newRegion = calcRegion([{ latitude: propListing.latitude, longitude: propListing.longitude }]);
      const splitRegion = splitScreenRegion(newRegion);

      setRegion(splitRegion);
      setFullScreenRegion(splitRegion);
    } catch (error) {
      console.warn('Error updating region: ', error);
    }
  };

  const renderPropertyImage = ({ item }) => {
    if (!item.mediaUrl) {
      return (
        <View
          key={`image-${item.id}`}
          style={[tw.wFull, tw.h64, tw.itemsCenter, tw.justifyCenter, tw.borderY, tw.borderGray500]}
        >
          <BodyText key={`propertyImage-${item.id}`}>Invalid Image</BodyText>
        </View>
      );
    }

    if (imageErrors.find(err => err.id === item.id)) {
      return (
        <View
          key={`image-${item.id}`}
          style={[tw.wFull, tw.h64, tw.itemsCenter, tw.justifyCenter, tw.borderY, tw.borderGray500]}
        >
          <BodyText key={`propertyImage-${item.id}`}>Error Loading Image</BodyText>
        </View>
      );
    }

    const imgKey = `image-${item.id}`;

    return (
      <View key={`image-${item.id}`} style={[tw.wFull, tw.selfCenter, tw.borderY, tw.borderGray500, tw.relative]}>
        <Image
          key={`propertyImage-${item.id}`}
          style={[tw.wFull, tw.h64]}
          source={{ uri: item.mediaUrl }}
          onLoadStart={() => setImageProgress(prevState => ({ ...prevState, [imgKey]: false }))}
          onLoadEnd={() => setImageProgress(prevState => ({ ...prevState, [imgKey]: true }))}
        />

        {imageProgress && !imageProgress[imgKey] ? (
          <View style={[tw.absolute, tw.left0, tw.right0, tw.hFull, tw.justifyCenter, tw.itemsCenter]}>
            <ActivityIndicator size="small" color={colors.gray500} />
          </View>
        ) : null}
      </View>
    );
  };

  const renderImageCarousel = () => {
    if (propertyImages && propertyImages.length > 0) {
      return (
        <View style={[tw.wFull, tw.flexCol, tw.justifyCenter, tw.itemsCenter, tw.mB4]}>
          <Carousel
            data={propertyImages}
            renderItem={renderPropertyImage}
            sliderWidth={Dimensions.get('window').width}
            itemWidth={Dimensions.get('window').width}
            onSnapToItem={index => setImageIndex(index)}
            ref={carouselRef}
          />

          <View style={[tw.wFull, tw.pX3, tw.pB0, tw.mT4, tw.flexRow, tw.justifyBetween]}>
            {imageIndex !== 0 ? (
              <TouchableOpacity onPress={() => carouselRef.current.snapToPrev()}>
                <ChevronLeftIcon width={15} height={15} fill={color.blue500} stroke={color.white} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 20, height: 20 }} />
            )}

            <BodyText>{`${imageIndex + 1} of ${propertyImages.length}`}</BodyText>

            {imageIndex !== propertyImages.length - 1 ? (
              <TouchableOpacity onPress={() => carouselRef.current.snapToNext()}>
                <ChevronRightIcon width={15} height={15} fill={color.blue500} stroke={color.white} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 20, height: 20 }} />
            )}
          </View>
        </View>
      );
    }

    if (!imagesLoaded) {
      return (
        <View style={[tw.wFull, tw.h64, tw.itemsCenter, tw.justifyCenter, tw.borderY, tw.borderGray500]}>
          <ActivityIndicator size="small" color={colors.gray500} />
        </View>
      );
    }

    return (
      <View style={[tw.wFull, tw.h64, tw.itemsCenter, tw.justifyCenter, tw.borderY, tw.borderGray500]}>
        <BodyText>No Listing Images</BodyText>
      </View>
    );
  };

  const renderActionBar = () => {
    if (!propertyOfInterest) {
      return null;
    }

    const isAgent = navigation.getParam('isAgent', false);

    return (
      <View style={[tw.flexRow, tw.mB4, tw.justifyBetween]}>
        <View style={[tw.flexRow]}>
          <TouchableOpacity
            style={[tw.pR6]}
            onPress={() =>
              navigation.navigate(isAgent ? 'AgentHomeDetailsNotes' : 'BuyerSellerHomeDetailsNotes', {
                propertyOfInterestId: propertyOfInterest.id,
                propertyAddress: propertyListing.address,
              })
            }
          >
            <NotesIcon width={25} height={25} fill={[color.gray700]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[tw.pR6]}
            onPress={() => updatePropertyStatus(propertyOfInterest.status === 'liked' ? 'unliked' : 'liked')}
          >
            {propertyOfInterest.status === 'liked' ? (
              <FontAwesome5 name="heart" solid style={[tw.textBlue500, tw.text2xl]} />
            ) : (
              <FontAwesome5 name="heart" regular style={[tw.textGray700, tw.text2xl]} />
            )}
          </TouchableOpacity>
        </View>
        {isAgent && isChatPresent && isChatPresent.length > 0 && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('BuyingAgentChatMessageScreen', {
                chatId: isChatPresent && isChatPresent.length > 0 && isChatPresent[0].chatId,
                receiverId: propertyListing.listingAgentId,
              })
            }
            style={tw.pR2}
          >
            <Image source={messageBubbleImage} style={{ width: 25, height: 25, opacity: 0.7 }} resizeMode="contain" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const formatPropertyPrice = () => {
    if (!propertyListing.listingPrice) {
      return '$ N/A';
    }

    if (propertyListing.listingPrice >= 1000000) {
      return `$${(propertyListing.listingPrice / 1000000).toFixed(2)} M`;
    }

    // Return price with comma seperated thousands place
    return `$${propertyListing.listingPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const linkToDirections = () => {
    Linking.openURL(
      `http://maps.apple.com/?daddr=${
        propertyListing.address.includes(',') ? propertyListing.address.split(',')[0] : propertyListing.address
      }+${propertyListing.city}+${propertyListing.state}+${propertyListing.zip}&dirflg=d`
    );
  };

  const renderMapModal = () => {
    if (!propertyListing || !propertyListing.latitude || !propertyListing.longitude) {
      return null;
    }

    if (navigation.getParam('isAgent', false)) {
      return (
        <AgentModal style={[tw.pX0]} trigger={renderMap()} title="Home Location">
          {renderMap('full')}
        </AgentModal>
      );
    }

    return (
      <BuyerSellerModal style={[tw.pX0]} trigger={renderMap()} title="Home Location">
        {renderMap('full')}
      </BuyerSellerModal>
    );
  };

  const renderMap = fullScreen => {
    if (fullScreen) {
      return (
        <SafeAreaView>
          <MapView
            style={[tw.wFull, tw.hFull]}
            zoomControlEnabled
            rotateEnabled={false}
            scrollEnabled
            onRegionChangeComplete={setFullScreenRegion}
            region={fullScreenRegion}
            ref={fullScreenMapView}
          >
            <Marker
              tracksViewChanges={Platform.OS !== 'android'}
              coordinate={{
                latitude: parseFloat(propertyListing.latitude),
                longitude: parseFloat(propertyListing.longitude),
              }}
              flat
              pinColor={color.blue500}
            >
              <MapPinIcon width={24} height={27} fill={color.blue500} stroke={color.blue500} />
            </Marker>
          </MapView>
        </SafeAreaView>
      );
    }

    return (
      <MapView
        style={[tw.wFull, tw.hFull]}
        zoomControlEnabled={false}
        rotateEnabled={false}
        scrollEnabled={false}
        onRegionChangeComplete={setRegion}
        region={region}
        liteMode
        ref={smallMapView}
      >
        <Marker
          coordinate={{
            latitude: parseFloat(propertyListing.latitude),
            longitude: parseFloat(propertyListing.longitude),
          }}
          flat
          pinColor={color.blue500}
        >
          <MapPinIcon width={24} height={27} fill={color.blue500} stroke={color.blue500} />
        </Marker>
      </MapView>
    );
  };

  const _getListingKey = () => {
    if (!propertyListing.listingId) return 'N/A';

    return propertyListing.listingId;
  };

  const getDescription = () => {
    const description = propertyListing ? propertyListing.description : '';

    if (!description) return null;

    return description;
  };

  if (loading || (!propertyOfInterest && !propertyListing && !propertyFullDetails)) {
    return <FlexLoader />;
  }

  return (
    <View style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
      <ScrollView containerStyle={[tw.wFull, tw.selfCenter, tw.pB4]}>
        <View style={[tw.flexRow, tw.pY4, tw.pX6, tw.justifyBetween, tw.itemsCenter]}>
          <View style={[tw.flexCol]}>
            <BodyText style={[tw.textXl, tw.mB1]} bold>
              {propertyListing.address.includes(',') ? propertyListing.address.split(',')[0] : propertyListing.address}
            </BodyText>
            <BodyText
              style={[tw.textBase]}
            >{`${propertyListing.city}, ${propertyListing.state} ${propertyListing.zip}`}</BodyText>
            <BodyText style={[tw.textBase, tw.mT1]}>{`MLS Listing ID: ${_getListingKey()}`}</BodyText>

            {propertyListing.isCustomListing && user.isAgent ? <CustomPill containerStyle={[tw.mT2]} /> : null}
          </View>

          <TouchableOpacity onPress={linkToDirections} style={[tw.mT2, tw.selfStart]}>
            <CompassIcon width={30} height={30} fill={[color.gray700]} />
          </TouchableOpacity>
        </View>

        {renderImageCarousel()}

        <View style={[tw.flexCol, tw.pT2, tw.mX4, tw.pX2]}>
          {renderActionBar()}

          <View style={[tw.flexRow, tw.itemsCenter]}>
            <BodyText style={[tw.textLg, tw.mY2]} bold>
              {`${propertyListing.bedrooms || 'N/A'} beds  ·  `}
            </BodyText>

            <BodyText style={[tw.textLg, tw.mY2]} bold>
              {`${propertyListing.bathrooms || 'N/A'} baths  ·  `}
            </BodyText>

            <BodyText style={[tw.textLg, tw.mY2]} bold>
              {`${propertyListing.squareFeet || 'N/A'} sqft`}
            </BodyText>
          </View>

          <View style={[tw.flexRow, tw.wFull, tw.justifyBetween, tw.itemsCenter, tw.mT4, tw.mB4]}>
            <View style={[tw.flexCol, tw.justifyCenter, tw.mL4]}>
              {propertyListing.status && (
                <View style={[tw.flexRow, tw.itemsCenter]}>
                  <View style={[tw.w3, tw.h3, tw.roundedFull, tw.bgBlue500, tw.mR2]} />
                  <BodyText style={[tw.text2xl]}>{propertyListing.status.toUpperCase()}</BodyText>
                </View>
              )}

              <BodyText style={[tw.text3xl, tw.textCenter]} bold>
                {formatPropertyPrice()}
              </BodyText>
            </View>

            <View
              style={[
                tw.w32,
                tw.h32,
                tw.overflowHidden,
                tw.roundedFull,
                tw.justifyCenter,
                tw.itemsCenter,
                tw.alignCenter,
                tw.mR2,
              ]}
            >
              {renderMapModal()}
            </View>
          </View>
          {getDescription() && (
            <View>
              <BodyText style={[tw.textLg, tw.textGray900, tw.mY2]} bold>
                Description:
              </BodyText>
              <BodyText style={[tw.textSm, tw.textGray900, tw.mY2, { lineHeight: 28, letterSpacing: 0.84 }]}>
                {getDescription()}
              </BodyText>
            </View>
          )}
        </View>
        <HomeDetailCollapsible
          isAgent={user.isAgent}
          propertyListing={propertyListing}
          propertyFullDetails={propertyFullDetails}
        />
      </ScrollView>
    </View>
  );
};

export default HomeDetails;
