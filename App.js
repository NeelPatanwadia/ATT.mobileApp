/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-classes-per-file */

import React, { useState } from 'react';
import Amplify, { Auth, Analytics } from 'aws-amplify';
import { Authenticator, SignIn, SignUp, ConfirmSignUp, ForgotPassword } from 'aws-amplify-react-native';
import * as SplashScreen from 'expo-splash-screen';
import { color, tw } from 'react-native-tailwindcss';
import { Platform, StatusBar, Text, LogBox, View } from 'react-native';
import * as Font from 'expo-font';
import buffer from 'buffer';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { extendComponent } from './helpers';
import { geoFenceHandler } from './helpers/locationHelper';
import { CustomSignIn, CustomSignUp, CustomForgotPassword, CustomConfirmSignUp, UpdateCheck } from './screens';
import { PushNotificationHandler } from './components';
import awsconfig from './aws-exports';
import AppNavigator from './navigation/AppNavigator';
import { userService } from './services';
import { logEvent, EVENT_TYPES, APP_REGIONS } from './helpers/logHelper';

import {
  JosefinSansBold,
  JosefinSansBoldItalic,
  JosefinSansItalic,
  JosefinSansLight,
  JosefinSansLightItalic,
  JosefinSansRegular,
  JosefinSansSemiBold,
  JosefinSansSemiBoldItalic,
  JosefinSansThin,
  JosefinSansThinItalic,
  LatoBold,
  LatoBoldItalic,
  LatoHairline,
  LatoHairlineItalic,
  LatoHeavy,
  LatoHeavyItalic,
  LatoItalic,
  LatoLight,
  LatoLightItalic,
  LatoMedium,
  LatoMediumItalic,
  LatoRegular,
  LatoSemibold,
  LatoSemiboldItalic,
  LatoThin,
  LatoThinItalic,
} from './assets/fonts';
import NewMessageHandler from './components/NewMessageHandler';

const theme = {
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 20,
    width: '100%',
    backgroundColor: color.primary,
  },
  section: {
    flex: 1,
    width: '100%',
    padding: 20,
  },
  sectionHeader: {
    width: '100%',
    marginBottom: 32,
  },
  sectionHeaderText: {
    color: '#152939',
    fontSize: 20,
    fontWeight: '500',
  },
  sectionFooter: {
    width: '100%',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 20,
  },
  sectionFooterLink: {
    fontSize: 14,
    color: '#ff9900',
    alignItems: 'baseline',
    textAlign: 'center',
  },
  navBar: {
    marginTop: 35,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  navButton: {
    marginLeft: 12,
    borderRadius: 4,
  },
  cell: {
    flex: 1,
    width: '50%',
  },
  errorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  errorRowText: {
    marginLeft: 10,
  },
  photo: {
    width: '100%',
  },
  album: {
    width: '100%',
  },
  button: {
    backgroundColor: '#ff9900',
    alignItems: 'center',
    padding: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ff990080',
    alignItems: 'center',
    padding: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  formField: {
    marginBottom: 22,
  },
  input: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 3,
    borderColor: '#C4C4C4',
  },
  inputLabel: {
    marginBottom: 8,
  },
  phoneContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInput: {
    flex: 2,
    padding: 16,
    borderWidth: 1,
    borderRadius: 3,
    borderColor: '#C4C4C4',
  },
  picker: {
    flex: 1,
    height: 44,
  },
  pickerItem: {
    height: 44,
  },
};

SplashScreen.preventAutoHideAsync().catch(err => {
  logEvent({
    message: `Error preventing SpashScreen Auto Hide: ${err}`,
    appRegion: APP_REGIONS.EXPO,
    eventType: EVENT_TYPES.WARNING,
  });
});

// Setting a timer - Issue in Amplify subscriptions -- ignore the warnings because they are annoying
// https://github.com/aws-amplify/amplify-js/issues/5075
// componentWillXXX Issue in react-native-material-dropdown
LogBox.ignoreLogs(['Setting a timer', 'componentWillUpdate', 'componentWillReceiveProps', 'componentWillMount']);

Amplify.configure(awsconfig);
Analytics.disable();

global.Buffer = global.Buffer || buffer.Buffer;

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

if (Platform.OS === 'ios') {
  StatusBar.setBarStyle('dark-content');
}

const ExtendedSignIn = extendComponent(CustomSignIn, SignIn);
const WrappedSignIn = withFont(ExtendedSignIn);

const ExtendedSignUp = extendComponent(CustomSignUp, SignUp);
const WrappedSignUp = withFont(ExtendedSignUp);

const ExtendedConfirmSignUp = extendComponent(CustomConfirmSignUp, ConfirmSignUp);
const WrappedConfirmSignUp = withFont(ExtendedConfirmSignUp);

const ExtendedForgotPassword = extendComponent(CustomForgotPassword, ForgotPassword);
const WrappedForgotPassword = withFont(ExtendedForgotPassword);

const AuthenticatedApp = ({ authState, onStateChange }) => {
  const [topLevelNavigator, setTopLevelNavigator] = useState(null);
  const [user, setUser] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showingRequestCounts, setShowingRequestCounts] = useState(0);
  const [propertiesOfInterestNotSeen, setPropertiesOfInterestNotSeen] = useState([]);
  const [newTourNotSeen, setNewTourNotSeen] = useState([]);
  const [newMessages, setNewMessages] = useState([]);
  const [showListingBatch, setShowListingBatch] = useState(false);
  const [showBuyingBatch, setShowBuyingBatch] = useState(false);
  const [clientRequestCount, setClientRequestCount] = useState(0);

  const signOut = async () => {
    try {
      if (user && user.id) {
        const updateUserInput = {
          id: user.id,
          push_token: '',
        };

        await userService.mutations.updateUser(updateUserInput);
        await Notifications.setBadgeCountAsync(0);
        setUser({});
      }
    } catch (error) {
      console.log('Error clearing push token on sign out: ', error);
    }

    Auth.signOut()
      .then(() => onStateChange('signIn', null))
      .catch(error => console.log('Error signing out', error));
  };

  if (authState !== 'signedIn') {
    return null;
  }

  return (
    <View style={[tw.hFull, tw.wFull]}>
      <AppNavigator
        screenProps={{
          user,
          setUser,
          signOut,
          showingRequestCounts,
          setShowingRequestCounts,
          propertiesOfInterestNotSeen,
          setPropertiesOfInterestNotSeen,
          newTourNotSeen,
          setNewTourNotSeen,
          notificationCount,
          setNotificationCount,
          newMessages,
          setNewMessages,
          showListingBatch,
          setShowListingBatch,
          showBuyingBatch,
          setShowBuyingBatch,
          clientRequestCount,
          setClientRequestCount,
        }}
        ref={nav => setTopLevelNavigator(nav)}
      />
      {topLevelNavigator && user && user.id ? (
        <PushNotificationHandler
          user={user}
          appNavigator={topLevelNavigator}
          setNotificationCount={setNotificationCount}
          setClientRequestCount={setClientRequestCount}
        />
      ) : null}
      {user && user.id ? (
        <NewMessageHandler
          user={user}
          setShowListingBatch={setShowListingBatch}
          setShowBuyingBatch={setShowBuyingBatch}
          setNewMessages={setNewMessages}
        />
      ) : null}
    </View>
  );
};

const App = () => {
  const [updateCheckComplete, setUpdateCheckComplete] = useState(false);

  if (!updateCheckComplete) {
    return (
      <UpdateCheck
        onFinish={() => {
          setUpdateCheckComplete(true);
          SplashScreen.hideAsync();
        }}
      />
    );
  }

  return (
    <Authenticator hideDefault theme={theme}>
      <WrappedSignIn />
      <WrappedSignUp />
      <WrappedConfirmSignUp />
      <WrappedForgotPassword />

      <AuthenticatedApp />
    </Authenticator>
  );
};

const WrappedApp = withFont(App);

TaskManager.defineTask('watch_tour_gps', geoFenceHandler);

export default WrappedApp;

const loadFont = () =>
  Font.loadAsync({
    'josefin-sans-bold': JosefinSansBold,
    'josefin-sans-bold-italic': JosefinSansBoldItalic,
    'josefin-sans-italic': JosefinSansItalic,
    'josefin-sans-light': JosefinSansLight,
    'josefin-sans-light-italic': JosefinSansLightItalic,
    'josefin-sans-regular': JosefinSansRegular,
    'josefin-sans-semi-bold': JosefinSansSemiBold,
    'josefin-sans-semi-bold-italic': JosefinSansSemiBoldItalic,
    'josefin-sans-thin': JosefinSansThin,
    'josefin-sans-thin-italic': JosefinSansThinItalic,
    'lato-bold': LatoBold,
    'lato-bold-italic': LatoBoldItalic,
    'lato-hairline': LatoHairline,
    'lato-hairline-italic': LatoHairlineItalic,
    'lato-heavy': LatoHeavy,
    'lato-heavy-italic': LatoHeavyItalic,
    'lato-italic': LatoItalic,
    'lato-light': LatoLight,
    'lato-light-italic': LatoLightItalic,
    'lato-medium': LatoMedium,
    'lato-medium-italic': LatoMediumItalic,
    'lato-regular': LatoRegular,
    'lato-semibold': LatoSemibold,
    'lato-semibold-italic': LatoSemiboldItalic,
    'lato-thin': LatoThin,
    'lato-thin-italic': LatoThinItalic,
  });

function withFont(WrappedComponent) {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        fontLoaded: false,
      };
    }

    componentDidMount() {
      loadFont().then(() => this.setState({ fontLoaded: true }));
    }

    render() {
      const { fontLoaded } = this.state;

      if (!fontLoaded) return null;

      return <WrappedComponent {...this.props} />;
    }
  };
}
