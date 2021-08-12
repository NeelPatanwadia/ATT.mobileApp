import React, { forwardRef } from 'react';
import { tw } from 'react-native-tailwindcss';
import { TextInput, View, Text } from 'react-native';

const PhoneInput = forwardRef(({ onChangeText, leftIcon, editable, errorMessage, ...rest }, ref) => {
  const formatChangeText = text => {
    let cleaned = text.replace(/\D/g, '').slice(0, 10);

    if (cleaned.length === 10) {
      cleaned = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    onChangeText(cleaned);
  };

  return (
    <View style={[tw.flexRow, tw.itemsCenter]}>
      {leftIcon}
      <View style={[tw.flexCol, tw.wFull]}>
        <TextInput
          style={[
            tw.p2,
            tw.wFull,
            tw.selfCenter,
            tw.rounded,
            tw.textXl,
            tw.borderB,
            editable !== false ? tw.textGray700 : tw.textGray600,
            errorMessage ? tw.borderRed500 : tw.borderGray700,
            leftIcon && tw.pL10,
            leftIcon && tw._mL6,
          ]}
          textContentType="telephoneNumber"
          keyboardType="number-pad"
          returnKeyType="done"
          autoCompleteType="tel"
          placeholder="Agent Cell Phone"
          keyboardAppearance="light"
          autoCapitalize="none"
          onChangeText={formatChangeText}
          editable={editable}
          ref={ref}
          {...rest}
        />
        {errorMessage ? <Text style={[tw.textXs, tw.textRed500, tw.mL2, tw.mT2]}>{errorMessage}</Text> : null}
      </View>
    </View>
  );
});

export default PhoneInput;
