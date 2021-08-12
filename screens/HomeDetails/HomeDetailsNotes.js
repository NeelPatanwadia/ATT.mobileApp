import React, { useEffect, useState, useRef } from 'react';
import { View, Platform, Image, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { tw, color, colors } from 'react-native-tailwindcss';
import Carousel from 'react-native-snap-carousel';
import * as Permissions from 'expo-permissions';
import * as ImagePicker from 'expo-image-picker';
import { Storage } from 'aws-amplify';
import { JSHash, CONSTANTS } from 'react-native-hash';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import dateFormat from 'dateformat';
import { CameraIcon, ChevronRightIcon, ChevronLeftIcon } from '../../assets/images';
import { BodyText, PrimaryInput, PrimaryButton } from '../../components';
import { propertyService } from '../../services';

const HomeDetailsNotes = ({ navigation, screenProps: { user } }) => {
  const carouselRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [propertyNotes, setPropertyNotes] = useState(null);
  const [propertyNotesImages, setPropertyNotesImages] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(true);
  const [imageErrors, setImageErrors] = useState([]);
  const [imageProgress, setImageProgress] = useState({});
  const [clientNotesFromAPI, setClientNotesFromAPI] = useState(null);
  const [clientNotesUpdateAtFromAPI, setClientNotesUpdateAtFromAPI] = useState(null);
  const [clientName, setClientName] = useState(null);

  const propertyOfInterestId = navigation.getParam('propertyOfInterestId', null);

  useEffect(() => {
    getPermissionAsync();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const getPermissionAsync = async () => {
    if (Platform.OS === 'ios') {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);

      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    }
  };

  const onSubmit = async () => {
    setSaving(true);
    try {
      const updateNotes = {
        id: propertyOfInterestId,
      };

      if (user.isAgent) {
        updateNotes.notes = propertyNotes && propertyNotes.replace(/\n/g, '\\n');
      } else {
        updateNotes.clientNotes = propertyNotes && propertyNotes.replace(/\n/g, '\\n');
        updateNotes.clientNotesUpdatedAt = Math.floor(new Date().getTime() / 1000);
      }

      await propertyService.mutations.updatePropertyOfInterest(updateNotes);

      setSaving(false);

      navigation.pop();

      return;
    } catch (error) {
      console.warn('Error saving propertyOfInterest notes: ', error);
    }

    setSaving(false);
  };

  const loadData = async () => {
    try {
      getImages();

      const propOfInterest = await propertyService.queries.getPropertyOfInterest(propertyOfInterestId);

      if (propOfInterest) {
        if (user.isAgent) {
          setPropertyNotes(propOfInterest.notes);
          setClientNotesFromAPI(propOfInterest.clientNotes);
          setClientNotesUpdateAtFromAPI(propOfInterest.clientNotesUpdatedAt);
          setClientName(`${propOfInterest.client.firstName} ${propOfInterest.client.lastName}`);
        } else {
          setPropertyNotes(propOfInterest.clientNotes);
        }
      }
    } catch (error) {
      console.warn('Error loading data for property notes: ', error);
    }
  };

  const getImages = async () => {
    const dbPropertyNotesImages = await propertyService.queries.listPropertyOfInterestImages(propertyOfInterestId);

    if (dbPropertyNotesImages && dbPropertyNotesImages.length > 0) {
      dbPropertyNotesImages.map(async img => {
        if (img && img.fileName) {
          try {
            await Storage.get(img.fileName).then(res => {
              img.url = res;
            });
          } catch (error) {
            console.log('Error Fetching Image - ', img ? img.id : 'Invalid id', error);
            setImageErrors(prevState => [...prevState, { id: img.id, error }]);
          }
        }
      });

      setPropertyNotesImages(dbPropertyNotesImages);
      setImagesLoaded(true);
    }
  };

  const renderPropertyNotesImage = ({ item }) => {
    if (!item.url) {
      return (
        <View
          key={`image-${item.id}`}
          style={[tw.wFull, tw.h64, tw.itemsCenter, tw.justifyCenter, tw.borderY, tw.borderGray500]}
        >
          <BodyText key={`propertyNotesImage-${item.id}`}>Invalid Image</BodyText>
        </View>
      );
    }

    if (imageErrors.find(err => err.id === item.id)) {
      return (
        <View
          key={`image-${item.id}`}
          style={[tw.wFull, tw.h64, tw.itemsCenter, tw.justifyCenter, tw.borderY, tw.borderGray500]}
        >
          <BodyText key={`propertyNotesImage-${item.id}`}>Error Loading Image</BodyText>
        </View>
      );
    }

    const imgKey = `image-${item.id}`;

    return (
      <View key={`image-${item.id}`} style={[tw.wFull, tw.selfCenter, tw.borderY, tw.borderGray500, tw.relative]}>
        <Image
          key={`propertyNotesImage-${item.id}`}
          style={[tw.wFull, tw.h64]}
          source={{ uri: item.url }}
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
    if (propertyNotesImages && propertyNotesImages.length > 0) {
      return (
        <View style={[tw.wFull, tw.flexCol, tw.justifyCenter, tw.itemsCenter, tw.mB4, tw.mT0]}>
          <Carousel
            data={propertyNotesImages}
            renderItem={renderPropertyNotesImage}
            sliderWidth={Dimensions.get('window').width}
            itemWidth={Dimensions.get('window').width}
            onSnapToItem={index => setImageIndex(index)}
            ref={carouselRef}
          />

          <View style={[tw.wFull, tw.pB0, tw.mT4, tw.flexRow, tw.justifyBetween]}>
            {imageIndex !== 0 ? (
              <TouchableOpacity onPress={() => carouselRef.current.snapToPrev()}>
                <ChevronLeftIcon width={15} height={15} fill={color.teal500} stroke={color.white} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 20, height: 20 }} />
            )}

            <BodyText>{`${imageIndex + 1} of ${propertyNotesImages.length}`}</BodyText>

            {imageIndex !== propertyNotesImages.length - 1 ? (
              <TouchableOpacity onPress={() => carouselRef.current.snapToNext()}>
                <ChevronRightIcon width={15} height={15} fill={color.teal500} stroke={color.white} />
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
        <View style={[tw.h24, tw.flexRow, tw.itemsCenter, tw.justifyCenter]}>
          <BodyText style={[tw.mR4]}>Loading Images</BodyText>
          <ActivityIndicator size="small" color={colors.gray500} />
        </View>
      );
    }

    return null;
  };

  const showImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      const response = await fetch(result.uri);
      const blob = await response.blob();
      const fileName = result.uri.replace(/^.*[\\/]/, '');
      const fileNameWithoutExtension = fileName.split('.')[0];
      const fileExtension = fileName.split('.')[1];
      let hashedFileName;

      setSaving(true);

      JSHash(fileNameWithoutExtension, CONSTANTS.HashAlgorithms.sha256)
        .then(hash => {
          hashedFileName = `${hash}.${fileExtension}`;

          Storage.put(hashedFileName, blob, {
            level: 'public',
          })
            .then(async res => {
              await propertyService.mutations
                .createPropertyOfInterestImage({ property_of_interest_id: propertyOfInterestId, file_name: res.key })
                .then(() => getImages());
              setSaving(false);
            })
            .catch(err => {
              console.warn('Error saving propertyOfInterest Image: ', err);
              setSaving(false);
            });
        })
        .catch(e => {
          console.log(e);
          setSaving(false);
        });
    }
  };

  return (
    <KeyboardAwareScrollView style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
      <View style={[tw.flexRow, tw.pT4, tw.pX6, tw.wFull, tw.itemsCenter, tw.justifyBetween]}>
        <View style={[tw.w5_6]}>
          <BodyText style={[tw.textXl, tw.mB1]}>{navigation.getParam('propertyAddress', '')}</BodyText>
        </View>

        <View>
          <TouchableOpacity disabled={saving} onPress={showImagePicker}>
            <CameraIcon height={20} width={20} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[tw.flexRow, tw.pT4, tw.pX6, tw.wFull]}>{imagesLoaded && renderImageCarousel()}</View>
      <View style={[tw.flexCol]}>
        <View style={[tw.mX4]}>
          <PrimaryInput
            placeholder="Write Something..."
            onChangeText={setPropertyNotes}
            value={propertyNotes}
            inputStyle={[tw.textSm]}
            multiline
          />
        </View>
        <View style={[tw.pT2, tw.mX4, tw.alignBottom]}>
          <PrimaryButton
            style={[tw.alignBottom]}
            loading={saving}
            loadingTitle="Updating"
            title="Save and Return"
            onPress={onSubmit}
          />
        </View>
        {user.isAgent && clientNotesFromAPI && (
          <View style={[tw.mX4, tw.mT2]}>
            <BodyText style={[tw.textBlack]} sm bold>
              {dateFormat(clientNotesUpdateAtFromAPI * 1000, 'mm/dd/yyyy')}
            </BodyText>
            <BodyText semibold medium style={[tw.mY1]}>
              {clientNotesFromAPI}
            </BodyText>
            <BodyText style={[tw.textBlack]} sm bold>
              {clientName}
            </BodyText>
          </View>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
};

export default HomeDetailsNotes;
