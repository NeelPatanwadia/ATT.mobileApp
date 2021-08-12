import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Image } from 'react-native';
import Carousel from 'react-native-snap-carousel';
import { color, colors, tw } from 'react-native-tailwindcss';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { API } from 'aws-amplify';
import { ChevronLeftIcon, ChevronRightIcon, HeartFullIcon, HeartIcon } from '../../assets/images';
import { BodyText, FlexLoader } from '../../components';
import { APP_REGIONS, EVENT_TYPES, logEvent } from '../../helpers';
import AgentTabContext from '../../navigation/AgentTabContext';
import { replacePipesInList } from '../../helpers/stringHelpers';
import BuyerSellerTabContext from '../../navigation/BuyerSellerTabContext';
import { getListing } from '../../src/graphql/queries';
import { notificationService, propertyService, userService } from '../../services';
import SearchListingContex from './SearchListingContex';
import { buildClientAddedPropertyOfInterest } from '../../notifications/messageBuilder';

const ListingDetails = ({ navigation, screenProps: { user } }) => {
  const id = navigation.getParam('id', null);
  const isLiked = navigation.getParam('isLiked', null);
  const property = navigation.getParam('property', null);
  const carouselRef = useRef(null);
  const { setNavigationParams } = useContext(user.isAgent ? AgentTabContext : BuyerSellerTabContext);
  const { searchListing, setSearchListing } = useContext(SearchListingContex);
  const [listingDetails, setListingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [propertyImages, setPropertyImages] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageProgress, setImageProgress] = useState({});
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imageErrors, setImageErrors] = useState([]);
  const [status, setStatus] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [success, setSuccess] = useState(true);

  useEffect(() => {
    getListingDetails();
  }, []);

  useEffect(() => {
    setStatus(isLiked);
  }, [isLiked]);

  const getListingDetails = async () => {
    try {
      if (id) {
        const listing = await API.graphql({
          query: getListing,
          variables: { id: `${id}` },
          authMode: 'AMAZON_COGNITO_USER_POOLS',
        })
          .then(response => response.data.getListing)
          .catch(error => {
            if (!user.isAgent) {
              return error.data.getListing;
            }

            return null;
          });

        if (listing) {
          setListingDetails(listing);
          setPropertyImages(listing.Media);
          if (listing.Media && listing.Media.length > 0) {
            listing.Media.map(async img => {
              if (img && img.MediaURL) {
                try {
                  await Image.prefetch(img.MediaURL);
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
        } else {
          setListingDetails(null);
        }
      } else {
        setListingDetails(null);
      }
      setLoading(false);
    } catch (error) {
      console.log('error', error);
      setListingDetails(null);
      setLoading(false);
    }
  };

  const checkIsNull = data => !(data === null || data === undefined);

  const getBooleanFriendlyValue = value => {
    if (value === true) {
      return 'Yes';
    }

    if (value === false) {
      return 'No';
    }

    return value.toString();
  };

  const notifyAgentOfNewProperty = async propertyOfInterest => {
    try {
      const {
        propertyListing: { address, city, state, zip },
      } = propertyOfInterest;

      const formattedAddress = `${address.includes(',') ? address.split(',')[0] : address} ${city}, ${state} ${zip}`;
      const userInfo = await userService.queries.getUser(user.agentId);
      const { push, email } = buildClientAddedPropertyOfInterest({
        saName: `${user.firstName} ${user.lastName}`,
        baName: `${userInfo.firstName} ${userInfo.lastName}`,
        address: formattedAddress,
      });

      await notificationService.mutations.createNotification({
        userId: user.agentId,
        pushMessage: push,
        smsMessage: push,
        email,
      });
    } catch (error) {
      console.warn('Error notifying buyer of new property of interest: ', error);
    }
  };

  const renderListDetails = (label, value, isFrom) => {
    if (!checkIsNull(value) || value === '') return null;

    return (
      <View style={[tw.flexRow, tw.mT2, isFrom !== 'Details' && tw.mS3]} key={`${isFrom}_${label}`}>
        <BodyText style={[tw.textBase, tw.textGray900, { lineHeight: 30, letterSpacing: 0.96, maxWidth: '60%' }]} bold>
          {`${label}: `}
        </BodyText>

        <BodyText style={[tw.textBase, tw.textGray900, tw.flex1, { lineHeight: 30, letterSpacing: 0.96 }]} medium>
          {value === true || value === false ? getBooleanFriendlyValue(value) : replacePipesInList(value)}
        </BodyText>
      </View>
    );
  };

  const renderPropertyImage = ({ item }) => {
    if (!item.MediaURL) {
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
          source={{ uri: item.MediaURL }}
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

  const formatPropertyPrice = () => {
    if (!listingDetails.listing_price) {
      return '$ N/A';
    }

    if (listingDetails.listing_price >= 1000000) {
      return `$${(listingDetails.listing_price / 1000000).toFixed(2)} M`;
    }

    // Return price with comma seperated thousands place
    return `$${listingDetails.listing_price.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const updatePropertyStatus = async (propertyOfInterestId, newStatus) => {
    try {
      await propertyService.mutations.updatePropertyOfInterest({
        id: propertyOfInterestId,
        status: newStatus,
      });

      const updatedListing = searchListing.map(value => {
        if (value.id === id) {
          return { ...value, isLiked: newStatus };
        }

        return value;
      });

      setSearchListing(updatedListing);
      setStatus(newStatus);
    } catch (error) {
      console.warn('Error updating property status: ', error);
    }
  };

  const onLikePress = async () => {
    if (property.length !== 0) {
      const [{ id: propertyOfInterestId }] = property;

      if (status === 'liked') {
        updatePropertyStatus(propertyOfInterestId, 'unliked');
      } else {
        updatePropertyStatus(propertyOfInterestId, 'liked');
      }
    } else {
      try {
        const createPropertyResponse = await propertyService.mutations.createPropertyRecords({
          listingId: listingDetails.listing_id,
          clientId: user.id,
          fallbackPhoneNumber: null,
        });
        const newPropertyOfInterest = await propertyService.queries.getPropertyOfInterest(
          createPropertyResponse.propertyOfInterestId
        );

        notifyAgentOfNewProperty(newPropertyOfInterest);

        setMessage('Property added');
        setSuccess(true);
        setShowMessage(true);
        updatePropertyStatus(newPropertyOfInterest.id, 'liked');
      } catch (error) {
        console.log('error creating new property', error);
        setMessage('Error adding property');
        setSuccess(false);
        setShowMessage(true);
      }
    }
  };

  const getDescription = () => {
    const description = listingDetails ? listingDetails.description : '';

    if (!description) return null;

    return description;
  };

  return (
    <View style={[tw.hFull, tw.wFull, tw.bgPrimary]}>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Listing Details',
            showBackBtn: true,
            showSettingsBtn: true,
          })
        }
      />
      {loading ? (
        <FlexLoader />
      ) : (
        <ScrollView containerStyle={[tw.wFull, tw.selfCenter, tw.pB4]}>
          <View style={[tw.flexRow, tw.pY4, tw.pX6, tw.justifyBetween, tw.itemsCenter]}>
            <View style={[tw.flexCol]}>
              <BodyText style={[tw.textXl, tw.mB1]} bold>
                {listingDetails.address.includes(',') ? listingDetails.address.split(',')[0] : listingDetails.address}
              </BodyText>
              <BodyText
                style={[tw.textBase]}
              >{`${listingDetails.city}, ${listingDetails.state} ${listingDetails.zip}`}</BodyText>
              <BodyText style={[tw.textBase, tw.mT1]}>{`MLS Listing ID: ${listingDetails.listing_id}`}</BodyText>
            </View>
          </View>

          {renderImageCarousel()}

          <View style={[tw.flexCol, tw.pT2, tw.mX4, tw.pX2]}>
            <View style={[tw.flexRow, tw.itemsCenter, tw.justifyBetween]}>
              <View style={[tw.flexRow, tw.itemsCenter]}>
                <BodyText style={[tw.textLg, tw.mY2]} bold>
                  {`${listingDetails.bedrooms || 'N/A'} beds  ·  `}
                </BodyText>

                <BodyText style={[tw.textLg, tw.mY2]} bold>
                  {`${listingDetails.bathrooms || 'N/A'} baths  ·  `}
                </BodyText>

                <BodyText style={[tw.textLg, tw.mY2]} bold>
                  {`${listingDetails.square_feet || 'N/A'} sqft`}
                </BodyText>
              </View>
              {/* {!user.isAgent && (
                <TouchableOpacity onPress={onLikePress} style={[tw.h8, tw.w8, tw.itemsCenter, tw.justifyCenter]}>
                  {status === 'liked' ? (
                    <HeartFullIcon width={25} height={25} fill={color.blue500} />
                  ) : (
                    <HeartIcon width={30} height={30} fill={color.blue500} />
                  )}
                </TouchableOpacity>
              )} */}
            </View>
            {showMessage && (
              <BodyText right medium style={[{ color: success ? color.mint500 : 'red' }]}>
                {message}
              </BodyText>
            )}
            <View style={[tw.flexRow, tw.wFull, tw.justifyBetween, tw.itemsCenter, tw.mT4, tw.mB4]}>
              <View style={[tw.flexCol, tw.justifyCenter, tw.mL4]}>
                <View style={[tw.flexRow, tw.itemsCenter]}>
                  <View style={[tw.w3, tw.h3, tw.roundedFull, tw.bgBlue500, tw.mR2]} />
                  {listingDetails.status && (
                    <BodyText style={[tw.text2xl]}>{listingDetails.status.toUpperCase()}</BodyText>
                  )}
                </View>

                <BodyText style={[tw.text3xl, tw.textCenter]} bold>
                  {formatPropertyPrice()}
                </BodyText>
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
          <View style={[tw.pB3]}>
            <View style={[tw.mX4, tw.pX2]}>
              <BodyText style={[tw.textLg, tw.textGray900, tw.mY2]} bold>
                Details:
              </BodyText>
              {renderListDetails('Lot Size', listingDetails.lot_size, 'Details')}
              {listingDetails.association_fee
                ? renderListDetails('HOA Dues', `$${listingDetails.association_fee}`, 'Details')
                : null}
              {listingDetails.association_fee_frequency
                ? renderListDetails('HOA Dues Frequency', `${listingDetails.association_fee_frequency}`, 'Details')
                : null}
              {renderListDetails('Parcel Number', listingDetails.parcel_number, 'Details')}
              {renderListDetails('Property Sub Type', listingDetails.property_sub_type, 'Details')}
              {renderListDetails('Subdivision Name', listingDetails.subdivision_name, 'Details')}
              {listingDetails.square_feet
                ? renderListDetails('Lot Size Square Feet', `${listingDetails.square_feet} sqft`, 'Details')
                : null}
              {renderListDetails('Zoning', listingDetails.zoning, 'Details')}
              {renderListDetails('Additional Parcels', listingDetails.additional_parcels_yn, 'Details')}
              {renderListDetails('Built', listingDetails.year_built, 'Details')}
              {renderListDetails('County', listingDetails.county, 'Details')}
              {renderListDetails('Status', listingDetails.status, 'Details')}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default withNavigationFocus(ListingDetails);
