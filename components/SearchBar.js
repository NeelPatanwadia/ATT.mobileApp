import React, { useState, useEffect } from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { color, colors, tw } from 'react-native-tailwindcss';
import { SearchIcon } from '../assets/images';

const SearchBar = ({ searchTerm, executeSearch, searchText, searching, margins, searchFoused }) => {
  const [text, setText] = useState(searchTerm);

  useEffect(() => {
    setText(searchTerm);
  }, [searchTerm]);

  return (
    <View style={[tw.selfCenter, margins || [tw.mY6, tw.pX8], tw.wFull]}>
      <View style={[tw.wFull, tw.h10, tw.borderB, tw.borderBlue500]}>
        <View style={[tw.flexRow, tw.itemsCenter]}>
          <SearchIcon width={20} height={20} fill={color.white} style={[tw.mL2]} />
          <TextInput
            style={[
              tw.p2,
              tw.selfCenter,
              tw.rounded,
              tw.fontLato,
              tw.textLg,
              tw.textGray800,
              tw.pL10,
              tw._mL8,
              tw.flex1,
            ]}
            keyboardAppearance="light"
            autoCorrect={false}
            autoCapitalize="none"
            value={text}
            onChangeText={setText}
            selectionColor={color.teal500}
            placeholder={searchText || ''}
            onBlur={() => executeSearch(text)}
            returnKeyType="search"
            onFocus={() => searchFoused && searchFoused()}
            blurOnSubmit
          />
          {searching ? <ActivityIndicator size="small" color={colors.gray500} /> : null}
        </View>
      </View>
    </View>
  );
};

export default SearchBar;
