import React, { useEffect, useState, useContext } from 'react';
import { ActivityIndicator, Image, TouchableOpacity, View } from 'react-native';
import ModalDropdown from 'react-native-modal-dropdown';
import { color, colors, tw } from 'react-native-tailwindcss';
import { BathroomIcon, BedroomIcon, DownTriangleImage, HeartFullIcon, HeartIcon } from '../assets/images';
import { PrimaryButton } from './buttons';
import { BodyText } from './textComponents';
import { notificationService, propertyService, userService } from '../services';
import { buildClientAddedPropertyOfInterest, buildPropertyOfInterestAdded } from '../notifications/messageBuilder';
import config from '../configs/config';
import SearchListingContex from '../screens/SearchListings/SearchListingContex';

const SearchPropertyCard = ({ clientsList, index, item, user, property, dropdownClientList, onPress, isLiked }) => {
  const { searchListing, setSearchListing } = useContext(SearchListingContex);
  const [imageProgress, setImageProgress] = useState({});
  const [selectedClient, setSelectedClient] = useState('Select Client');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [success, setSuccess] = useState(true);

  useEffect(() => {
    if (showMessage) {
      setTimeout(() => {
        setShowMessage(false);
      }, 3000);
    }
  }, [showMessage]);

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        setError(false);
      }, 3000);
    }
  }, [error]);

  const renderPropertyImage = imageItem => {
    if (imageItem.length === 0) {
      return (
        <View style={[tw.wFull, tw.h40, tw.itemsCenter, tw.justifyCenter, tw.borderY, tw.borderGray500]}>
          <BodyText>No Image Found</BodyText>
        </View>
      );
    }
    if (!imageItem[0].MediaURL) {
      return (
        <View
          key={`image-${imageItem[0].MediaKey}`}
          style={[tw.wFull, tw.h40, tw.itemsCenter, tw.justifyCenter, tw.borderY, tw.borderGray500]}
        >
          <BodyText key={`propertyImage-${imageItem[0].MediaKey}`}>Invalid Image</BodyText>
        </View>
      );
    }

    const imgKey = `image-${imageItem[0].MediaKey}`;

    return (
      <View
        key={`image-${imageItem[0].MediaKey}`}
        style={[tw.wFull, tw.selfCenter, tw.borderY, tw.borderGray500, tw.relative]}
      >
        <Image
          key={`propertyImage-${imageItem[0].MediaKey}`}
          style={[tw.wFull, tw.h40]}
          source={{ uri: imageItem[0].MediaURL }}
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

  const notifyBuyerOfNewProperty = async propertyOfInterest => {
    try {
      const {
        propertyListing: { address, city, state, zip },
      } = propertyOfInterest;

      const formattedAddress = `${address.includes(',') ? address.split(',')[0] : address} ${city}, ${state} ${zip}`;
      const { push } = buildPropertyOfInterestAdded({
        baName: `${user.firstName} ${user.lastName}`,
        brokerage: user.brokerage,
        address: formattedAddress,
      });

      await notificationService.mutations.createNotification({
        userId: propertyOfInterest.clientId,
        pushMessage: push,
      });
    } catch (error) {
      console.warn('Error notifying buyer of new property of interest: ', error);
    }
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

  const addProperty = async (client, mlsListingId) => {
    try {
      setLoading(true);
      const mlsListings = await propertyService.queries.getListingByListingId(mlsListingId);

      const mlsListing = mlsListings && mlsListings.length > 0 ? mlsListings[0] : null;

      if (!mlsListing) {
        setMessage('Error adding property');
        setSuccess(false);
        setShowMessage(true);
        setLoading(false);

        return;
      }

      if (mlsListing.status && mlsListing.status === 'Closed') {
        setMessage('This Porperty is not available right now.');
        setSuccess(false);
        setShowMessage(true);
        setLoading(false);

        return;
      }

      const existingPropertyOfInterest = await propertyService.queries.getPropertyOfInterestByListingKey({
        clientId: client.id,
        listingKey: mlsListing.id,
      });

      if (existingPropertyOfInterest) {
        setMessage('Property already added');
        setSuccess(false);
        setShowMessage(true);
        setLoading(false);

        return;
      }

      const createPropertyResponse = await propertyService.mutations.createPropertyRecords({
        listingId: mlsListingId,
        clientId: client.id,
        fallbackPhoneNumber:
          config.env !== 'production' && config.listingAgentDefaultPhone ? config.listingAgentDefaultPhone : null,
      });

      const newPropertyOfInterest = await propertyService.queries.getPropertyOfInterest(
        createPropertyResponse.propertyOfInterestId
      );

      await notifyBuyerOfNewProperty(newPropertyOfInterest);
      setLoading(false);
      setMessage('Property added');
      setSuccess(true);
      setShowMessage(true);
    } catch (error) {
      setLoading(false);
      console.log('Error adding property: ', error);
      setMessage('Error adding property');
      setSuccess(false);
      setShowMessage(true);
    }
  };

  const onAddToClientPress = () => {
    if (selectedClient === 'Select Client') {
      setError(true);
    } else {
      setError(false);
      const idx = clientsList.findIndex(client => selectedClient === `${client.firstName} ${client.lastName}`);

      addProperty(clientsList[idx], item.listing_id);
    }
  };

  const updatePropertyStatus = async (propertyOfInterestId, newStatus) => {
    try {
      await propertyService.mutations.updatePropertyOfInterest({
        id: propertyOfInterestId,
        status: newStatus,
      });

      const updatedListing = searchListing.map(value => {
        if (value.id === item.id) {
          return { ...value, isLiked: newStatus };
        }

        return value;
      });

      setSearchListing(updatedListing);
    } catch (error) {
      console.warn('Error updating property status: ', error);
    }
  };

  const onLikePress = async () => {
    setLikeLoading(true);
    if (property.length !== 0) {
      const [{ id: propertyOfInterestId }] = property;

      if (isLiked === 'liked') {
        updatePropertyStatus(propertyOfInterestId, 'unliked');
      } else {
        updatePropertyStatus(propertyOfInterestId, 'liked');
      }
      setLikeLoading(false);
    } else {
      try {
        const mlsListings = await propertyService.queries.getListingByListingId(item.listing_id);
        const mlsListing = mlsListings && mlsListings.length > 0 ? mlsListings[0] : null;

        if (mlsListings && mlsListing.status && mlsListing.status === 'Closed') {
          setMessage('This Porperty is not available right now.');
          setSuccess(false);
          setShowMessage(true);
          setLoading(false);

          return;
        }

        const createPropertyResponse = await propertyService.mutations.createPropertyRecords({
          listingId: item.listing_id,
          clientId: user.id,
          fallbackPhoneNumber:
            config.env !== 'production' && config.listingAgentDefaultPhone ? config.listingAgentDefaultPhone : null,
        });

        const newPropertyOfInterest = await propertyService.queries.getPropertyOfInterest(
          createPropertyResponse.propertyOfInterestId
        );

        notifyAgentOfNewProperty(newPropertyOfInterest);

        updatePropertyStatus(newPropertyOfInterest.id, 'liked');
        setLikeLoading(false);
      } catch (error) {
        setLikeLoading(false);
        console.log('error creating new property', error);
        setMessage('Error adding property');
        setSuccess(false);
        setShowMessage(true);
      }
    }
  };

  return (
    <TouchableOpacity onPress={onPress} key={index} style={[tw.shadow, tw.bgGray100, tw.mX4, tw.mB2]}>
      <View style={[tw.pX3, tw.bgBlue500, tw.pY2]}>
        <BodyText style={[tw.textWhite]} lg>
          {item.address}
        </BodyText>
        <View style={[tw.flexRow, tw.justifyBetween, tw.itemsCenter]}>
          <BodyText style={[tw.textWhite]} lg>
            {`MLS: ${item.listing_id}`}
          </BodyText>
          <BodyText style={[tw.textWhite]} bold xl>
            {item.status.toUpperCase()}
          </BodyText>
        </View>
      </View>
      {renderPropertyImage(item.Media)}
      <View style={[tw.pX5, tw.pY3]}>
        <View style={[tw.flexRow, tw.justifyBetween, tw.itemsCenter]}>
          <BodyText style={[tw.textBlack]} lg>
            {`$${item.listing_price}`}
          </BodyText>
          {!user.isAgent && (
            <TouchableOpacity
              disabled={likeLoading}
              onPress={onLikePress}
              style={[tw.h8, tw.w8, tw.itemsCenter, tw.justifyCenter]}
            >
              {isLiked === 'liked' ? (
                <HeartFullIcon width={25} height={25} fill={color.blue500} />
              ) : (
                <HeartIcon width={30} height={30} fill={color.blue500} />
              )}
            </TouchableOpacity>
          )}
          <View style={[tw.flexRow]}>
            <BedroomIcon width={20} height={22} fill={color.black} />
            <BodyText style={[tw.mL1, tw.textBlack]} lg>
              {item.bedrooms ? item.bedrooms : 'N/A'}
            </BodyText>
            <BodyText style={[tw.textBlack]} lg>
              {` | `}
            </BodyText>
            <BathroomIcon width={20} height={22} fill={color.black} />
            <BodyText style={[tw.mL1, tw.textBlack]} lg>
              {item.bathrooms ? item.bathrooms : 'N/A'}
            </BodyText>
            <BodyText style={[tw.textBlack]} lg>
              {` | `}
            </BodyText>
            <BodyText style={[tw.textBlack]} lg>
              {`${item.square_feet ? item.square_feet : 'N/A'} sqft`}
            </BodyText>
          </View>
        </View>
        {user.isAgent && (
          <View style={[tw.mT2, tw.flexRow, tw.itemsCenter, tw.justifyBetween]}>
            <View style={[tw.mR2, tw.flex1]}>
              <ModalDropdown
                renderRightComponent={() => (
                  <Image style={[tw.h5, tw.w5, { tintColor: 'gray' }]} source={DownTriangleImage} />
                )}
                defaultValue={selectedClient}
                onSelect={(selectedIndex, selectedOption) => setSelectedClient(selectedOption)}
                dropdownTextStyle={[tw.textGray500, { fontSize: 15, fontWeight: '500' }]}
                dropdownTextHighlightStyle={[tw.textGray700, { fontSize: 15, fontWeight: 'bold' }]}
                textStyle={[tw.flex1, tw.mR1, tw.textGray500, { fontSize: 15, fontWeight: '500' }]}
                key={`DropDown-${index}`}
                options={dropdownClientList}
                style={[tw.border, tw.borderGray600, tw.p2, { borderRadius: 5 }]}
                dropdownStyle={[
                  tw.border,
                  tw.borderGray600,
                  tw.mT2,
                  { width: '40%', marginLeft: -10 },
                  dropdownClientList.length < 4 && { height: 120 },
                ]}
              />
            </View>
            <View>
              <PrimaryButton
                loading={loading}
                loadingTitle="ADDING"
                onPress={() => onAddToClientPress()}
                title="ADD TO CLIENT"
              />
            </View>
          </View>
        )}
        {error && (
          <BodyText medium style={[{ color: 'red' }]}>
            Please select a client
          </BodyText>
        )}
        {showMessage && (
          <BodyText right medium style={[{ color: success ? color.mint500 : 'red' }]}>
            {message}
          </BodyText>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default SearchPropertyCard;
