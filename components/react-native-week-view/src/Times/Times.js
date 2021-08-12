/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';
import { View, Text } from 'react-native';
import styles from './Times.styles';
import { TIME_LABEL_HEIGHT } from '../utils';

const Times = ({ times, textStyle, is12HourFormat }) => {

  return (
    <View style={styles.columnContainer}>
      {
        times.map((time) => {
          const suffix = parseInt(time) >= 12 ? "pm":"am";
          let hours = time;
          if(is12HourFormat) {
            hours = ((parseInt(time) + 11) % 12 + 1) + suffix
          }
          return (
            <View key={time} style={[styles.label, { height: TIME_LABEL_HEIGHT }]}>
              <Text style={[styles.text, textStyle]}>{hours}</Text>
            </View>
          )
        }
      )}
    </View>
  );
};

Times.propTypes = {
  times: PropTypes.arrayOf(PropTypes.string).isRequired,
  is12HourFormat: PropTypes.bool,
};

export default React.memo(Times);
