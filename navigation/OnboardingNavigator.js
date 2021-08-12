import { createStackNavigator } from 'react-navigation-stack';

import {
  AgentBuyerSelect,
  AgentProfile,
  AgentValidation,
  BuyerSellerConfirm,
  BuyerSellerConnect,
  BuyerSellerInvite,
  BuyerSellerProfile,
} from '../screens';

const OnboardingNavigator = createStackNavigator(
  {
    AgentBuyerSelect,
    AgentProfile,
    AgentValidation,
    BuyerSellerProfile,
    BuyerSellerConnect,
    BuyerSellerConfirm,
    BuyerSellerInvite,
  },
  {
    initialRouteName: 'AgentBuyerSelect',
    defaultNavigationOptions: {
      headerShown: false,
      headerForceInset: { top: 'never' },
    },
  }
);

export default OnboardingNavigator;
