import React from 'react';
import { withNavigation } from 'react-navigation';

const AgentModal = ({ navigation, trigger, children, title, style }) =>
  React.cloneElement(trigger, {
    onPress: () =>
      navigation.navigate('AgentModal', {
        content: children,
        navigation,
        style,
        title,
      }),
  });

export default withNavigation(AgentModal);
