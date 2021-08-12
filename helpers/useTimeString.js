import dateformat from 'dateformat';
import { hoursToMilliseconds } from './dateHelpers';

function useTimeString(startTime, endTime, totalDuration) {
  const tourDateStr = dateformat(startTime * 1000, 'mm/dd/yyyy');
  const startTimeStr = dateformat(startTime * 1000, 'h:MMtt');
  let timeStr = `${startTimeStr}`;

  if (endTime) {
    const tourendTime = new Date(parseInt(endTime) * 1000);

    tourendTime.setTime(tourendTime.getTime() + hoursToMilliseconds(totalDuration || 0));

    const endTimeStr = dateformat(tourendTime, 'h:MMtt');

    timeStr += `-${endTimeStr}`;
  }

  return { tourDateStr, timeStr };
}

export default useTimeString;
