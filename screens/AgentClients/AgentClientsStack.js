import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack';

import { tw } from 'react-native-tailwindcss';
import AgentClients from './AgentClients';
import InviteClient from './InviteClient';
import RequestedClientDetails from './RequestedClientDetails';
import ClientDetails from './ClientDetails';
import ClientContext from './ClientContext';
import { ClientsIconOutline, ClientsIconSolid } from '../../assets/images/tab-icons';
import { Badge } from '../../components';

const AgentClientsStack = createStackNavigator(
  {
    AgentClients,
    InviteClient,
    ClientDetails,
    RequestedClientDetails,
  },
  {
    initialRouteName: 'AgentClients',
    defaultNavigationOptions: { headerShown: false },
    navigationOptions: {
      title: 'Clients',
      tabBarLabel: <View />,
      tabBarIcon: ({ focused }) => {
        if (focused) {
          return <ClientsIconSolid width={28} height={28} />;
        }

        if (Platform.OS === 'android') {
          return <ClientsIconOutline width={28} height={28} fill="#000" />;
        }

        return <ClientsIconOutline width={28} height={28} />;
      },
    },
  }
);

const StackWithClients = props => {
  const [client, setClient] = useState({});
  const [clients, setClients] = useState([]);
  const [propertyOfInterest, setPropertyOfInterest] = useState([]);

  return (
    <ClientContext.Provider
      value={{
        clients,
        setClients,
        client,
        setClient,
        propertyOfInterest,
        setPropertyOfInterest,
      }}
    >
      <AgentClientsStack {...props} />
    </ClientContext.Provider>
  );
};

StackWithClients.navigationOptions = navigation => ({
  tabBarLabel: <View />,
  tabBarIcon: ({ focused }) => {
    const { clientRequestCount, user, showBuyingBatch } = navigation.screenProps;

    const showBadge = clientRequestCount > 0 || showBuyingBatch;

    let icon = <ClientsIconOutline width={28} height={28} fill="#000" />;

    if (focused) {
      icon = <ClientsIconSolid width={28} height={28} />;
    }

    return (
      <View style={[tw.relative, tw.flexCol, tw.itemsCenter, tw.justifyCenter, { width: 50, height: 40 }]}>
        {icon}
        {user && showBadge && <Badge noCountNeeded absolute />}
      </View>
    );
  },
});
StackWithClients.router = AgentClientsStack.router;

AgentClientsStack.path = '';

export default StackWithClients;
