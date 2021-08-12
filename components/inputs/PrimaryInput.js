import React, { forwardRef } from 'react';
import { color, tw } from 'react-native-tailwindcss';
import { Text, TextInput, View, TouchableOpacity } from 'react-native';
import { EyeIcon, EyeSlashIcon } from '../../assets/images';

const PrimaryInput = forwardRef(
  (
    {
      secureTextEntry,
      secureText,
      setSecureText,
      leftIcon,
      errorMessage,
      editable,
      multiline,
      maxLength,
      inputStyle = [],
      ...rest
    },
    ref
  ) => {
    const toggleSecureButton = (
      <TouchableOpacity
        style={[tw.absolute, tw.right0, tw.mR6, tw.selfCenter]}
        onPress={() => setSecureText(!secureText)}
      >
        {secureText && <EyeIcon width={24} height={24} fill={color.blue500} />}
        {!secureText && <EyeSlashIcon width={24} height={24} fill={color.blue500} />}
      </TouchableOpacity>
    );

    return (
      <View style={[tw.flexRow, tw.itemsCenter]}>
        {leftIcon}
        <View style={[tw.flexCol, tw.wFull]}>
          <TextInput
            ref={ref}
            style={[
              tw.p2,
              tw.wFull,
              tw.selfCenter,
              tw.rounded,
              tw.fontLato,
              tw.textXl,
              editable !== false ? tw.textGray700 : tw.textGray600,
              tw.borderB,
              errorMessage ? tw.borderRed500 : tw.borderGray700,
              leftIcon && tw.pL10,
              leftIcon && tw._mL6,
              ...inputStyle,
            ]}
            selectionColor={color.blue500}
            keyboardAppearance="light"
            secureTextEntry={setSecureText ? secureText : secureTextEntry}
            autoCapitalize="none"
            multiline={multiline === true}
            maxLength={maxLength || 255}
            editable={editable !== null && editable !== undefined ? editable : true}
            {...rest}
          />
          {errorMessage ? <Text style={[tw.textXs, tw.textRed500, tw.mL2, tw.mT2]}>{errorMessage}</Text> : null}
        </View>
        {setSecureText && toggleSecureButton}
      </View>
    );
  }
);

export default PrimaryInput;
