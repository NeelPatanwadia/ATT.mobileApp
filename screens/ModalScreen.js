import React, { useEffect } from 'react';
import { View, SafeAreaView } from 'react-native';
import { tw } from 'react-native-tailwindcss';

const ModalScreen = ({ navigation }) => {
  const content = navigation.getParam('content', <View />);
  const style = navigation.getParam('style', []) || [];

  useEffect(() => {
    const title = navigation.getParam('title', '');

    navigation.setParams('headerTitle', title || '');
  }, []);

  return (
    <SafeAreaView style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
      <View style={[tw.pX8, ...style]}>{content}</View>
    </SafeAreaView>
  );
};

export default ModalScreen;
