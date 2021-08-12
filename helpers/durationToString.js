const durationToString = (duration, type = 'short') => {
  const durations = {
    25: {
      text: '15 minutes',
      small: '15 mins',
      percent: '¼',
    },
    50: {
      text: '30 minutes',
      small: '30 mins',
      percent: '½',
    },
    75: {
      text: '45 minutes',
      small: '45 mins',
      percent: '¾',
    },
  };
  const durationHours = parseInt(duration);
  const durationPercentHour = parseInt((duration % 1) * 100);
  const { text, small, percent } = durations[durationPercentHour] || {};

  if (type === 'short') {
    if (durationHours < 1) {
      return small;
    }
    if (percent) {
      return `${durationHours}${percent} ${durationHours === 1 ? 'hour' : 'hours'}`;
    }

    return `${durationHours} ${durationHours === 1 ? 'hour' : 'hours'}`;
  }

  if (text) {
    if (durationHours === 0) {
      return text;
    }

    return `${durationHours} hour${durationHours > 1 ? 's' : ''} and ${text}`;
  }

  return `${durationHours} hour${durationHours > 1 ? 's' : ''}`;
};

export default durationToString;
