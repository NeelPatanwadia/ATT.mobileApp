import React, { useContext, useState, useEffect } from 'react';
import { withNavigationFocus } from 'react-navigation';
import { Image, View, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { BodyText, FlexLoader, SearchBar } from '../../../components';
import { ChevronRightIcon, PlusIcon } from '../../../assets/images';
import { userService } from '../../../services';
import TourContext from '../TourContext';
import AgentTabContext from '../../../navigation/AgentTabContext';

const ClientCard = ({ onPress, style = [], client: { firstName, lastName } }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[tw.shadow, tw.wFull, tw.h16, tw.bgGray100, tw.mY2, tw.pX4, tw.flexRow, ...style]}
  >
    <View style={[tw.w5_6, tw.justifyBetween, tw.flex1, tw.flexRow, tw.itemsCenter, tw.mY1, tw.pX5]}>
      <BodyText xl style={[tw.textGray900]}>
        {firstName} {lastName}
      </BodyText>
      <ChevronRightIcon width={15} height={15} />
    </View>
  </TouchableOpacity>
);

const NewTourClientSelect = ({ navigation, isFocused, screenProps: { user } }) => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { tour, setTour, setClient } = useContext(TourContext);
  const { setNavigationParams } = useContext(AgentTabContext);

  useEffect(() => {
    if (isFocused) {
      setNavigationParams({
        headerTitle: 'Create Tour',
        showBackBtn: true,
        showSettingsBtn: true,
      });
      setTour({ name: '' });

      const clientId = navigation.getParam('clientIdFromProfile', null);

      if (clientId) {
        navigation.setParams({ clientIdFromProfile: null });
        selectClientAndResetTour({ id: clientId });
      } else {
        setLoading(false);
      }
    } else {
      // When you navigate away, set loading to true. This will cause the loading icon to show up when navigating back
      // to the screen while the check for a redirect occurs.
      setLoading(true);
    }
  }, [isFocused]);

  useEffect(() => {
    getClients();
  }, []);

  useEffect(() => {
    if (clients) {
      filterClients(clients);
    }
  }, [search]);

  const getClients = async () => {
    try {
      const clientList = await userService.queries.listClients(user.id);

      setClients(clientList);
      filterClients(clientList);
    } catch (error) {
      console.log('Error fetching clients: ', error);
    }

    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);

    getClients();
  };

  const selectClient = async selectedClient => {
    try {
      const { id: clientId } = selectedClient;

      await userService.queries.getUser(clientId).then(newClient => setClient(newClient));

      setTour({ ...tour, clientId });
      navigation.navigate('NewTourNameDate');
    } catch (error) {
      console.log('Error selecting client:', error);
    }
  };

  const selectClientAndResetTour = async selectedClient => {
    try {
      const { id: clientId } = selectedClient;

      await userService.queries.getUser(clientId).then(newClient => setClient(newClient));

      setTour({ name: '', clientId });
      navigation.navigate('NewTourNameDate');
    } catch (error) {
      console.log('Error selecting client and resetting tour:', error);
    }
  };

  if (loading) {
    return <FlexLoader />;
  }

  const executeSearch = text => {
    setSearching(true);
    setSearch(text);
  };

  const filterClients = clientList => {
    try {
      const filteredClientList = clientList.filter(filterClient => {
        const regex = new RegExp(search, 'i');
        const { firstName, lastName } = filterClient;
        const clientFields = [firstName, lastName].join('');

        return clientFields.match(regex);
      });

      setFilteredClients(filteredClientList);
    } catch (error) {
      console.log('Error filtering clients: ', error);
    }

    setSearching(false);
  };

  return (
    <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.pT8]}>
      <View style={[tw.wFull, tw.selfCenter, tw.pB10, tw._mB3]}>
        <View style={[tw.flexRow, tw.justifyBetween, tw.wFull, tw.pX8]}>
          <BodyText lg style={[tw.textGray700]}>
            Search for a client
          </BodyText>
          <TouchableOpacity style={[tw.mR2, tw.mT1]} onPress={() => navigation.push('TourInviteClient')}>
            <Image source={PlusIcon} style={{ width: 20, height: 20 }} resizeMode="contain" />
          </TouchableOpacity>
        </View>
        <SearchBar searchTerm={search} executeSearch={executeSearch} searching={searching} margins={[tw.mT2, tw.pX8]} />
      </View>

      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={filteredClients}
        renderItem={({ item: filteredClient }) => (
          <ClientCard client={filteredClient} onPress={() => selectClient(filteredClient)} />
        )}
        keyExtractor={clientCard => `clientCard-${clientCard.id}`}
        ListEmptyComponent={
          <View style={[tw.flexCol, tw.mT16, tw.itemsCenter, tw.justifyCenter]}>
            <BodyText>No Clients Found</BodyText>
          </View>
        }
      />
    </View>
  );
};

export default withNavigationFocus(NewTourClientSelect);
