import React, { useContext, useEffect } from 'react';
import TourContext from '../BuyerSellerTourContext';
import { tourService } from '../../../services';
import { FlexLoader } from '../../../components';

const LiveTourReloading = ({ navigation }) => {
  const { setSelectedTour, setSelectedTourStop, setTourStops } = useContext(TourContext);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const activeTourId = navigation.getParam('activeTourId', null);

      if (!activeTourId) {
        throw new Error('No active tour data');
      }

      const activeTour = await tourService.queries.getTour(activeTourId);

      setSelectedTour(activeTour);

      const activeTourTourStops = await tourService.queries.listTourStops(activeTour.id);

      setTourStops(activeTourTourStops);

      if (activeTourTourStops && activeTourTourStops.sort((a, b) => a.order > b.order).length > 0) {
        const activeTourStop = activeTourTourStops.find(tourStop => tourStop.id === activeTour.currentTourStopId);

        setSelectedTourStop(activeTourStop);

        navigation.replace({
          routeName: 'BuyerSellerLiveTour',
          params: { tourStopId: activeTourStop.id },
        });
      } else {
        throw new Error('Could not get active tour stops');
      }
    } catch (error) {
      console.log('Error Resuming Live Tour: ', error);
      navigation.replace('BuyerSellerScheduledTours');
    }
  };

  return <FlexLoader loadingText="Resuming Tour" />;
};

export default LiveTourReloading;
