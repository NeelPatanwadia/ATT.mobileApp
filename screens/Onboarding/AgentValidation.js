import React, { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';
import { View, Image, ActivityIndicator, AppState } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { colors, tw } from 'react-native-tailwindcss';
import { LogoWithText } from '../../assets/images';
import { PrimaryButton, BodyText } from '../../components';
import AgentValidationMessage from './AgentValidationMessage';
import { userService } from '../../services';
import { logEvent, APP_REGIONS, EVENT_TYPES } from '../../helpers/logHelper';

const AgentValidation = ({ navigation, screenProps: { user, signOut } }) => {
  const [agent, setAgent] = useState();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, []);

  useEffect(() => {
    getAgentInfo();
  }, []);

  useEffect(() => {
    const refreshSessionAndContinue = async () => {
      await Auth.currentAuthenticatedUser({ bypassCache: true });

      navigation.navigate('AgentSubscription');
    };

    if (agent && agent.validated && !agent.lockedOut) {
      refreshSessionAndContinue();
    }
  }, [agent]);

  const getAgentInfo = async () => {
    try {
      const agentInfo = await userService.queries.getUser(user.id);

      setAgent(agentInfo);
    } catch (error) {
      setErrorMessage('There has been an error. Please try again later.');
      logEvent({
        message: `Error fetching agent with id ${user.id}: ${error}`,
        appRegion: APP_REGIONS.AGENT_UI,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const handleAppStateChange = newState => {
    if (newState === 'active') {
      getAgentInfo();
    }
  };

  const renderLoading = () => (
    <>
      <BodyText style={[tw.textLg, tw.textCenter, tw.mB8]}>Loading Agent Status</BodyText>
      {errorMessage ? (
        <View style={[tw.justifyCenter, tw.itemsCenter]}>
          <BodyText style={[tw.textRed500, tw.textcenter]}>{errorMessage}</BodyText>
          <PrimaryButton style={[tw.mT4]} title="Sign Out" onPress={signOut} />
        </View>
      ) : (
        <ActivityIndicator size="large" color={colors.gray500} />
      )}
    </>
  );

  return (
    <SafeAreaView style={[tw.flexCol, tw.flex1, tw.pX8, tw.bgPrimary]}>
      <View style={[tw.flex1, tw.flexCol, tw.justifyEnd, tw.alignCenter, tw.wFull]}>
        <Image source={LogoWithText} style={[tw.h48, tw.wFull]} resizeMode="contain" />
      </View>
      <View style={(tw.flexCol, tw.flex1)}>
        {agent ? (
          <>
            <AgentValidationMessage validated={agent.validated} lockedOut={agent.lockedOut} />
            <PrimaryButton style={[tw.mB4]} title="Sign Out" onPress={signOut} />
          </>
        ) : (
          renderLoading()
        )}
      </View>
    </SafeAreaView>
  );
};

export default AgentValidation;
