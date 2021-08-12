import React from 'react';
import { View, Image } from 'react-native';
import { color, tw } from 'react-native-tailwindcss';
import dateformat from 'dateformat';
import { BodyText } from '../../../components';
import { CarIcon, ClockIcon, Logo } from '../../../assets/images';
import { TourIconOutline } from '../../../assets/images/tab-icons';

const LiveTourStopCard = ({ tourStop, nextStop }) => {
  const startDateStr = tourStop.startTime
    ? dateformat(new Date(parseInt(tourStop.startTime) * 1000), 'h:MMtt')
    : 'Not Available';

  const {
    propertyOfInterest: { propertyListing },
  } = tourStop;
  const { listingAgent } = propertyListing;

  const getNextStopAddress = () => {
    try {
      if (!nextStop) {
        return null;
      }

      const {
        propertyOfInterest: { propertyListing: nextPropertyListing },
      } = nextStop;

      return (
        <>
          <BodyText>
            {nextPropertyListing.address.includes(',')
              ? nextPropertyListing.address.split(',')[0]
              : nextPropertyListing.address}
          </BodyText>
          <BodyText>{`${nextPropertyListing.city}, ${nextPropertyListing.state}`}</BodyText>
        </>
      );
    } catch (error) {
      console.warn('Error getting next live tour stop address: ', error);
    }
  };

  return (
    <View style={[tw.wFull]}>
      <View style={[tw.w5_6, tw.selfCenter]}>
        <View style={[tw.wFull, tw.flexRow]}>
          <BodyText md semibold>
            Appt Time:
          </BodyText>
          <BodyText md style={[tw.mL2]}>
            {startDateStr}
          </BodyText>
        </View>
        <View style={[tw.wFull, tw.flexRow, tw.mT3]}>
          <BodyText md semibold>
            Listing Agent:
          </BodyText>
          <BodyText md style={[tw.mL2]}>
            {listingAgent ? `${listingAgent.firstName} ${listingAgent.lastName}` : 'N/A'}
          </BodyText>
        </View>
        {nextStop && (
          <View style={[tw.wFull, tw.flexRow, tw.mT3]}>
            <BodyText md semibold>
              Next Stop:
            </BodyText>
            <View style={[tw.flexCol, tw.mL4]}>
              <View style={[tw.flexRow, tw.itemsCenter, tw.contentCenter]}>
                <ClockIcon width={16} height={16} fill={color.gray700} />
                <BodyText md style={[tw.mL3]}>
                  {nextStop.startTime ? dateformat(new Date(parseInt(nextStop.startTime) * 1000), 'h:MMtt') : 'N/A'}
                </BodyText>
              </View>
              <View style={[tw.flexRow, tw.itemsCenter, tw.contentCenter, tw.mT2]}>
                <TourIconOutline width={16} height={16} fill={color.gray700} />
                <View style={[tw.flexCol, tw.mL3]}>{getNextStopAddress()}</View>
              </View>
              <View style={[tw.flexRow, tw.itemsCenter, tw.contentCenter, tw.mT2]}>
                <CarIcon width={16} height={16} fill={color.gray700} />
                <BodyText md style={[tw.mL3]}>
                  {nextStop.estDriveStr || 'N/A'}
                </BodyText>
              </View>
            </View>
          </View>
        )}
        {!nextStop && (
          <View style={[tw.h32]}>
            <View style={[tw.wFull, tw.flexRow, tw.mT3]}>
              <BodyText md bold>
                Next Stop:
              </BodyText>
              <BodyText md style={[tw.mL3]}>
                This is the end of the line
              </BodyText>
            </View>
            <View style={[tw.absolute, tw.bottom0, tw.selfCenter, tw.mB4]}>
              <Image source={Logo} style={[tw.h12, tw.wFull]} resizeMode="contain" />
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default LiveTourStopCard;
