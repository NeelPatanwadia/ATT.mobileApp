import { createStackNavigator } from 'react-navigation-stack';

import { color } from 'react-native-tailwindcss';
import AgentCustomListings from '../../screens/AgentCustomListing/AgentCustomListings';
import CustomListingForm from '../../screens/AgentCustomListing/CustomListingForm';
import CustomListingLocation from '../../screens/AgentCustomListing/CustomListingLocation';

const AgentClientsStack = createStackNavigator(
  {
    AgentCustomListings: {
      screen: AgentCustomListings,
      navigationOptions: {
        title: 'My Custom Listings',
        headerStyle: { backgroundColor: color.primary },
      },
    },
    CustomListingForm: {
      screen: CustomListingForm,
      navigationOptions: {
        title: 'New Custom Listing',
        headerStyle: { backgroundColor: color.primary },
      },
    },
    CustomListingLocation: {
      screen: CustomListingLocation,
      navigationOptions: {
        title: 'Listing Location',
        headerStyle: { backgroundColor: color.primary },
      },
    },
  },
  {
    initialRouteName: 'AgentCustomListings',
    defaultNavigationOptions: { headerShown: false, headerForceInset: { top: 'never' } },
  }
);

export default AgentClientsStack;
