import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { NavigationEvents } from 'react-navigation';
import { PrimaryButton, BodyText, SearchBar, FlexLoader, Badge } from '../../components';
import { notificationService, userService } from '../../services';
import { ChevronRightIcon } from '../../assets/images';

import AgentTabContext from '../../navigation/AgentTabContext';
import ClientContext from './ClientContext';
import { buildAgentRespondsToClientRequest } from '../../notifications/messageBuilder';

const ClientRow = ({ client, onPress, onConnectPress, newMessages }) => {
  let showMessageBadge = false;

  if (newMessages && newMessages.length > 0) {
    const clientUnreadMessage = newMessages.find(x => x.clientId === client.id);

    if (clientUnreadMessage && clientUnreadMessage.clientId) {
      showMessageBadge = true;
    }
  }

  return (
    <TouchableOpacity onPress={onPress} style={[tw.shadow, tw.wFull, tw.h16, tw.bgGray100, tw.mY1, tw.pX6, tw.flexRow]}>
      <View style={[tw.wFull, tw.h16, tw.flexRow, tw.itemsCenter]}>
        {((client.requestedAgentId && !client.agentRequestSeen) || showMessageBadge) && <Badge noCountNeeded sm />}
        <View style={[tw.flex1, tw.mL4]}>
          <BodyText>{`${client.firstName} ${client.lastName}`}</BodyText>
        </View>
        {client.requestedAgentId ? (
          <TouchableOpacity onPress={onConnectPress} style={[tw.bgBlue500]}>
            <BodyText style={[tw.pX3, tw.pY2, tw.textWhite]} semibold sm>
              Connect with me
            </BodyText>
          </TouchableOpacity>
        ) : (
          <View style={[tw.w20]}>
            <BodyText>{client.cognitoSub ? 'approved' : 'pending'}</BodyText>
          </View>
        )}
        <View style={[tw.w12, tw.selfCenter]}>
          <ChevronRightIcon width={15} height={15} style={[tw.selfCenter]} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const AgentClients = ({
  navigation,
  screenProps: { user, setClientRequestCount, clientRequestCount, newMessages },
}) => {
  const { setNavigationParams } = useContext(AgentTabContext);
  const { setClient, clients, setClients } = useContext(ClientContext);
  const [filteredClients, setFilteredClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getClients();
  }, []);

  useEffect(() => {
    if (clients) {
      filterClients(clients);
    }
  }, [clients]);

  useEffect(() => {
    if (clients) {
      filterClients(clients);
    }
  }, [search]);

  useEffect(() => {
    if (clientRequestCount && clientRequestCount.length > 0) {
      getClients();
    }
  }, [clientRequestCount.length]);

  const getClients = async () => {
    checkClientRequestCount();
    try {
      const clientListIncludeRequested = await userService.queries.listClientsIncludeRequested(user.id);

      setClients(clientListIncludeRequested);
    } catch (error) {
      console.log('Error fetching clients: ', error);
    }

    setRefreshing(false);
    setLoading(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    getClients();
  };

  const selectClient = selectedClient => {
    setClient(selectedClient);

    if (selectedClient.requestedAgentId) {
      navigation.navigate('RequestedClientDetails');
    } else {
      navigation.navigate('ClientDetails');
    }
  };

  const executeSearch = text => {
    setSearching(true);
    setSearch(text);
  };

  const sendNotification = async (isDeclined, client) => {
    try {
      const { push, email } = buildAgentRespondsToClientRequest({
        baName: `${user.firstName} ${user.lastName}`,
        clientName: `${client.firstName} ${client.lastName}`,
        response: isDeclined ? `declined` : `approved`,
      });

      await notificationService.mutations.createNotification({
        userId: client.id,
        pushMessage: push,
        smsMessage: push,
        email,
      });
    } catch (error) {
      console.log('Error sending notification to client', error);
    }
  };

  const checkClientRequestCount = async () => {
    try {
      const { count } = await userService.queries.requestedClientNotSeenCount(user.id);

      setClientRequestCount(count);
    } catch (error) {
      console.log('Error getting client request count', error);
    }
  };

  const onConfirmClient = async client => {
    try {
      const updateUserInput = {
        id: client.id,
        requestedAgentId: null,
        agentId: user.id,
        agentRequestSeen: true,
      };

      await userService.mutations.updateUser(updateUserInput);
      getClients();
      sendNotification(false, client);
    } catch (error) {
      console.log('Error confirming client request', error);
    }
  };

  const onDeclineClient = async client => {
    try {
      const updateUserInput = {
        id: client.id,
        requestedAgentId: null,
        agentId: null,
        agentRequestSeen: true,
      };

      await userService.mutations.updateUser(updateUserInput);
      getClients();
      sendNotification(true, client);
    } catch (error) {
      console.log('Error declining client request', error);
    }
  };

  const setRequestSeen = async client => {
    try {
      const updateUserInput = {
        id: client.id,
        agentRequestSeen: true,
      };

      await userService.mutations.updateUser(updateUserInput);
      getClients();
    } catch (error) {
      console.log('Error updating client request', error);
    }
  };

  const onConnectPress = client => {
    Alert.alert('Be my agent', 'I wants to connect with you.', [
      {
        text: 'Accept',
        onPress: () => onConfirmClient(client),
      },
      {
        text: 'Decline',
        onPress: () => onDeclineClient(client),
      },
      {
        text: 'Cancel',
        onPress: () => setRequestSeen(client),
      },
    ]);
  };

  const filterClients = clientList => {
    try {
      const filteredClientList = clientList.filter(client => {
        const regex = new RegExp(search, 'i');
        const { firstName, lastName, cognitoSub } = client;
        const status = cognitoSub ? 'approved' : 'pending';
        const clientFields = [firstName, lastName, status].join('');

        return clientFields.match(regex);
      });

      setFilteredClients(filteredClientList);
    } catch (error) {
      console.log('Error filtering clients: ', error);
    }

    setSearching(false);
  };

  return (
    <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol]}>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Clients',
            showBackBtn: false,
            showSettingsBtn: true,
          })
        }
      />
      <View style={[tw.mY4, tw.pX8]}>
        <View style={[tw.flexRow, tw.justifyBetween, tw.wFull]}>
          <BodyText lg style={[tw.textGray700]}>
            Search Clients
          </BodyText>
        </View>
        <SearchBar executeSearch={executeSearch} searchTerm={search} margins={[tw.mT2]} searching={searching} />
      </View>

      {loading ? (
        <FlexLoader />
      ) : (
        <FlatList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          data={filteredClients}
          renderItem={({ item: client }) => (
            <ClientRow
              newMessages={newMessages}
              client={client}
              onPress={() => selectClient(client)}
              onConnectPress={() => onConnectPress(client)}
            />
          )}
          keyExtractor={clientCard => `clientCard-${clientCard.id}`}
          ListEmptyComponent={
            <View style={[tw.flexCol, tw.mT16, tw.itemsCenter, tw.justifyCenter]}>
              <BodyText>No Clients Found</BodyText>
            </View>
          }
        />
      )}
      <View style={[tw.h24, tw.justifyCenter, tw.borderT, tw.borderGray300, tw.pX8]}>
        <PrimaryButton title="Invite Client" onPress={() => navigation.navigate('InviteClient')} />
      </View>
    </View>
  );
};

export default AgentClients;
