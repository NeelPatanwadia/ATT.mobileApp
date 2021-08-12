import React from 'react';
import { View } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { BodyText, AgentCard, PrimaryButton } from '../../components';
import { CloseIcon } from '../../assets/images';
import { userService } from '../../services';

const BuyerSellerConfirm = ({ navigation, screenProps: { user } }) => {
  const saveNavigate = async () => {
    try {
      const updatedUser = { id: user.id, agentId: user.agentId };

      await userService.mutations.updateUser(updatedUser);

      navigation.navigate('BuyerSeller');
    } catch (error) {
      console.warn('Error saving user info: ', error);
    }
  };

  return (
    <KeyboardAwareScrollView style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
      <View style={[tw.w3_4, tw.pT16]}>
        <BodyText center style={[tw.mY8]}>
          Connect With Your Agent
        </BodyText>
      </View>
      <View style={[tw.mB4]}>
        <AgentCard
          onPress={() => navigation.navigate('BuyerSellerConnect')}
          agent={user.agent}
          icon={<CloseIcon width={25} height={25} fill={color.blue400} stroke={color.white} />}
        />
      </View>
      <View style={[tw.w3_4, tw.selfCenter, tw.pB16]}>
        <PrimaryButton title="NEXT" onPress={saveNavigate} />
      </View>
    </KeyboardAwareScrollView>
  );
};

export default BuyerSellerConfirm;
