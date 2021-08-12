import dateformat from 'dateformat';

const hoursToSeconds = hours => {
  const minutes = hours * 60;
  const seconds = minutes * 60;

  return seconds;
};

const hoursToMilliseconds = hours => {
  const minutes = hours * 60;
  const seconds = minutes * 60;
  const milliseconds = seconds * 1000;

  return milliseconds;
};

const startTimeDurationStr = (startTime, duration = 0, delay = 0, showDate = true) => {
  const showingStartTime = startTime ? new Date(startTime) : new Date();
  const showingDateStr = dateformat(showingStartTime, 'mm/dd/yyyy');

  showingStartTime.setTime(showingStartTime.getTime() + hoursToMilliseconds(delay));
  const showingStartTimeStr = dateformat(showingStartTime, 'h:MMtt');

  const showingEndTime = new Date(showingStartTime);

  showingEndTime.setTime(showingEndTime.getTime() + hoursToMilliseconds(duration));
  const showingEndTimeStr = dateformat(showingEndTime, 'h:MMtt');
  const showingTimeStr = `${showingStartTimeStr} - ${showingEndTimeStr}`;

  return showDate ? `${showingDateStr} ${showingTimeStr}` : `${showingTimeStr}`;
};

const shortTimeDurationStr = (startTime, duration = 0, delay = 0) => {
  const showingStartTime = startTime ? new Date(startTime) : new Date();

  showingStartTime.setTime(showingStartTime.getTime() + hoursToMilliseconds(delay));
  const showingStartTimeStr = dateformat(showingStartTime, 'h:MMtt');

  const showingEndTime = new Date(showingStartTime);

  showingEndTime.setTime(showingEndTime.getTime() + hoursToMilliseconds(duration));
  const showingEndTimeStr = dateformat(showingEndTime, 'h:MMtt');

  return `${showingStartTimeStr} - ${showingEndTimeStr}`;
};

const getDayOfWeek = dateString => {
  const weekday = new Array(7);

  weekday[0] = 'Sunday';
  weekday[1] = 'Monday';
  weekday[2] = 'Tuesday';
  weekday[3] = 'Wednesday';
  weekday[4] = 'Thursday';
  weekday[5] = 'Friday';
  weekday[6] = 'Saturday';

  return weekday[new Date(dateString).getDay()];
};

const roundUpToNearest15MinuteInterval = dateTime => {
  const currentMinutes = dateTime.getMinutes();

  if (currentMinutes % 15) {
    const coefficient = 1000 * 60 * 15;

    return new Date(Math.ceil(dateTime.getTime() / coefficient) * coefficient);
  }

  return dateTime;
};

export {
  startTimeDurationStr,
  shortTimeDurationStr,
  hoursToSeconds,
  hoursToMilliseconds,
  getDayOfWeek,
  roundUpToNearest15MinuteInterval,
};
