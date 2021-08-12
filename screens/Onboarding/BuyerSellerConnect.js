/* eslint-disable array-callback-return */
import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, View, SafeAreaView, Alert, AppState } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { NavigationEvents, withNavigationFocus } from 'react-navigation';
import { API, graphqlOperation } from 'aws-amplify';
import { BodyText, AgentCard, PrimaryInput, FlexLoader, PrimaryButton } from '../../components';
import { notificationService, userService } from '../../services';
import { SearchIcon } from '../../assets/images';
import BuyerSellerTabContext from '../../navigation/BuyerSellerTabContext';
import { APP_REGIONS, EVENT_TYPES, logEvent } from '../../helpers';
import { onUpdateUser } from '../../src/graphql/subscriptions';
import { buildClientRequestToAgent } from '../../notifications/messageBuilder';

const BuyerSellerConnect = ({ navigation, isFocused, screenProps: { user, setUser } }) => {
  const [agents, setAgents] = useState([]);
  const [agentSearchStr, setAgentSearchStr] = useState('');
  const { setNavigationParams } = useContext(BuyerSellerTabContext);
  const [agentDetail, setAgentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionRetryCount, setSubscriptionRetryCount] = useState(0);
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    updateUser();
    initSubscription();
    searchAgents();

    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }

      AppState.removeEventListener('change', handleAppStateChange);
    };
  }, [isFocused]);

  useEffect(() => {
    searchAgents();
  }, [agentSearchStr]);

  useEffect(() => {
    if (user.agentId) {
      setNavigationParams({
        headerTitle: user.agentId ? 'Agent Details' : 'Agent Select',
        showSettingsBtn: true,
        showBackBtn: true,
      });
      getAgentDetails();
    }

    if (!user.requestedAgentId) {
      setSelectedAgentId(null);
    } else {
      setSelectedAgentId(user.requestedAgentId);
    }
  }, [user]);

  const initSubscription = async () => {
    try {
      const userSubscription = await API.graphql(graphqlOperation(onUpdateUser, { id: user.id })).subscribe({
        error: err => {
          console.error('UPDATE USER SUBSCRIPTION ERROR: ', err);

          // Subscription sometimes disconnects if idle for too long
          handleSubscriptionRetry();

          const errMessage = err && err.error ? JSON.stringify(err.error) : 'Unknown';

          logEvent({
            message: `UPDATE USER SUBSCRIPTION ERROR: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        },
        next: () => {
          updateUser();
        },
      });

      setSubscription(userSubscription);
    } catch (error) {
      console.log('Error on update user subscription: ', error);
    }
  };

  const handleAppStateChange = async newState => {
    if (newState === 'active') {
      if (subscription) {
        try {
          await subscription.unsubscribe();
        } catch (err) {
          const errMessage = err && err.error ? JSON.stringify(err.error) : 'Unknown';

          logEvent({
            message: `UPDATE USER SUBSCRIPTION ERROR ON APP STATE CHANGE: ${errMessage}`,
            eventType: EVENT_TYPES.WARNING,
            appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
          });
        }
        await initSubscription();
        setSubscriptionRetryCount(0);
      }

      updateUser();
    }
  };

  const handleSubscriptionRetry = () => {
    if (subscriptionRetryCount < 5) {
      const count = subscriptionRetryCount + 1;

      logEvent({
        message: `UPDATE USER SUBSCRIPTION RETRY ${count}`,
        eventType: EVENT_TYPES.WARNING,
        appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
      });

      setTimeout(() => {
        setSubscriptionRetryCount(count);
        initSubscription();
      }, count * 5000);
    } else {
      logEvent({
        message: `UPDATE USER SUBSCRIPTION MAX RETRY ATTEMPTS: ${subscriptionRetryCount}`,
        eventType: EVENT_TYPES.ERROR,
        appRegion: APP_REGIONS.GQL_SUBSCRIPTION,
      });
    }
  };

  const updateUser = async () => {
    const updatedUser = await userService.queries.getUser(user.id);

    searchAgents();
    setUser(updatedUser);
  };

  const getAgentDetails = async () => {
    setLoading(true);
    const agent = await userService.queries.getUser(user.agentId);

    setLoading(false);
    setAgentDetails(agent);
  };

  const cleanString = searchString => searchString && searchString.replace(/[()-. ]+/g, '');

  const searchAgents = async () => {
    try {
      let searchedAgents = await userService.queries.listAgents(agentSearchStr);

      searchedAgents.map(agent => {
        if (user.requestedAgentId === agent.id) {
          setSelectedAgentId(agent.id);
        }
      });

      if (user.requestedAgentId && selectedAgentId === null) {
        const selectedAgent = await userService.queries.getUser(user.requestedAgentId);

        searchedAgents = [].concat(selectedAgent, searchedAgents);
        setSelectedAgentId(selectedAgent.id);
      }
      setAgents(searchedAgents);
    } catch (error) {
      console.warn('Error searching agents: ', error);
    }
  };

  const sendNotification = async agent => {
    try {
      const { push, email } = buildClientRequestToAgent({
        baName: `${agent.firstName} ${agent.lastName}`,
        clientName: `${user.firstName} ${user.lastName}`,
      });

      await notificationService.mutations.createNotification({
        userId: agent.id,
        pushMessage: push,
        smsMessage: push,
        email,
        routeName: 'AgentClients',
        routeParams: {},
        routeKey: `${new Date().getTime()}_${agent.id}`,
      });
    } catch (error) {
      console.log('Error sending notification to agent', error);
    }
  };

  const setAgent = async agent => {
    if (selectedAgentId) {
      Alert.alert('', 'You can send request to only one agent at a time.', [
        {
          text: 'Ok',
          onPress: () => {},
        },
      ]);

      return;
    }
    try {
      setDisabled(true);
      const updateUserInput = {
        id: user.id,
        requested_agent_id: agent.id,
        agentRequestSeen: false,
      };

      const updatedUser = await userService.mutations.updateUser(updateUserInput);

      setUser(updatedUser);
      sendNotification(agent);
      setDisabled(false);
    } catch (error) {
      setDisabled(false);
      console.log('Error adding agent request', error);
    }
  };

  const onConfirmAgentRemove = async () => {
    try {
      setDisabled(true);
      const updateUserInput = {
        id: user.id,
        requested_agent_id: null,
        agentRequestSeen: false,
      };

      const updatedUser = await userService.mutations.updateUser(updateUserInput);

      setUser(updatedUser);
      setDisabled(false);
    } catch (error) {
      setDisabled(false);
      console.log('Error removing agent request', error);
    }
  };

  const onDeletePress = () => {
    Alert.alert('Remove Request', 'Are you sure you want to remove request from this agent?', [
      {
        text: 'Ok',
        onPress: () => onConfirmAgentRemove(),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const agentCards = agents
    .filter(agent => {
      const regex = new RegExp(/[cleanString(agentSearchStr)]/, 'i');
      const { firstName, lastName, company, cellPhone, emailAddress, validated, isTestAccount } = agent;
      const agentFields = [firstName, lastName, company, emailAddress, cellPhone]
        .map(field => cleanString(field))
        .join('');

      if (!validated && user.requestedAgentId === agent.id) {
        return agentFields.match(regex);
      }
      if (validated && !isTestAccount) {
        return agentFields.match(regex);
      }
    })
    .map((agent, idx) => (
      <AgentCard
        key={`agent-${idx}`}
        onPress={() => setAgent(agent)}
        agent={agent}
        isSelected={selectedAgentId === agent.id}
        onDeletePress={() => onDeletePress()}
        disabled={disabled}
      />
    ));

  return (
    <SafeAreaView>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: user.agentId ? 'Agent Details' : 'Agent Select',
            showSettingsBtn: true,
            showBackBtn: true,
          })
        }
      />
      {user.agentId ? (
        <View style={[tw.wFull, tw.hFull]}>
          {loading || agentDetail === null ? (
            <FlexLoader />
          ) : (
            <ScrollView style={[tw.pX2, tw.pT4, tw.selfCenter, tw.wFull]}>
              <View
                style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.p6]}
              >
                <BodyText style={[tw.mR2]} lg>
                  Name:
                </BodyText>
                <View style={[tw.flexRow, tw.itemsCenter, tw.justifyEnd]}>
                  <BodyText lg>
                    {agentDetail.firstName} {agentDetail.lastName}
                  </BodyText>
                </View>
              </View>
              <View
                style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.p6]}
              >
                <BodyText style={[tw.mR2]} lg>
                  Email:
                </BodyText>
                <View style={[tw.flexRow, tw.itemsCenter, tw.justifyEnd]}>
                  <BodyText lg>{agentDetail.emailAddress}</BodyText>
                </View>
              </View>
              <View
                style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.p6]}
              >
                <BodyText style={[tw.mR2]} lg>
                  Phone:
                </BodyText>
                <View style={[tw.flexRow, tw.itemsCenter, tw.justifyEnd]}>
                  <BodyText lg>{agentDetail.cellPhone}</BodyText>
                </View>
              </View>
              <View
                style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.p6]}
              >
                <BodyText style={[tw.mR2]} lg>
                  Brokerage:
                </BodyText>
                <View style={[tw.flexRow, tw.itemsCenter, tw.justifyEnd]}>
                  <BodyText lg>{agentDetail.brokerage}</BodyText>
                </View>
              </View>
              <View
                style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.p6]}
              >
                <BodyText style={[tw.mR2]} lg>
                  Realtor Number:
                </BodyText>
                <View style={[tw.flexRow, tw.itemsCenter, tw.justifyEnd]}>
                  <BodyText lg>{agentDetail.realtorNumber}</BodyText>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      ) : (
        <>
          <KeyboardAwareScrollView style={[tw.wFull, tw.hFull, tw.bgPrimary]}>
            <SafeAreaView style={[tw.w3_4, tw.selfCenter]}>
              <BodyText style={[tw.mY5]}>Connect With Your Agent</BodyText>
              <PrimaryInput
                onChangeText={setAgentSearchStr}
                value={agentSearchStr}
                leftIcon={<SearchIcon style={[tw._mR2]} width={20} height={20} fill={color.white} />}
              />
              <BodyText bold style={[tw.textSm, tw.mT3]}>
                Search by Agent Name, Email, Phone, or Brokerage
              </BodyText>
              <BodyText bold style={[tw.mT3, tw.textCenter]}>
                OR
              </BodyText>
              <PrimaryButton
                style={[tw.alignCenter]}
                onPress={() => navigation.navigate('InviteAgent', { inviteAgent: true })}
                title="INVITE AN AGENT"
              />
            </SafeAreaView>
            {agentSearchStr.length ? <View style={[tw.wFull, tw.mY8]}>{agentCards}</View> : null}
          </KeyboardAwareScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

export default withNavigationFocus(BuyerSellerConnect);
