import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { colors, tw } from 'react-native-tailwindcss';
import { withNavigation } from 'react-navigation';
import { BodyText } from './textComponents';
import PrimaryInput from './inputs/PrimaryInput';
import { notificationService, propertyService } from '../services';
import { PlusIcon } from '../assets/images';
import config from '../configs/config';
import { SecondaryButton } from './buttons';
import { buildPropertyOfInterestAdded } from '../notifications/messageBuilder';
import { parseFriendlyGraphQLError } from '../helpers/errorHelpers';

const MlsForm = ({ title, client, successCallback, throwOnDuplicate, closeModal, onAddCustom, user, navigation }) => {
  const [mlsListingId, setMlsListingId] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const onError = errorMessage => {
    setAdding(false);
    setAddError(errorMessage || '');
  };

  const addProperty = async () => {
    try {
      const mlsListings = await propertyService.queries.getListingByListingId(mlsListingId);

      const mlsListing = mlsListings && mlsListings.length > 0 ? mlsListings[0] : null;

      if (!mlsListing) {
        onError(
          'Could not find a matching property listing. Please add this home with the Custom Property Listing feature below.'
        );

        return;
      }

      if (mlsListing.status && mlsListing.status === 'Closed') {
        onError('This Porperty is not available right now.');

        return;
      }

      const existingPropertyOfInterest = await propertyService.queries.getPropertyOfInterestByListingKey({
        clientId: client.id,
        listingKey: mlsListing.id,
      });

      if (existingPropertyOfInterest) {
        if (throwOnDuplicate) {
          onError('This home has already been added');
        } else {
          successCallback(existingPropertyOfInterest);
        }

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

      successCallback(newPropertyOfInterest);
    } catch (error) {
      console.log('Error adding property: ', error);

      const errorMessage = parseFriendlyGraphQLError(error, 'There was an error adding this home');

      onError(errorMessage);
    }
  };

  const addOrExit = async () => {
    if (mlsListingId) {
      setAdding(true);
      setAddError('');

      await addProperty(mlsListingId, setAdding, setAddError);
    } else {
      setAddError('Please enter an MLS ID');
    }
  };

  const goToCustomListings = () => {
    closeModal();

    navigation.navigate('AgentCustomListings', { client, onAdd: onAddCustom });
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

  return (
    <View style={[tw.wFull, tw.mX10, tw.pX4, tw.pY2s, tw.selfCenter, tw.bgWhite]}>
      <View style={[tw.mT4, tw.justifyCenter]}>
        <View style={[tw.flexRow, tw.wFull, tw.justifyBetween, tw.mB4]}>
          <BodyText style={[tw.mL2]}>{title}</BodyText>

          <View style={[tw.w6, tw.h6, tw.justifyCenter, tw.itemsCenter]}>
            {adding ? (
              <ActivityIndicator size="small" color={colors.gray500} />
            ) : (
              <TouchableOpacity onPress={addOrExit}>
                <Image source={PlusIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <PrimaryInput placeholder="MLS ID" onChangeText={setMlsListingId} value={mlsListingId} />

        {addError ? (
          <View>
            <BodyText style={[tw.textRed500, tw.mT2]} md>
              {addError}
            </BodyText>
          </View>
        ) : null}

        <View style={[tw.flexCol, tw.mT2]}>
          <BodyText style={[tw.wFull, tw.textCenter, tw.mT8]}>Don't have an MLS ID?</BodyText>
          <SecondaryButton
            style={[tw.textBlue500, tw.rounded, tw.border, tw.borderBlue500]}
            title="ADD CUSTOM PROPERTY LISTING"
            onPress={goToCustomListings}
          />
        </View>
      </View>
    </View>
  );
};

export default withNavigation(MlsForm);
