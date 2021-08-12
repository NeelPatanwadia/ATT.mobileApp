import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  TextInput,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Modal from 'react-native-modal';
import { tw } from 'react-native-tailwindcss';
import { snakeCase } from 'change-case';
import { ChevronLeftIcon } from '../assets/images';
import PickerSelect from './PickerSelect';
import { BodyText } from './textComponents';
import { PrimaryButton } from './buttons';

const SELECTROOMS = [
  { label: 'Any', value: 'Any' },
  { label: '1+', value: '1' },
  { label: '2+', value: '2' },
  { label: '3+', value: '3' },
  { label: '4+', value: '4' },
  { label: '5+', value: '5' },
];
const SORT_BY = [
  { label: 'Price (low to high)', value: 'price_ascending' },
  { label: 'Price (high to low)', value: 'price_descending' },
  { label: 'Square feet (low to high)', value: 'squarefeet_ascending' },
  { label: 'Square feet (high to low)', value: 'squarefeet_descending' },
];
const FilterModal = ({
  showFilter,
  hideFilter,
  searchList,
  isFilterApplied,
  onResetButtonPress,
  onApplyFilter,
  setFilterBy,
}) => {
  const [isVisible, setIsVisible] = useState(showFilter);
  const [selectedSortValue, setSelectedSortValue] = useState('price_ascending');
  const [priceRange, setPriceRange] = useState({ low: '', high: '' });
  const [squareFeet, setSquareFeet] = useState({ low: '', high: '' });
  const [bedrooms, setBedrooms] = useState('Any');
  const [bathrooms, setBathrooms] = useState('Any');
  const [homeTypes, setHomeTypes] = useState([]);
  const [refreshScreen, setRefreshScreen] = useState(false);

  useEffect(() => {
    setIsVisible(showFilter);
  }, [showFilter]);

  useEffect(() => {
    if (searchList.length > 0) {
      searchList.map(item => {
        if (item.home_type) {
          setHomeTypes(prevList => {
            const isAlreadyPresent = prevList.findIndex(data => data.value === item.home_type);

            if (isAlreadyPresent === -1) {
              return [
                ...new Set([...prevList, { key: snakeCase(item.home_type), value: item.home_type, selected: false }]),
              ];
            }

            return prevList;
          });
        }

        return null;
      });
    } else {
      setHomeTypes([]);
    }
  }, [searchList.length]);

  const initializePropertyTypes = () => {
    setHomeTypes(prevList => prevList.map(data => ({ ...data, selected: false })));
  };

  const onHomeTypePress = homeType => {
    const tempArr = homeTypes;

    for (let i = 0; i < tempArr.length; i++) {
      if (homeType.key === tempArr[i].key) {
        tempArr[i].selected = !homeType.selected;
      }
    }
    setRefreshScreen(!refreshScreen);
    setHomeTypes(tempArr);
  };

  const onResetPress = () => {
    initializePropertyTypes();
    setPriceRange({ low: '', high: '' });
    setSquareFeet({ low: '', high: '' });
    setSelectedSortValue('price_ascending');
    setBedrooms('Any');
    setBathrooms('Any');
    onResetButtonPress();
  };

  const onModalWillShow = () => {
    if (!isFilterApplied) {
      onResetPress();
    }
  };

  const onModalHide = () => {
    hideFilter();
    const filterValue = {};

    if (isFilterApplied) {
      if (priceRange.low || priceRange.high) {
        filterValue.priceRange = priceRange;
      }

      if (squareFeet.low || squareFeet.high) {
        filterValue.squareFeet = squareFeet;
      }
      if (bedrooms) {
        filterValue.bedrooms = bedrooms;
      }
      if (bathrooms) {
        filterValue.bathrooms = bathrooms;
      }
    }
    filterValue.sort = selectedSortValue;
    const homeTypeList = homeTypes.map(value => value.selected && value.value).filter(value => value !== false);

    filterValue.homeTypes = homeTypeList;
    setFilterBy(filterValue);
  };

  const onApplyPress = () => {
    onApplyFilter();
    hideFilter();
  };

  const bodyTitle = title => <BodyText xl>{`${title}:`}</BodyText>;

  return (
    <Modal
      style={[tw.m0]}
      onModalHide={() => onModalHide()}
      onBackButtonPress={() => setIsVisible(false)}
      onBackdropPress={() => setIsVisible(false)}
      isVisible={isVisible}
      onModalWillShow={() => onModalWillShow()}
    >
      <KeyboardAvoidingView
        enabled={Platform.OS === 'ios'}
        behavior="padding"
        style={[tw.wFull, tw.hFull, tw.bgPrimary]}
      >
        <SafeAreaView style={[tw.hFull, tw.wFull, tw.bgWhite]}>
          <View style={[tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.pX4, tw.pY2, tw.bgPrimary]}>
            <TouchableOpacity onPress={() => hideFilter()}>
              <ChevronLeftIcon height={20} width={20} />
            </TouchableOpacity>
            <BodyText semibold xl2>
              Filters
            </BodyText>
            <TouchableOpacity onPress={() => onResetPress()}>
              <BodyText bold style={[tw.textBlue500]}>
                Reset
              </BodyText>
            </TouchableOpacity>
          </View>
          <ScrollView style={[tw.flex1, tw.pX2, tw.borderT, tw.borderGray600, tw.bgBlue100, tw.bgGray400]}>
            <View style={[tw.mT4]}>
              {bodyTitle('SORT BY')}
              <PickerSelect
                key="sort-by"
                setSelectedValue={value => setSelectedSortValue(value)}
                selectedValue={selectedSortValue}
                dropdownItems={SORT_BY}
              />
            </View>
            <View>
              {bodyTitle('PRICE RANGE')}
              <BodyText style={[tw.mT2]}>Lowest Price</BodyText>
              <View
                style={[
                  tw.p2,
                  tw.mY2,
                  tw.flexRow,
                  tw.flex1,
                  tw.bgWhite,
                  tw.itemsCenter,
                  tw.rounded,
                  { ...(Platform.OS === 'android' && tw.pY0) },
                ]}
              >
                <Text style={{ fontSize: 18, marginRight: 3 }}>$</Text>
                <TextInput
                  style={[tw.bgWhite, tw.flex1, { fontSize: 18, borderRadius: 5 }]}
                  keyboardAppearance="light"
                  autoCorrect={false}
                  keyboardType="numeric"
                  autoCapitalize="none"
                  placeholder="0"
                  value={priceRange.low}
                  onChangeText={text => setPriceRange({ ...priceRange, low: text })}
                />
              </View>
              <BodyText style={[tw.mT2]}>Highest Price</BodyText>
              <View
                style={[
                  tw.p2,
                  tw.mY2,
                  tw.flexRow,
                  tw.flex1,
                  tw.bgWhite,
                  tw.itemsCenter,
                  tw.rounded,
                  { ...(Platform.OS === 'android' && tw.pY0) },
                ]}
              >
                <Text style={{ fontSize: 18, marginRight: 3 }}>$</Text>
                <TextInput
                  style={[tw.bgWhite, tw.flex1, { fontSize: 18, borderRadius: 5 }]}
                  keyboardAppearance="light"
                  autoCorrect={false}
                  keyboardType="numeric"
                  autoCapitalize="none"
                  placeholder="0"
                  value={priceRange.high}
                  onChangeText={text => setPriceRange({ ...priceRange, high: text })}
                />
              </View>
            </View>
            <View>
              {bodyTitle('SQUARE FEET')}
              <BodyText style={[tw.mT2]}>SQFT from</BodyText>
              <TextInput
                style={[tw.p2, tw.mY2, tw.bgWhite, tw.flex1, { fontSize: 18, borderRadius: 5 }]}
                keyboardAppearance="light"
                autoCorrect={false}
                keyboardType="numeric"
                autoCapitalize="none"
                placeholder="0"
                value={squareFeet.low}
                onChangeText={text => setSquareFeet({ ...squareFeet, low: text })}
              />
              <BodyText style={[tw.mT2]}>SQFT to</BodyText>
              <TextInput
                style={[tw.p2, tw.mY2, tw.bgWhite, tw.flex1, { fontSize: 18, borderRadius: 5 }]}
                keyboardAppearance="light"
                autoCorrect={false}
                keyboardType="numeric"
                autoCapitalize="none"
                placeholder="0"
                value={squareFeet.high}
                onChangeText={text => setSquareFeet({ ...squareFeet, high: text })}
              />
            </View>
            <View>
              {bodyTitle('BEDROOMS')}
              <PickerSelect
                key="bedrooms"
                setSelectedValue={value => setBedrooms(value)}
                selectedValue={bedrooms}
                dropdownItems={SELECTROOMS}
              />
            </View>
            <View>
              {bodyTitle('BATHROOMS')}
              <PickerSelect
                key="bathroom"
                setSelectedValue={value => setBathrooms(value)}
                selectedValue={bathrooms}
                dropdownItems={SELECTROOMS}
              />
            </View>
            <View>
              {homeTypes.length > 0 && bodyTitle('HOME TYPES')}
              <View style={[tw.mT2]}>
                {homeTypes.map((type, index) => (
                  <TouchableOpacity
                    key={`home-type-${index}`}
                    style={[tw.p2, tw.mT1, tw.bgWhite, tw.flexRow, tw.wFull, tw.itemsCenter, { borderRadius: 5 }]}
                    onPress={() => onHomeTypePress(type)}
                  >
                    <View
                      style={[tw.w4, tw.h4, tw.roundedFull, tw.bgGray700, tw.itemsCenter, tw.justifyCenter, tw.mR2]}
                    >
                      {!type.selected && <View style={[tw.w3, tw.h3, tw.roundedFull, tw.bgWhite]} />}
                    </View>
                    <BodyText>{type.value}</BodyText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={[tw.h4]} />
          </ScrollView>
          <View style={[tw.pX4, tw.bgGray400]}>
            <PrimaryButton onPress={() => onApplyPress()} title="APPLY FILTER" />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default FilterModal;
