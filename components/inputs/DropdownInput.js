import React, { useRef, useState } from 'react';
import { Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { tw, color } from 'react-native-tailwindcss';
import { Dropdown } from 'react-native-material-dropdown-v2';
import { BodyText } from '../textComponents';
import { ChevronDownIcon } from '../../assets/images';

const windowWidth = Dimensions.get('window').width;

const DropdownInput = ({
  value,
  displayValue,
  label,
  errorMessage,
  options,
  required,
  readonly,
  onSelect,
  beforeOpen,
  containerStyle,
  lg,
}) => {
  const dropdown = useRef(null);
  const [dropdownWidth, setDropdownWidth] = useState(windowWidth);

  const toggleDropdown = async () => {
    if (readonly) {
      return;
    }

    if (dropdown.current.isFocused()) {
      dropdown.current.blur();
    } else {
      if (beforeOpen) {
        await beforeOpen();
      }

      dropdown.current.focus();
    }
  };

  let requiredLabel = null;

  if (required) {
    requiredLabel = <Text style={[tw.textRed600]}> *</Text>;
  }

  const labelComponent = (
    <Text style={[errorMessage ? tw.textRed600 : tw.textWhite, tw.textBase, tw.fontBold, tw.pB1]}>
      {label}
      {requiredLabel}
    </Text>
  );

  const onLayout = ({
    nativeEvent: {
      layout: { width },
    },
  }) => {
    setDropdownWidth(width);
  };

  const borderColor = errorMessage ? tw.borderRed500 : tw.borderGray700;

  return (
    <View style={[tw.flexCol, tw.wFull, { zIndex: 1, elevation: 0 }, tw.relative]} onLayout={onLayout}>
      {label ? labelComponent : null}
      <TouchableOpacity
        errorStyle={[tw.textRed600]}
        onPress={() => toggleDropdown()}
        style={[
          tw.mB4,
          tw.pX2,
          tw.pY2,
          tw.flexRow,
          tw.itemsCenter,
          tw.justifyBetween,
          tw.borderB,
          borderColor,
          tw.textWhite,
          tw.textBase,
          tw.wFull,
          containerStyle,
        ]}
      >
        <BodyText style={[lg ? tw.textLg : tw.textMd, tw.text]}>{displayValue || value || 'Select an Option'}</BodyText>
        <ChevronDownIcon height={16} width={16} fill={color.gray700} style={[tw.mR1]} />
      </TouchableOpacity>
      {errorMessage ? <Text style={[tw.textXs, tw.textRed500, tw.mL2]}>{errorMessage}</Text> : null}
      <Dropdown
        ref={dropdown}
        fontSize={16}
        data={options}
        baseColor="transparent"
        dropdownOffset={{ top: 2, left: 20, right: 0 }}
        dropdownPosition={0}
        dropdownMargins={{ max: 20, min: 20 }}
        pickerStyle={[{ width: dropdownWidth }]}
        containerStyle={{ width: 0, height: 0 }}
        selectedItemColor={color.blue500}
        value={value}
        onChangeText={args => onSelect(args)}
      />
    </View>
  );
};

export default DropdownInput;
