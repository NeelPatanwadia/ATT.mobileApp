import { FontAwesome5 } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { tw } from 'react-native-tailwindcss';
import { BodyText } from './textComponents';
import { replacePipesInList, replaceQuotes } from '../helpers/stringHelpers';

const HomeDetailCollapsible = props => {
  const { isAgent, propertyListing, propertyFullDetails } = props;
  const [isPropertyInfoVisible, setPropertyInfoVisible] = useState(false);
  const [isAgentonlyVisible, setAgentonlyVisible] = useState(false);

  const checkIsNull = data => !(data === null || data === undefined);

  const getPrivateRemark = privateRemark => {
    const decodedURI = decodeURI(privateRemark);

    return decodedURI.replace(/(<([^>]+)>)/gi, '');
  };

  const getListPricePerSqFt = () => {
    const { originalListPrice } = propertyFullDetails.propertyListingAgentData;
    const { squareFeet } = propertyListing;

    if (!originalListPrice || !squareFeet) return null;
    const pricePerSqFt = parseInt(originalListPrice) / parseInt(squareFeet);

    return `$${pricePerSqFt.toFixed(2)}`;
  };

  const renderListDetails = (label, value, isFrom) => {
    if (!checkIsNull(value) || value === '') return null;

    return (
      <View style={[tw.flexRow, tw.mT2, isFrom !== 'Details' && tw.mS3]} key={`${isFrom}_${label}`}>
        <BodyText style={[tw.textBase, tw.textGray900, { lineHeight: 30, letterSpacing: 0.96, maxWidth: '60%' }]} bold>
          {`${label}: `}
        </BodyText>

        <BodyText style={[tw.textBase, tw.textGray900, tw.flex1, { lineHeight: 30, letterSpacing: 0.96 }]} medium>
          {value === true || value === false ? getBooleanFriendlyValue(value) : replacePipesInList(value)}
        </BodyText>
      </View>
    );
  };

  const getBooleanFriendlyValue = value => {
    if (value === true) {
      return 'Yes';
    }

    if (value === false) {
      return 'No';
    }

    return value.toString();
  };

  const _renderHeader = (title, isActive) => (
    <View key={`header_${title}`} style={[tw.flexRow, tw.bgBlue500, tw.pY3, tw.justifyCenter]}>
      <BodyText style={[tw.textLg, tw.textWhite, { lineHeight: 21, letterSpacing: 1.12 }]}>{title}</BodyText>
      <View style={[tw.absolute, tw.right0, tw.pY3, tw.pX3]}>
        <FontAwesome5 name={isActive ? 'chevron-down' : 'chevron-right'} solid style={[tw.textWhite, tw.textXl]} />
      </View>
    </View>
  );

  const renderPropertyInfoView = () => {
    const {
      rented,
      communityFeatures,
      shortTermRentalPermitIssued,
      elementarySchool,
      inAssociation,
      middleOrJuniorSchool,
      highSchool,
      taxAnnualAmount,
      taxYear,
      taxLot,
      taxMapNumber,
      potentialTaxLiability,
      assessment,
      seniorCommunity,
      appliances,
      cooling,
      fireplaceFeatures,
      flooring,
      heating,
      interiorFeatures,
      rooms,
      windowFeatures,
      securityFeatures,
      architecturalStyle,
      lotFeatures,
      lotSize,
      garage,
      garageSpaces,
      parkingFeatures,
      roadSurfaceTypes,
      view,
      horseProperty,
      newConstruction,
      accessoryDwellingUnit,
      levels,
      commonWalls,
      constructionMaterials,
      basement,
      foundationDetails,
      powerProductionType,
      roof,
      sewer,
      waterSource,
      irrigationWaterRights,
    } = propertyListing;

    return (
      <View style={[tw.mY3, tw.mX6]}>
        {(checkIsNull(rented) ||
          checkIsNull(communityFeatures) ||
          checkIsNull(shortTermRentalPermitIssued) ||
          checkIsNull(elementarySchool) ||
          checkIsNull(inAssociation) ||
          checkIsNull(middleOrJuniorSchool) ||
          checkIsNull(highSchool) ||
          checkIsNull(taxAnnualAmount) ||
          checkIsNull(taxYear) ||
          checkIsNull(taxLot) ||
          checkIsNull(taxMapNumber) ||
          checkIsNull(potentialTaxLiability) ||
          checkIsNull(assessment) ||
          checkIsNull(seniorCommunity)) && (
          <BodyText style={[tw.textXl, tw.textGray900, tw.mY2, { lineHeight: 21, letterSpacing: 1.4 }]} bold>
            General Property Information
          </BodyText>
        )}
        {renderListDetails('Rented', rented, 'General')}
        {/* {renderListDetails("CC&R's", 'No', 'General')}
        {renderListDetails('FIRPTA', 'No', 'General')} */}
        {renderListDetails('Association', inAssociation, 'General')}
        {renderListDetails('Community Features', communityFeatures, 'General')}
        {renderListDetails('Short Term Rental Permit Issued', shortTermRentalPermitIssued, 'General')}
        {renderListDetails('Elementary School', elementarySchool, 'General')}
        {renderListDetails('Middle School', middleOrJuniorSchool, 'General')}
        {renderListDetails('High School', highSchool, 'General')}
        {renderListDetails('Tax Annual', taxAnnualAmount, 'General')}
        {renderListDetails('Tax Year', taxYear, 'General')}
        {renderListDetails('Tax Lot', taxLot, 'General')}
        {renderListDetails('Tax Map Number', taxMapNumber, 'General')}
        {renderListDetails('Potential Tax Liability', potentialTaxLiability, 'General')}
        {renderListDetails('Assessment', assessment, 'General')}
        {renderListDetails('Senior Community', seniorCommunity, 'General')}
        {(checkIsNull(appliances) ||
          checkIsNull(cooling) ||
          checkIsNull(fireplaceFeatures) ||
          checkIsNull(flooring) ||
          checkIsNull(heating) ||
          checkIsNull(interiorFeatures) ||
          checkIsNull(rooms) ||
          checkIsNull(windowFeatures) ||
          checkIsNull(securityFeatures)) && (
          <BodyText style={[tw.textXl, tw.textGray900, tw.mY5, tw.mB0, { lineHeight: 21, letterSpacing: 1.4 }]} bold>
            Interior Information
          </BodyText>
        )}
        {renderListDetails('Appliances', appliances, 'Interior')}
        {renderListDetails('Cooling', cooling, 'Interior')}
        {renderListDetails('Fireplace Features', fireplaceFeatures, 'Interior')}
        {renderListDetails('Flooring', flooring, 'Interior')}
        {renderListDetails('Heating', heating, 'Interior')}
        {renderListDetails('Interior Features', interiorFeatures, 'Interior')}
        {renderListDetails('Rooms', rooms, 'Interior')}
        {renderListDetails('Window Features', windowFeatures, 'Interior')}
        {renderListDetails('Security Features', securityFeatures, 'Interior')}
        {(checkIsNull(architecturalStyle) ||
          checkIsNull(lotFeatures) ||
          checkIsNull(lotSize) ||
          checkIsNull(garage) ||
          checkIsNull(garageSpaces) ||
          checkIsNull(parkingFeatures) ||
          checkIsNull(roadSurfaceTypes) ||
          checkIsNull(view) ||
          checkIsNull(horseProperty)) && (
          <BodyText style={[tw.textXl, tw.textGray900, tw.mY5, tw.mB0, { lineHeight: 21, letterSpacing: 1.4 }]} bold>
            Exterior Information
          </BodyText>
        )}
        {renderListDetails('Architectural Style', architecturalStyle, 'Exterior')}
        {renderListDetails('Lot Features', lotFeatures, 'Exterior')}
        {renderListDetails('Lot Size Acers', lotSize, 'Exterior')}
        {renderListDetails('Garage', garage, 'Exterior')}
        {garage && renderListDetails('Garage Space', garageSpaces, 'Exterior')}
        {renderListDetails('Parking Features', parkingFeatures, 'Exterior')}
        {renderListDetails('Road Surface Type', roadSurfaceTypes, 'Exterior')}
        {renderListDetails('Views', view, 'Exterior')}
        {renderListDetails('Horse Property', horseProperty, 'Exterior')}
        {(checkIsNull(newConstruction) ||
          checkIsNull(accessoryDwellingUnit) ||
          checkIsNull(levels) ||
          checkIsNull(commonWalls) ||
          checkIsNull(constructionMaterials) ||
          checkIsNull(basement) ||
          checkIsNull(foundationDetails) ||
          checkIsNull(powerProductionType) ||
          checkIsNull(roof) ||
          checkIsNull(sewer) ||
          checkIsNull(waterSource) ||
          checkIsNull(irrigationWaterRights)) && (
          <BodyText style={[tw.textXl, tw.textGray900, tw.mY5, tw.mB0, { lineHeight: 21, letterSpacing: 1.4 }]} bold>
            Construction
          </BodyText>
        )}
        {renderListDetails('New Construction', newConstruction, 'Construction')}
        {renderListDetails('Accessory Dwelling Unit YN', accessoryDwellingUnit, 'Construction')}
        {renderListDetails('Levels', levels, 'Construction')}
        {renderListDetails('Common Walls', commonWalls, 'Construction')}
        {renderListDetails('Construction Materials', constructionMaterials, 'Construction')}
        {renderListDetails('Basement', basement, 'Construction')}
        {renderListDetails('Foundation Details', foundationDetails, 'Construction')}
        {renderListDetails('Power Production', powerProductionType, 'Construction')}
        {renderListDetails('Roof', roof, 'Construction')}
        {renderListDetails('Sewer', sewer, 'Construction')}
        {renderListDetails('Water Source', waterSource, 'Construction')}
        {renderListDetails('Irrigation Water Rights', irrigationWaterRights, 'Construction')}
      </View>
    );
  };

  const renderAgentOnlyInfo = () => {
    const {
      agencyRepresent,
      audioSurveillance,
      buyerAgencyCompensation,
      commissionType,
      listingAgreement,
      listingContractDate,
      listingOffice,
      listingOfficeLicense,
      listingOfficePhone,
      listingTerms,
      occupantType,
      originalListPrice,
      ownerName,
      preferredEscrowCompany,
      privateRemarks,
      showingRequirements,
      showingInstructions,
      signOnProperty,
      specialListingConditions,
      underContractDate,
      videoSurveillance,
    } = propertyFullDetails.propertyListingAgentData;

    const { cellPhone, emailAddress, firstName, lastName, realtorNumber } = propertyListing.listingAgent;

    return (
      <View style={[tw.mY3, tw.mX6]}>
        {privateRemarks && (
          <>
            <BodyText style={[tw.textXl, tw.textGray900, tw.mY2, { lineHeight: 21, letterSpacing: 1.4 }]} bold>
              Private Remarks
            </BodyText>
            <BodyText style={[tw.textSm, tw.textGray900, { lineHeight: 28, letterSpacing: 0.84 }]}>
              {privateRemarks}
            </BodyText>
          </>
        )}
        {(checkIsNull(ownerName) ||
          checkIsNull(occupantType) ||
          checkIsNull(showingRequirements) ||
          checkIsNull(showingInstructions) ||
          checkIsNull(audioSurveillance) ||
          checkIsNull(videoSurveillance) ||
          checkIsNull(signOnProperty)) && (
          <BodyText style={[tw.textXl, tw.textGray900, tw.mY5, tw.mB0, { lineHeight: 21, letterSpacing: 1.4 }]} bold>
            Showing Info and Requirements
          </BodyText>
        )}
        {renderListDetails('Owner Name', ownerName, 'Requirements')}
        {renderListDetails('Occupant Type', occupantType, 'Requirements')}
        {showingInstructions && (
          <View style={[tw.flexCol, tw.mX3, tw.mT2]}>
            <BodyText
              style={[tw.textBase, tw.textGray900, { lineHeight: 30, letterSpacing: 0.96, maxWidth: '60%' }]}
              bold
            >
              Showing Instructions
            </BodyText>

            <BodyText style={[tw.textSm, tw.textGray900, { lineHeight: 28, letterSpacing: 0.84 }]}>
              {showingInstructions}
            </BodyText>
          </View>
        )}
        {renderListDetails('Showing Requirements', showingRequirements, 'Requirements')}
        {renderListDetails('Audio Surveillance on Prop', audioSurveillance, 'Requirements')}
        {renderListDetails('Video Surveillance on Prop', videoSurveillance, 'Requirements')}
        {renderListDetails('Sign On Property YN', signOnProperty, 'Requirements')}
        {(checkIsNull(originalListPrice) ||
          checkIsNull(listingContractDate) ||
          checkIsNull(underContractDate) ||
          checkIsNull(agencyRepresent) ||
          checkIsNull(listingAgreement) ||
          checkIsNull(buyerAgencyCompensation) ||
          checkIsNull(specialListingConditions) ||
          checkIsNull(preferredEscrowCompany)) && (
          <BodyText style={[tw.textXl, tw.textGray900, tw.mY5, tw.mB0, { lineHeight: 21, letterSpacing: 1.4 }]} bold>
            Listing and Contract Info
          </BodyText>
        )}
        {originalListPrice && renderListDetails('Original List Price', `$${originalListPrice}`, 'Contract')}
        {renderListDetails('List Price per SqFt', getListPricePerSqFt(), 'Contract')}
        {renderListDetails('Listing Contract Date', listingContractDate, 'Contract')}
        {renderListDetails('Under Contract Date', underContractDate, 'Contract')}
        {renderListDetails('Agency Represent', agencyRepresent, 'Contract')}
        {renderListDetails('Listing Agreement', listingAgreement, 'Contract')}
        {renderListDetails('Buyer Agency Compensation', buyerAgencyCompensation, 'Contract')}
        {renderListDetails('Commission Type', commissionType, 'Contract')}
        {renderListDetails('Special Listing Conditions', specialListingConditions, 'Contract')}
        {renderListDetails('Listing Terms', listingTerms, 'Contract')}
        {renderListDetails('Preferred Escrow Company & Officer', preferredEscrowCompany, 'Contract')}
        {(checkIsNull(firstName) ||
          checkIsNull(lastName) ||
          checkIsNull(cellPhone) ||
          checkIsNull(emailAddress) ||
          checkIsNull(listingOfficePhone) ||
          checkIsNull(listingOffice) ||
          checkIsNull(listingOfficeLicense) ||
          checkIsNull(underContractDate)) && (
          <BodyText style={[tw.textXl, tw.textGray900, tw.mY5, tw.mB2, { lineHeight: 21, letterSpacing: 1.4 }]} bold>
            Listing Office Information
          </BodyText>
        )}
        {(firstName || lastName || cellPhone || emailAddress) && (
          <BodyText style={[tw.textSm, tw.textBlack, { lineHeight: 28, letterSpacing: 0.84 }]} bold>
            Listing Member
          </BodyText>
        )}
        <View style={[tw.mS3]}>
          <BodyText style={[tw.textSm, tw.textGray900, { lineHeight: 28, letterSpacing: 0.84 }]}>
            {`Name: ${firstName || ''} ${lastName || ''}`}
          </BodyText>
          {realtorNumber && (
            <BodyText style={[tw.textSm, tw.textGray900, { lineHeight: 28, letterSpacing: 0.84 }]}>
              {`${realtorNumber}`}
            </BodyText>
          )}
          {cellPhone && (
            <BodyText style={[tw.textSm, tw.textGray900, { lineHeight: 28, letterSpacing: 0.84 }]}>
              {`Phone: ${cellPhone}`}
            </BodyText>
          )}
          {emailAddress && (
            <BodyText style={[tw.textSm, tw.textGray900, { lineHeight: 28, letterSpacing: 0.84 }]}>
              {`Email: ${emailAddress}`}
            </BodyText>
          )}
        </View>
        {(listingOfficePhone || listingOffice || listingOfficeLicense) && (
          <BodyText style={[tw.textSm, tw.textBlack, { lineHeight: 28, letterSpacing: 0.84 }]} bold>
            Listing Office
          </BodyText>
        )}
        <View style={[tw.mS3]}>
          {listingOffice && (
            <BodyText style={[tw.textSm, tw.textGray900, { lineHeight: 28, letterSpacing: 0.84 }]}>
              {listingOffice}
            </BodyText>
          )}
          {listingOfficeLicense && (
            <BodyText style={[tw.textSm, tw.textGray900, { lineHeight: 28, letterSpacing: 0.84 }]}>
              {`License: ${listingOfficeLicense}`}
            </BodyText>
          )}
          {listingOfficePhone && (
            <BodyText style={[tw.textSm, tw.textGray900, { lineHeight: 28, letterSpacing: 0.84 }]}>
              {`Phone: ${listingOfficePhone}`}
            </BodyText>
          )}
        </View>
        {renderListDetails('Under Contract Date', underContractDate, 'Agent')}
      </View>
    );
  };

  if (!propertyListing) return null;

  return (
    <View style={[tw.pB3]}>
      <View style={[tw.mX4, tw.pX2]}>
        <BodyText style={[tw.textLg, tw.textGray900, tw.mY2]} bold>
          Details:
        </BodyText>
        {renderListDetails('Lot Size', propertyListing.lotSize, 'Details')}
        {propertyListing.associationFee
          ? renderListDetails('HOA Dues', `$${propertyListing.associationFee}`, 'Details')
          : null}
        {propertyListing.associationFeeFrequency
          ? renderListDetails('HOA Dues Frequency', `${propertyListing.associationFeeFrequency}`, 'Details')
          : null}
        {renderListDetails('Parcel Number', propertyListing.parcelNumber, 'Details')}
        {renderListDetails('Property Sub Type', propertyListing.propertySubType, 'Details')}
        {renderListDetails('Subdivision Name', propertyListing.subdivisionName, 'Details')}
        {propertyListing.squareFeet
          ? renderListDetails('Lot Size Square Feet', `${propertyListing.squareFeet} sqft`, 'Details')
          : null}
        {renderListDetails('Zoning', propertyListing.zoning, 'Details')}
        {renderListDetails('Additional Parcels', propertyListing.additionalParcels, 'Details')}
        {renderListDetails('Built', propertyListing.yearBuilt, 'Details')}
        {renderListDetails('County', propertyListing.county, 'Details')}
        {renderListDetails('Status', propertyListing.status, 'Details')}
      </View>
      {propertyListing && (
        <>
          <TouchableWithoutFeedback style={[tw.mT6]} onPress={() => setPropertyInfoVisible(!isPropertyInfoVisible)}>
            {_renderHeader('Property Information', isPropertyInfoVisible)}
          </TouchableWithoutFeedback>
          {isPropertyInfoVisible && renderPropertyInfoView()}
        </>
      )}
      {isAgent && propertyFullDetails && propertyFullDetails.propertyListingAgentData && (
        <>
          <TouchableWithoutFeedback style={[tw.mT3]} onPress={() => setAgentonlyVisible(!isAgentonlyVisible)}>
            {_renderHeader('Agent Only Information', isAgentonlyVisible)}
          </TouchableWithoutFeedback>
          {isAgentonlyVisible && renderAgentOnlyInfo()}
        </>
      )}
    </View>
  );
};

export default HomeDetailCollapsible;
