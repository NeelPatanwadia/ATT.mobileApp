import React, { useState, useEffect, useContext, useRef } from 'react';
import { NavigationEvents } from 'react-navigation';
import { Alert, View } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { BodyText, PrimaryButton, PrimaryInput, PhoneInput } from '../../components';
import { userService } from '../../services';
import AgentTabContext from '../../navigation/AgentTabContext';
import ClientContext from './ClientContext';
import { parseFriendlyGraphQLError } from '../../helpers/errorHelpers';

const InviteClient = ({ navigation, screenProps: { user, setUser } }) => {
  const lastNameField = useRef(null);
  const emailField = useRef(null);
  const phoneField = useRef(null);

  const inputFields = { lastNameField, emailField, phoneField };

  const { clients, setClients } = useContext(ClientContext);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [cellPhone, setCellPhone] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [validationErrors, setValidationErrors] = useState({
    firstName: '',
    lastName: '',
    emailAddress: '',
    cellPhone: '',
  });
  const { setNavigationParams } = useContext(AgentTabContext);

  const inviteAgent = navigation.getParam('inviteAgent', false);

  useEffect(() => {
    if (firstName) {
      validateFirstName();
    }
  }, [firstName]);

  useEffect(() => {
    if (lastName) {
      validateLastName();
    }
  }, [lastName]);

  useEffect(() => {
    if (emailAddress) {
      validateEmail();
    }
  }, [emailAddress]);

  useEffect(() => {
    if (cellPhone) {
      validateCellPhone();
    }
  }, [cellPhone]);

  const validateFirstName = () => {
    if (!firstName) {
      setValidationErrors(prevState => ({ ...prevState, firstName: 'First Name is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, firstName: '' }));

    return true;
  };

  const validateLastName = () => {
    if (!lastName) {
      setValidationErrors(prevState => ({ ...prevState, lastName: 'Last Name is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, lastName: '' }));

    return true;
  };

  const validateEmail = () => {
    if (!emailAddress) {
      setValidationErrors(prevState => ({ ...prevState, emailAddress: 'Email address is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, emailAddress: '' }));

    return true;
  };

  const validateCellPhone = () => {
    if (!cellPhone) {
      setValidationErrors(prevState => ({ ...prevState, cellPhone: 'Cell Phone is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, cellPhone: '' }));

    return true;
  };

  const focusInput = field => {
    inputFields[field].current.focus();
  };

  const sendAgentRequest = async () => {
    try {
      setSendingInvite(true);
      const invitedAgent = await userService.mutations.createAndInviteClient({
        firstName,
        lastName,
        emailAddress,
        cellPhone,
        is_agent: true,
        isAgent: true,
        clientId: user.id,
      });

      console.log(JSON.stringify(invitedAgent, null, 2));

      setUser({ ...user, requestedAgentId: invitedAgent.id });
      setSendingInvite(false);
      navigation.goBack();
    } catch (error) {
      console.log('Error inviting an Agent', error);
      const errorMessage = parseFriendlyGraphQLError(error, 'An error occurred attempting to send the invite.');

      setInviteError(errorMessage);
      setSendingInvite(false);
    }
  };

  const inviteClient = async () => {
    try {
      if (!(validateFirstName() && validateLastName() && validateEmail() && validateCellPhone())) {
        setInviteError('Please correct errors before inviting a client.');

        return;
      }

      const emailValidationExpression = /[^@]+@[^.]+..+/g;

      if (emailAddress && !emailValidationExpression.test(String(emailAddress))) {
        setValidationErrors(prevState => ({ ...prevState, emailAddress: 'Please enter a valid email' }));

        return;
      }

      if (cellPhone.length !== 12) {
        setValidationErrors(prevState => ({
          ...prevState,
          cellPhone: 'Please enter phone number in this format: XXX-XXX-XXXX',
        }));

        return;
      }

      setSendingInvite(true);
      setInviteError('');
      if (inviteAgent) {
        if (user.requestedAgentId) {
          setSendingInvite(false);
          Alert.alert(
            'Request already send',
            'You have already invited a client. Sending request will remove request from previous agent',
            [
              {
                text: 'Cancel',
                onPress: () => {},
              },
              {
                text: 'Ok',
                onPress: () => sendAgentRequest(),
              },
            ]
          );
        } else {
          sendAgentRequest();
        }
      } else {
        const invitedClient = await userService.mutations.createAndInviteClient({
          firstName,
          lastName,
          emailAddress,
          cellPhone,
          agentId: user.id,
          isAgent: false,
        });

        if (invitedClient && !clients.find(x => x.id === invitedClient.id)) {
          setClients([...clients, invitedClient]);
        }
        setSendingInvite(false);
        navigation.goBack();
      }
    } catch (error) {
      console.warn('Error inviting client: ', error);
      const errorMessage = parseFriendlyGraphQLError(error, 'An error occurred attempting to send the invite.');

      setInviteError(errorMessage);
      setSendingInvite(false);
    }
  };

  return (
    <>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: inviteAgent ? 'Agent Select' : 'Clients',
            showBackBtn: true,
            showSettingsBtn: true,
          })
        }
      />
      <KeyboardAwareScrollView style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol]}>
        <BodyText style={[tw.selfCenter, tw.text2xl, tw.mT12]}>
          {inviteAgent ? 'Invite a New Agent' : 'Invite a New Client'}
        </BodyText>
        <View style={[tw.wFull, tw.flex1]}>
          <View style={[tw.w5_6, tw.selfCenter]}>
            <View style={[tw.mY8]}>
              <BodyText style={[tw.mL2]}>First Name</BodyText>
              <PrimaryInput
                placeholder=""
                autoCapitalize="words"
                onChangeText={newFirstName => setFirstName(newFirstName)}
                value={firstName}
                onBlur={validateFirstName}
                errorMessage={validationErrors.firstName}
                returnKeyType="next"
                onSubmitEditing={() => focusInput('lastNameField')}
              />
              <BodyText style={[tw.mL2, tw.mT6]}>Last Name</BodyText>
              <PrimaryInput
                placeholder=""
                autoCapitalize="words"
                onChangeText={newLastName => setLastName(newLastName)}
                value={lastName}
                onBlur={validateLastName}
                errorMessage={validationErrors.lastName}
                returnKeyType="next"
                onSubmitEditing={() => focusInput('emailField')}
                ref={lastNameField}
              />
              <BodyText style={[tw.mL2, tw.mT6]}>Email Address</BodyText>
              <PrimaryInput
                placeholder=""
                onChangeText={newEmailAddress => setEmailAddress(newEmailAddress)}
                value={emailAddress}
                onBlur={validateEmail}
                errorMessage={validationErrors.emailAddress}
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => focusInput('phoneField')}
                ref={emailField}
              />
              <BodyText style={[tw.mL2, tw.mT6]}>Cell Phone</BodyText>
              <PhoneInput
                placeholder=""
                value={cellPhone}
                onBlur={validateCellPhone}
                errorMessage={validationErrors.cellPhone}
                onChangeText={setCellPhone}
                ref={phoneField}
              />
            </View>
          </View>
          <View style={[tw.mX4]}>
            <PrimaryButton
              title={inviteAgent ? 'Invite Agent' : 'Invite Client'}
              onPress={inviteClient}
              loading={sendingInvite}
              loadingTitle="Sending Invite"
            />
            <View style={[tw.justifyCenter, tw.mT4]}>
              <BodyText style={[tw.textBlue500]}>{inviteError}</BodyText>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </>
  );
};

export default InviteClient;
