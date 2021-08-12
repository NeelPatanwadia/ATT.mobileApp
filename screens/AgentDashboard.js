import React, { useContext } from 'react';
import { NavigationEvents } from 'react-navigation';
import { View } from 'react-native';
import { tw, color } from 'react-native-tailwindcss';
import { PrimaryButton } from '../components';
import { TourIconOutline, ClientsIconOutline, ShowingsIconOutline } from '../assets/images/tab-icons';
import AgentTabContext from '../navigation/AgentTabContext';
import { SearchIcon } from '../assets/images';

const AgentDashboard = ({ navigation }) => {
  const { setNavigationParams } = useContext(AgentTabContext);

  return (
    <View>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Home',
            showSettingsBtn: true,
          })
        }
      />
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol, tw.justifyAround]}>
        <View style={[tw.w5_6, tw.selfCenter, tw._mT12]}>
          <PrimaryButton
            style={[tw.mB8]}
            title="TOURS"
            leftIcon={<TourIconOutline width={22} height={22} stroke={color.white} />}
            onPress={() => navigation.navigate('ScheduledTours')}
          />
          <PrimaryButton
            style={[tw.mB8]}
            title="CLIENTS"
            leftIcon={<ClientsIconOutline width={22} height={22} stroke={color.white} />}
            onPress={() => navigation.navigate('AgentClients')}
          />
          <PrimaryButton
            style={[tw.mB8]}
            title="LISTINGS"
            leftIcon={<ShowingsIconOutline width={22} height={22} stroke={color.white} />}
            onPress={() => navigation.navigate('ListingsIndex')}
          />
          <PrimaryButton
            title="SEARCH MLS LISTINGS"
            leftIcon={<SearchIcon width={22} height={22} stroke={color.white} />}
            onPress={() => navigation.navigate('SearchIndex')}
          />
        </View>
      </View>
    </View>
  );
};

export default AgentDashboard;
