import React from 'react';
import { Platform, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { color } from 'react-native-tailwindcss';

const PickerSelect = ({ selectedValue, setSelectedValue, dropdownItems, placeHolder, viewContainer }) => (
  <RNPickerSelect
    useNativeAndroidPickerStyle
    value={selectedValue}
    placeholder={placeHolder || {}} // default {label:'Select Item...,value: null}
    style={{
      inputAndroidContainer: {
        backgroundColor: color.white,
        padding: 5,
        borderRadius: 5,
      },
      inputAndroid: {
        flex: 1,
        fontSize: 18,
        padding: 5,
      },
      iconContainer: {
        top: Platform.OS === 'android' ? 25 : 15,
        right: 15,
      },
      inputIOS: {
        flex: 1,
        fontSize: 18,
        padding: 5,
      },
      inputIOSContainer: {
        backgroundColor: color.white,
        padding: 5,
        borderRadius: 5,
      },
      viewContainer: {
        marginVertical: 10,
        backgroundColor: 'white',
        borderRadius: 5,
        ...viewContainer,
      },
    }}
    Icon={() => (
      <View
        style={{
          backgroundColor: 'transparent',
          borderTopWidth: 10,
          borderTopColor: 'gray',
          borderRightWidth: 10,
          borderRightColor: 'transparent',
          borderLeftWidth: 10,
          borderLeftColor: 'transparent',
          width: 0,
          height: 0,
        }}
      />
    )}
    onValueChange={value => setSelectedValue(value)}
    items={dropdownItems}
  />
);

export default PickerSelect;
