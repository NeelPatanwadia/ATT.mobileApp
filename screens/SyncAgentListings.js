import React, { useState, useEffect } from 'react';
import { View, Image, ActivityIndicator } from 'react-native';
import * as Progress from 'react-native-progress';
import { SafeAreaView } from 'react-navigation';
import { tw, color, colors } from 'react-native-tailwindcss';
import { LogoWithText } from '../assets/images';
import { propertyService } from '../services';
import { BodyText } from '../components';
import config from '../configs/config';

const SyncAgentListings = ({ navigation, screenProps: { user } }) => {
  const [messageText, setMessageText] = useState('Looking for Your MLS Listings');
  const [listingsAdded, setListingsAdded] = useState(0);
  const [numListingsToAdd, setNumListingsToAdd] = useState(0);

  useEffect(() => {
    getMLSListings();
  }, []);

  const getMLSListings = async () => {
    try {
      const mlsListings = await propertyService.queries.listListingsByListingAgentEmail(user.emailAddress);
      let listingsToAdd = [];

      if (mlsListings && mlsListings.length > 0) {
        setMessageText(`Syncing MLS Listings`);

        const existingPropertyListings = await propertyService.queries.listPropertyListings({
          listingAgentId: user.id,
        });

        if (existingPropertyListings && existingPropertyListings.length > 0) {
          for (const mlsListing of mlsListings) {
            if (!existingPropertyListings.find(propListing => propListing.listingKey === mlsListing.listingKey)) {
              listingsToAdd.push(mlsListing);
            }
          }
        } else {
          listingsToAdd = mlsListings;
        }

        setMessageText(`Adding Your MLS Listings`);
        setNumListingsToAdd(listingsToAdd.length);

        if (listingsToAdd.length > 0) {
          const promiseArray = [];

          for (const mlsListing of listingsToAdd) {
            promiseArray.push(createPropertyListing(mlsListing));
          }

          await Promise.all(promiseArray);
        }
      }
    } catch (error) {
      console.warn('Error attempting to sync property listings: ', error);
    }

    navigation.navigate('Agent');
  };

  const createPropertyListing = async mlsListing => {
    try {
      if (!mlsListing) {
        throw new Error('No MLS Listing provided');
      }

      const { listingId } = mlsListing;

      await propertyService.mutations.createPropertyRecords({
        listingId,
        agentId: user.id,
        fallbackPhoneNumber:
          config.env !== 'production' && config.listingAgentDefaultPhone ? config.listingAgentDefaultPhone : null,
      });

      setListingsAdded(prevState => prevState + 1);
    } catch (error) {
      setListingsAdded(prevState => prevState + 1);

      console.warn('Error adding property listing on sync: ', error);
    }
  };

  const renderLoading = () => (
    <>
      <BodyText style={[tw.textLg, tw.textCenter, tw.mB8]}>{messageText}</BodyText>
      <ActivityIndicator size="large" color={colors.gray500} />
    </>
  );

  return (
    <SafeAreaView style={[tw.flexCol, tw.flex1, tw.pX8, tw.bgPrimary]}>
      <View style={[tw.flex1, tw.flexCol, tw.justifyCenter, tw.alignCenter, tw.wFull, tw.pB20]}>
        <Image source={LogoWithText} style={[tw.h48, tw.wFull]} resizeMode="contain" />
        {renderLoading()}
        {numListingsToAdd ? (
          <View style={(tw.wFull, tw.flexRow, tw.mT8)}>
            <Progress.Bar
              progress={parseFloat(listingsAdded) / parseFloat(numListingsToAdd)}
              color={color.blue500}
              width={null}
            />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

export default SyncAgentListings;
