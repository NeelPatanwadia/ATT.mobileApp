import React, { useContext } from 'react';
import { View, ScrollView } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { NavigationEvents } from 'react-navigation';
import { BodyText } from '../../components';
import AgentTabContext from '../../navigation/AgentTabContext';
import ClientContext from './ClientContext';

const RequestedClientDetails = () => {
  const { client } = useContext(ClientContext);
  const { setNavigationParams } = useContext(AgentTabContext);

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Client Details',
            showBackBtn: true,
            showSettingsBtn: true,
          })
        }
      />
      <ScrollView style={[tw.pB8, tw.bgPrimary]}>
        <View style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.p6]}>
          <BodyText style={[tw.mR2]} lg>
            Name:
          </BodyText>
          <View style={[tw.flexRow, tw.itemsCenter, tw.justifyEnd]}>
            <BodyText lg>
              {client.firstName} {client.lastName}
            </BodyText>
          </View>
        </View>
        <View style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.p6]}>
          <BodyText style={[tw.mR2]} lg>
            Email:
          </BodyText>
          <View style={[tw.flexRow, tw.itemsCenter, tw.justifyEnd]}>
            <BodyText lg>{client.emailAddress}</BodyText>
          </View>
        </View>
        <View style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.p6]}>
          <BodyText style={[tw.mR2]} lg>
            Phone:
          </BodyText>
          <View style={[tw.flexRow, tw.itemsCenter, tw.justifyEnd]}>
            <BodyText lg>{client.cellPhone}</BodyText>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

export default RequestedClientDetails;
