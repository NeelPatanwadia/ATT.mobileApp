import React, { useContext, useEffect } from 'react';
import TourContext from '../TourContext';
import { tourService } from '../../../services';
import { FlexLoader } from '../../../components';
import { logEvent, EVENT_TYPES, APP_REGIONS } from '../../../helpers/logHelper';

const LiveTourReloading = ({ navigation }) => {
  const { setClient, setTour, setTourStop, setTourStops } = useContext(TourContext);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const activeTourId = navigation.getParam('activeTourId', null);

      await logEvent({
        message: `Resuming Live Tour: ${activeTourId || 'UNKNOWN'}`,
        appRegion: APP_REGIONS.LIVE_TOUR,
        eventType: EVENT_TYPES.INFO,
      });

      if (!activeTourId) {
        throw new Error('No active tour');
      }

      const activeTour = await tourService.queries.getTour(activeTourId);

      if (!activeTour) {
        throw new Error('Could not fetch active tour');
      }

      setTour(activeTour);

      const { client } = activeTour;

      setClient(client);

      const activeTourTourStops = await tourService.queries.listTourStops(activeTour.id);

      if (!activeTourTourStops || activeTourTourStops.length === 0) {
        throw new Error('Could not fetch active tour stops');
      }

      const sortedStops = activeTourTourStops.sort((a, b) => a.order - b.order);

      setTourStops(sortedStops);

      let activeTourStop = sortedStops.find(tourStop => tourStop.id === activeTour.currentTourStopId);

      if (!activeTourStop) {
        [activeTourStop] = sortedStops;

        await logEvent({
          message: `Could not fetch active stop for live tour: ${activeTour.id}, falling back to tour stop ${activeTourStop.id} instead`,
          appRegion: APP_REGIONS.LIVE_TOUR,
          eventType: EVENT_TYPES.WARNING,
        });
      }

      setTourStop(activeTourStop);

      navigation.replace({
        routeName: 'LiveTour',
        params: { tourStopId: activeTourStop.id },
      });
    } catch (error) {
      await logEvent({
        message: `Error resuming live tour: ${error}`,
        appRegion: APP_REGIONS.LIVE_TOUR,
        eventType: EVENT_TYPES.ERROR,
      });

      navigation.replace('ScheduledTours');
    }
  };

  return <FlexLoader loadingText="Resuming Tour" />;
};

export default LiveTourReloading;
