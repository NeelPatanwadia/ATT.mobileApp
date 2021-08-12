import React, { useState } from 'react';
import { Animated, View, TouchableOpacity, Platform } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { FullScreenIcon, HamburgerIcon, SplitScreenIcon } from '../assets/images';
import { BodyText } from './textComponents';

const pageViews = ['list', 'split', 'map'];

const PanelScreen = ({ children, map, updateRegion = false }) => {
  const initialHeight = new Animated.Value(1);
  const [mapHeight] = useState(initialHeight);
  const [pageViewIdx, setPageViewIdx] = useState(1);
  const pageView = pageViews[pageViewIdx];

  const nextPageView = () => {
    const newPageViewIdx = pageViewIdx === pageViews.length - 1 ? 0 : pageViewIdx + 1;

    Animated.timing(mapHeight, {
      toValue: newPageViewIdx,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (pageView === 'list') updateRegion();
    });

    setPageViewIdx(newPageViewIdx);
  };

  const fullScreenMapBtn = () => {
    if (Platform.OS === 'android') {
      return null;
    }

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          nextPageView();
        }}
        style={[
          tw.w8,
          tw.h8,
          tw.roundedFull,
          tw.bgBlue500,
          tw.justifyCenter,
          tw.itemsCenter,
          tw._mT20,
          tw.mL3,
          tw.absolute,
          tw.top0,
          tw.left0,
          tw.z100,
          tw.shadow,
        ]}
      >
        {pageView === 'split' && <FullScreenIcon width={30} height={30} fill={color.white} />}
        {pageView === 'map' && <HamburgerIcon width={20} height={20} fill={color.white} />}
      </TouchableOpacity>
    );
  };

  const viewMapButton = (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        nextPageView();
      }}
      style={[
        tw.w24,
        tw.h8,
        tw.flexRow,
        tw.itemsCenter,
        tw.bgWhite,
        tw.border2,
        tw.borderBlue500,
        tw.rounded,
        tw._mT16,
        tw.mL10,
        tw.top0,
        tw.left0,
      ]}
    >
      <View style={[tw.mX1, tw.w4, tw.h4, tw.roundedFull, tw.bgBlue500, tw.justifyCenter, tw.itemsCenter, tw.z100]}>
        {pageView === 'list' && <SplitScreenIcon width={20} height={20} fill={color.white} />}
      </View>
      <BodyText xs bold style={[tw.textBlue500]}>
        VIEW MAP
      </BodyText>
    </TouchableOpacity>
  );

  return (
    <View style={[tw.wFull, tw.hFull, tw.bgWhite]}>
      <View style={[pageView !== 'list' ? tw._mT16 : tw.mT0, tw.top0, tw.wFull, tw.hFull, tw.z0]}>{map}</View>
      <Animated.View
        style={[
          tw.wFull,
          tw.bgWhite,
          tw.borderT,
          tw.borderGray300,
          tw.shadow,
          tw.absolute,
          tw.bottom0,
          { height: mapHeight.interpolate({ inputRange: [0, 1, 2], outputRange: ['100%', '50%', '0%'] }) },
        ]}
      >
        {children}
      </Animated.View>
      {pageView === 'split' || pageView === 'map' ? (
        <View style={[tw.absolute, tw.top0]}>{fullScreenMapBtn()}</View>
      ) : (
        <View style={[tw.absolute, tw.top0, tw.h20]}>{viewMapButton}</View>
      )}
    </View>
  );
};

export default PanelScreen;
