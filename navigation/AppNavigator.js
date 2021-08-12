import { createAppContainer, createSwitchNavigator } from 'react-navigation';
import AgentMainStackNavigator from './AgentMainStackNavigator';
import AgentSubscriptionStack from './stacks/AgentSubscriptionStack';
import OnboardingNavigator from './OnboardingNavigator';
import UserLoadingScreen from '../screens/UserLoading';
import SyncAgentListingsScreen from '../screens/SyncAgentListings';
import BuyerSellerMainStack from './BuyerSellerMainStackNavigator';
import VerificationScreen from '../screens/Verification';

export default createAppContainer(
  createSwitchNavigator(
    {
      UserLoading: UserLoadingScreen,
      SyncAgentListings: SyncAgentListingsScreen,
      Onboarding: OnboardingNavigator,
      Agent: AgentMainStackNavigator,
      BuyerSeller: BuyerSellerMainStack,
      AgentSubscription: AgentSubscriptionStack,
      Verification: VerificationScreen,
    },
    {
      initialRouteName: 'UserLoading',
      defaultNavigationOptions: {
        headerForceInset: 'never',
      },
    }
  )
);
