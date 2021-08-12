import React, { useState, useEffect, useContext, useRef } from 'react';
import { NavigationEvents } from 'react-navigation';
import { View } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { BodyText, PrimaryButton, PrimaryInput } from '../components';
import AgentTabContext from '../navigation/AgentTabContext';
import config from '../configs/config';
import BuyerSellerTabContext from '../navigation/BuyerSellerTabContext';

const Support = ({ navigation, screenProps: { user } }) => {
  const bodyField = useRef(null);

  const inputFields = { bodyField };

  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    body: '',
  });

  const { setNavigationParams } = useContext(user.isAgent ? AgentTabContext : BuyerSellerTabContext);

  useEffect(() => {
    if (body) {
      validateBody();
    }
  }, [body]);

  const validateBody = () => {
    if (!body) {
      setValidationErrors(prevState => ({ ...prevState, body: 'Value is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, body: '' }));

    return true;
  };

  const focusInput = field => {
    inputFields[field].current.focus();
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    if (!validateBody()) {
      setSubmitting(false);

      return;
    }

    const request = {
      request: {
        requester: { name: `${user.firstName} ${user.lastName}`, email: user.emailAddress },
        subject: `${config.env !== 'production' ? '[TESTING] ' : ''}Support request from mobile app`,
        comment: { body },
      },
    };

    console.log(request);

    try {
      await fetch(config.zendesk.url, {
        method: 'POST',
        body: JSON.stringify(request),
        headers: {
          Authorization: `Basic ${config.zendesk.user}:${config.zendesk.token}`,
          'Content-Type': 'application/json',
        },
      }).then(res => console.log(res));
    } catch (error) {
      console.log(error);
    }

    navigation.goBack(null);
  };

  return (
    <>
      <NavigationEvents
        onWillFocus={() => setNavigationParams({ headerTitle: 'Support', showBackBtn: true, showSettingsBtn: true })}
      />
      <View style={[tw.wFull, tw.hFull, tw.bgPrimary, tw.flexCol]}>
        <View style={[tw.wFull, tw.flex1]}>
          <View style={[tw.w5_6, tw.selfCenter]}>
            <View style={[tw.mY8]}>
              <BodyText>Send a message to support</BodyText>
              <PrimaryInput
                placeholder="How can we help you?"
                value={body}
                onChangeText={newBody => setBody(newBody)}
                onBlur={validateBody}
                errorMessage={validationErrors.body}
                onSubmitEditing={() => focusInput('bodyField')}
                returnKeyType="next"
                style={[
                  tw.textMd,
                  tw.pX4,
                  tw.pY4,
                  tw.mY4,
                  tw.textGray700,
                  tw.border,
                  tw.borderGray700,
                  { minHeight: 75 },
                ]}
                multiline
                maxLength={255}
              />
            </View>
          </View>
          <View style={[tw.mX8]}>
            <PrimaryButton
              title="SUBMIT"
              onPress={handleSubmit}
              loading={submitting}
              loadingTitle="UPDATING"
              style={[tw.bgBlue500]}
            />
          </View>
        </View>
      </View>
    </>
  );
};

export default Support;
