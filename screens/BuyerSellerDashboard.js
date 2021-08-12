import React, { useContext } from 'react';
import { NavigationEvents } from 'react-navigation';
import { View } from 'react-native';
import { tw, color } from 'react-native-tailwindcss';
import { PrimaryButton } from '../components';
import { TourIconOutline, HomesIconOutline, ShowingsIconOutline } from '../assets/images/tab-icons';
import BuyerSellerTabContext from '../navigation/BuyerSellerTabContext';
import { SearchIcon } from '../assets/images';

const BuyerSellerDashboard = ({ navigation, screenProps: { user } }) => {
  const { setNavigationParams } = useContext(BuyerSellerTabContext);

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Dashboard',
            showSettingsBtn: true,
          })
        }
      />
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol, tw.justifyAround]}>
        <View style={[tw.w5_6, tw.selfCenter, tw._mT12]}>
          <PrimaryButton
            title="TOURS"
            leftIcon={<TourIconOutline width={22} height={22} stroke={color.white} />}
            onPress={() => navigation.navigate('BuyerSellerScheduledTours')}
          />
          <PrimaryButton
            style={[tw.mT8]}
            title="HOMES"
            leftIcon={<HomesIconOutline width={22} height={22} stroke={color.white} strokeWidth={2} />}
            onPress={() => navigation.navigate('BuyerSellerHomes')}
          />
          <PrimaryButton
            style={[tw.mT8]}
            title="MY LISTINGS"
            leftIcon={<ShowingsIconOutline width={22} height={22} stroke={color.white} />}
            onPress={() => navigation.navigate('BuyerSellerScheduledShowings')}
          />
          <PrimaryButton
            style={[tw.mT8]}
            title="SEARCH MLS LISTINGS"
            leftIcon={<SearchIcon width={22} height={22} stroke={color.white} />}
            onPress={() => navigation.navigate('SearchIndex')}
          />
          <PrimaryButton
            style={[tw.mT8]}
            title="MY Agents"
            leftIcon={<ShowingsIconOutline width={22} height={22} stroke={color.white} />}
            onPress={() => navigation.navigate('AgentConnect')}
          />
        </View>
      </View>
    </>
  );
};

export default BuyerSellerDashboard;
