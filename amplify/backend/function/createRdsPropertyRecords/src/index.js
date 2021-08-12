const { Lambda } = require('aws-sdk');
const url = require('url');

const DBHelper = require('./DBHelper');
const DynamoHelper = require('./DynamoHelper');
const LocationHelper = require('./LocationHelper');

const lambda = new Lambda();

exports.handler = async event => {
  try {
    console.log('EVENT: ', event);

    const { createPropertyRecordsInput } = event.arguments || {};

    let {
      listing_id: listingId,
      client_id: clientId,
      agent_id: agentId,
      fallback_phone_number: fallbackPhoneNumber,
    } = createPropertyRecordsInput;

    if (!listingId) {
      throw new Error('listing_id is required');
    }

    if (!clientId && !agentId) {
      throw new Error('You must provide either a client_id or an agent_id');
    }

    const mlsListing = await getMlsListing(listingId);

    console.log('LISTING KEY: ', mlsListing.id);

    let propertyListingId = await getExistingPropertyListingId(mlsListing.id);

    console.log('EXISTING PROPERTY LISTING ID: ', propertyListingId);

    if (!propertyListingId) {
      if (!agentId) {
        agentId = await getOrCreateListingAgent(mlsListing, fallbackPhoneNumber);
      }

      propertyListingId = await createPropertyListing(mlsListing, agentId);

      console.log('CREATED PROPERTY LISTING ID: ', propertyListingId);

      await createPropertyListingImages(mlsListing.Media, propertyListingId);
    }

    const result = {
      property_listing_id: propertyListingId,
    };

    if (clientId) {
      const propertyOfInterestId = await createPropertyOfInterest(propertyListingId, clientId);

      result.property_of_interest_id = propertyOfInterestId;
      result.client_id = clientId;
    }

    return result;
  } catch (error) {
    console.error('Error sending invite to client: ', error);
    throw error;
  }
};

const getMlsListing = async listingId => {
  try {
    const listingTableName = await DynamoHelper.getListingTableName();

    const queryParams = {
      TableName: listingTableName,
      IndexName: 'byListingId',
      Limit: 1000,
      KeyConditionExpression: '#listingId = :listingId',
      ExpressionAttributeNames: {
        '#listingId': 'listing_id',
      },
      ExpressionAttributeValues: {
        ':listingId': listingId,
      },
    };

    const { results: matchingListings } = await DynamoHelper.queryDB(queryParams, 1000);

    if (matchingListings && matchingListings.length > 0) {
      return matchingListings[0];
    }

    throw new Error('no results returned');
  } catch (error) {
    console.error('Error getting MLS listing from Dynamo: ', error);

    throw new Error(
      'Error -- Could not find a matching property listing. Please add this home with the Custom Property Listing feature.'
    );
  }
};

const getExistingPropertyListingId = async listingKey => {
  const sql = `SELECT id FROM propertyListing WHERE listing_key = :listingKey;`;

  const { records } = await DBHelper.executeQuery(sql, { listingKey });

  if (Array.isArray(records) && records.length > 0) {
    return records[0].id;
  }

  return null;
};

const getOrCreateListingAgent = async (mlsListing, fallbackPhoneNumber) => {
  try {
    const {
      listing_agent: listingAgent,
      listing_agent_email: listingAgentEmail,
      listing_agent_phone: listingAgentPhone,
      list_agent_mobile_phone: listAgentMobilePhone,
    } = mlsListing;

    if (!listingAgentEmail) {
      throw new Error('Error -- Listing agent email address not available on the listing');
    }

    const createUserIfNotExistsInput = {
      is_listing_agent: true,
      email_address: listingAgentEmail,
    };

    if (listingAgent) {
      const fullName = listingAgent.split(' ');

      const firstName = fullName[0];
      const lastName = fullName[fullName.length - 1];

      if (firstName) {
        createUserIfNotExistsInput.first_name = firstName;
      }

      if (lastName) {
        createUserIfNotExistsInput.last_name = lastName;
      }
    }

    const realListingAgentPhone = listAgentMobilePhone || listingAgentPhone;

    if (realListingAgentPhone && process.env.ENV === 'production') {
      createUserIfNotExistsInput.cell_phone = realListingAgentPhone;
    } else if (realListingAgentPhone && fallbackPhoneNumber) {
      createUserIfNotExistsInput.cell_phone = fallbackPhoneNumber;
    }

    const { Payload: response } = await lambda
      .invoke({
        FunctionName: `createUserIfNotExists-${process.env.ENV}`,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          arguments: { createUserIfNotExistsInput },
        }),
      })
      .promise();

    const { id: agentId } = JSON.parse(response);

    if (!agentId) {
      throw new Error('Invalid agentId returned');
    }

    return agentId;
  } catch (error) {
    console.log('Error fetching listing agent information: ', error);

    throw new Error('Error -- There was an error processing the listing agent information for this property');
  }
};

const createPropertyListing = async (mlsListing, agentId) => {
  try {
    let { address, city, state, zip, latitude, longitude } = mlsListing;

    if (!address || !city || !state || !zip) {
      throw new Error('Error -- The listing contains an invalid address and the home could not be added');
    }

    if (address.includes(',')) {
      address = address.split(',')[0];
    }

    if (!latitude || !longitude) {
      ({ latitude, longitude } = await LocationHelper.geocodeAddress(`${address} ${city}, ${state} ${zip}`));
    }

    if (!latitude || !longitude) {
      throw new Error("Error -- Could not determine property's precise location");
    }

    const {
      id,
      listing_id,
      county,
      bathrooms,
      bathrooms_full,
      bedrooms,
      square_feet,
      square_feet_source,
      on_market_date,
      listing_price,
      association_fee,
      association_fee_frequency,
      lot_size,
      lot_size_units,
      last_updated,
      status,
      description,
      rented,
      association_yn,
      short_term_rental_permit_issued,
      elementary_school,
      middle_or_junior_school,
      high_school,
      tax_annual_amount,
      tax_year,
      tax_lot,
      tax_map_number,
      potential_tax_liability,
      assessment,
      senior_community_yn,
      community_features,
      appliances,
      cooling,
      heating,
      fireplace_features,
      flooring,
      interior_features,
      rooms,
      window_features,
      security_features,
      architectural_style,
      lot_features,
      parking_features,
      road_surface_types,
      view,
      common_walls,
      construction_materials,
      foundation_details,
      power_production_type,
      garage_yn,
      garage_spaces,
      source,
      originating_system_id,
      levels,
      basement_yn,
      roof,
      sewer,
      water_source,
      accessory_dwelling_unit,
      irrigation_water_rights,
      horse_yn,
      new_construction,
      parcel_number,
      additional_parcels_yn,
      subdivision_name,
      zoning_description,
      year_built,
      property_sub_type,

      original_list_price,
      special_listing_conditions,
      private_remarks,
      owner_name,
      occupant_type,
      audio_surveillance,
      video_surveillance,
      sign_on_property,
      listing_contract_date,
      purchase_contract_date,
      agency_represent,
      listing_agreement,
      buyer_agency_compensation,
      comission_type,
      listing_terms,
      showing_requirements,
      showing_instructions,
      preferred_escrow_company,
      listing_agent_state_license,
      listing_office_phone,
      listing_office,
      listing_office_license,
    } = mlsListing;

    const { insertId } = await DBHelper.executeQuery(
      `
        INSERT INTO propertyListing 
          (
            listing_agent_id,
            listing_id,
            listing_key,
            address, 
            city,
            county,
            state,
            zip,
            latitude,
            longitude,
            bedrooms,
            bathrooms,
            bathrooms_full,
            square_feet,
            square_feet_source,
            lot_size,
            listing_price,
            last_updated,
            status,
            elementary_school,
            middle_or_junior_school,
            high_school,
            tax_annual_amount,
            tax_year,
            tax_lot,
            tax_map_number,
            potential_tax_liability,
            assessment,
            garage_spaces,
            source,
            originating_system,
            levels,
            roof,
            sewer,
            water_source,
            on_market_date,
            parcel_number,
            subdivision_name,
            zoning,
            year_built,
            property_sub_type,
            association_fee,
            association_fee_frequency,
            description,

            rented,
            in_association,
            short_term_rental_permit_issued,
            senior_community,
            garage,
            horse_property,
            new_construction,
            accessory_dwelling_unit,
            basement,
            irrigation_water_rights,
            additional_parcels,

            appliances,
            cooling,
            heating,
            fireplace_features,
            flooring,
            interior_features,
            rooms,
            window_features,
            security_features,
            architectural_style,
            lot_features,
            community_features,
            parking_features,
            road_surface_types,
            view,
            common_walls,
            construction_materials,
            foundation_details,
            power_production_type,

            created_at,
            updated_at 
          ) 
          VALUES 
          (
            :listing_agent_id,
            :listing_id,
            :listing_key,
            :address, 
            :city,
            :county,
            :state,
            :zip,
            :latitude,
            :longitude,
            :bedrooms,
            :bathrooms,
            :bathrooms_full,
            :square_feet,
            :square_feet_source,
            :lot_size,
            :listing_price,
            :last_updated,
            :status,
            :elementary_school,
            :middle_or_junior_school,
            :high_school,
            :tax_annual_amount,
            :tax_year,
            :tax_lot,
            :tax_map_number,
            :potential_tax_liability,
            :assessment,
            :garage_spaces,
            :source,
            :originating_system,
            :levels,
            :roof,
            :sewer,
            :water_source,
            :on_market_date,
            :parcel_number,
            :subdivision_name,
            :zoning_description,
            :year_built,
            :property_sub_type,
            :association_fee,
            :association_fee_frequency,
            :description,

            :rented,
            :association_yn,
            :short_term_rental_permit_issued,
            :senior_community,
            :garage,
            :horse_property,
            :new_construction,
            :accessory_dwelling_unit,
            :basement,
            :irrigation_water_rights,
            :additional_parcels,

            :appliances,
            :cooling,
            :heating,
            :fireplace_features,
            :flooring,
            :interior_features,
            :rooms,
            :window_features,
            :security_features,
            :architectural_style,
            :lot_features,
            :community_features,
            :parking_features,
            :road_surface_types,
            :view,
            :common_walls,
            :construction_materials,
            :foundation_details,
            :power_production_type,

            UNIX_TIMESTAMP(),
            UNIX_TIMESTAMP() 
          )
      `,
      {
        listing_id,
        listing_key: id,
        listing_agent_id: agentId,
        address: stringifyArray(address),
        city: stringifyArray(city),
        county: stringifyArray(county),
        state: stringifyArray(state),
        zip: stringifyArray(zip),
        latitude,
        longitude,
        bedrooms: stringifyArray(bedrooms),
        bathrooms: stringifyArray(bathrooms),
        bathrooms_full: stringifyArray(bathrooms_full),
        square_feet: stringifyArray(square_feet),
        square_feet_source: stringifyArray(square_feet_source),
        lot_size: lot_size ? `${lot_size} ${lot_size_units}` : null,
        listing_price: stringifyArray(listing_price),
        last_updated: stringifyArray(last_updated),
        status: stringifyArray(status),
        elementary_school: stringifyArray(elementary_school),
        middle_or_junior_school: stringifyArray(middle_or_junior_school),
        high_school: stringifyArray(high_school),
        tax_annual_amount: stringifyArray(tax_annual_amount),
        tax_year: stringifyArray(tax_year),
        tax_lot: stringifyArray(tax_lot),
        tax_map_number: stringifyArray(tax_map_number),
        potential_tax_liability: stringifyArray(potential_tax_liability),
        assessment: stringifyArray(assessment),
        garage_spaces: stringifyArray(garage_spaces),
        source: stringifyArray(source),
        originating_system: stringifyArray(originating_system_id),
        on_market_date: stringifyArray(on_market_date),
        parcel_number: stringifyArray(parcel_number),
        subdivision_name: stringifyArray(subdivision_name),
        year_built: stringifyArray(year_built),
        property_sub_type: stringifyArray(property_sub_type),
        association_fee: stringifyArray(association_fee),
        association_fee_frequency: stringifyArray(association_fee_frequency),
        appliances: stringifyArray(appliances),
        cooling: stringifyArray(cooling),
        heating: stringifyArray(heating),
        fireplace_features: stringifyArray(fireplace_features),
        flooring: stringifyArray(flooring),
        interior_features: stringifyArray(interior_features),
        rooms: stringifyArray(rooms),
        window_features: stringifyArray(window_features),
        security_features: stringifyArray(security_features),
        architectural_style: stringifyArray(architectural_style),
        lot_features: stringifyArray(lot_features),
        community_features: stringifyArray(community_features),
        parking_features: stringifyArray(parking_features),
        road_surface_types: stringifyArray(road_surface_types),
        view: stringifyArray(view),
        common_walls: stringifyArray(common_walls),
        construction_materials: stringifyArray(construction_materials),
        foundation_details: stringifyArray(foundation_details),
        power_production_type: stringifyArray(power_production_type),
        levels: stringifyArray(levels),
        roof: stringifyArray(roof),
        sewer: stringifyArray(sewer),
        water_source: stringifyArray(water_source),
        zoning_description: stringifyArray(zoning_description),

        description: description || null,

        rented: getNullableBooleanValue(rented),
        association_yn: getNullableBooleanValue(association_yn),
        short_term_rental_permit_issued: getNullableBooleanValue(short_term_rental_permit_issued),
        senior_community: getNullableBooleanValue(senior_community_yn),
        garage: getNullableBooleanValue(garage_yn),
        horse_property: getNullableBooleanValue(horse_yn),
        new_construction: getNullableBooleanValue(new_construction),
        accessory_dwelling_unit: getNullableBooleanValue(accessory_dwelling_unit),
        basement: getNullableBooleanValue(basement_yn),
        irrigation_water_rights: getNullableBooleanValue(irrigation_water_rights),
        additional_parcels: getNullableBooleanValue(additional_parcels_yn),
      },
      true
    );

    await DBHelper.executeQuery(
      `
      INSERT INTO propertyListingAgentOnlyData (
        property_listing_id,
        private_remarks,
        owner_name,
        occupant_type,
        audio_surveillance,
        video_surveillance,
        sign_on_property,
        showing_requirements,
        showing_instructions,
        original_list_price,
        listing_contract_date,
        under_contract_date,
        agency_represent,
        listing_agreement,
        buyer_agency_compensation,
        commission_type,
        special_listing_conditions,
        listing_terms,
        preferred_escrow_company,
        listing_agent_state_license,
        listing_office,
        listing_office_license,
        listing_office_phone,

        created_at,
        updated_at
      ) 
      VALUES (
        :property_listing_id,
        :private_remarks,
        :owner_name,
        :occupant_type,
        :audio_surveillance,
        :video_surveillance,
        :sign_on_property,
        :showing_requirements,
        :showing_instructions,
        :original_list_price,
        :listing_contract_date,
        :purchase_contract_date,
        :agency_represent,
        :listing_agreement,
        :buyer_agency_compensation,
        :commission_type,
        :special_listing_conditions,
        :listing_terms,
        :preferred_escrow_company,
        :listing_agent_state_license,
        :listing_office,
        :listing_office_license,
        :listing_office_phone,
        
        UNIX_TIMESTAMP(),
        UNIX_TIMESTAMP()
      )
    `,
      {
        property_listing_id: insertId,
        private_remarks: private_remarks || null,
        original_list_price: stringifyArray(original_list_price),
        owner_name: stringifyArray(owner_name),
        occupant_type: stringifyArray(occupant_type),
        listing_contract_date: stringifyArray(listing_contract_date),
        purchase_contract_date: stringifyArray(purchase_contract_date),
        listing_agreement: stringifyArray(listing_agreement),
        buyer_agency_compensation: stringifyArray(buyer_agency_compensation),
        commission_type: stringifyArray(comission_type),
        preferred_escrow_company: stringifyArray(preferred_escrow_company),
        special_listing_conditions: stringifyArray(special_listing_conditions),
        listing_terms: stringifyArray(listing_terms),
        showing_requirements: stringifyArray(showing_requirements),
        showing_instructions: stringifyArray(showing_instructions),
        listing_agent_state_license: stringifyArray(listing_agent_state_license),
        listing_office: stringifyArray(listing_office),
        listing_office_license: stringifyArray(listing_office_license),
        listing_office_phone: stringifyArray(listing_office_phone),

        audio_surveillance: getNullableBooleanValue(audio_surveillance),
        video_surveillance: getNullableBooleanValue(video_surveillance),
        sign_on_property: getNullableBooleanValue(sign_on_property),
        agency_represent: getNullableBooleanValue(agency_represent),
      },
      true
    );

    return insertId;
  } catch (error) {
    console.error(`Error creating propertyListing and propertyListingAgentOnlyData: `, error);

    throw error;
  }
};

const createPropertyListingImages = async (media, propertyListingId) => {
  try {
    if (Array.isArray(media) && media.length > 0) {
      console.log('ADDING MEDIA...');
      const bucketName = `listhub-integration-bucket-${process.env.ENV}`;

      await Promise.all(
        media.map(async image => {
          try {
            const { LongDescription, MediaCategory, MediaKey, MediaURL, ShortDescription, IsPrimary } = image;

            const path = url.parse(MediaURL).pathname;
            const imageUrl = `https://s3.${process.env.REGION}.amazonaws.com/${bucketName}/media${path}`;

            const sql = `
              INSERT INTO propertyListingImage (
                property_listing_id, 
                long_description,
                media_category,
                media_key,
                media_url,
                short_description,
                is_primary,
                created_at,
                updated_at
              ) VALUES (
                :propertyListingId,
                :LongDescription,
                :MediaCategory,
                :MediaKey,
                :MediaURL,
                :ShortDescription,
                :IsPrimary,
                UNIX_TIMESTAMP(),
                UNIX_TIMESTAMP()
              )
            `;

            await DBHelper.executeQuery(sql, {
              propertyListingId,
              LongDescription: LongDescription || null,
              MediaCategory: MediaCategory || null,
              MediaKey: MediaKey || null,
              MediaURL: imageUrl || null,
              ShortDescription: ShortDescription || null,
              IsPrimary: !!IsPrimary,
            });
          } catch (error) {
            console.warn(`Error processing image - ${(image && image.media_key) || 'Unknown'}:`, error);
          }
        })
      );
    } else {
      console.log('No media to add for this property');
    }
  } catch (error) {
    console.error(`Error creating propertyListingImages for ${propertyListingId}: `, error);
  }
};

const createPropertyOfInterest = async (propertyListingId, clientId) => {
  try {
    console.log('ADDING PROPERTY OF INTEREST...');

    const sql = `
      INSERT INTO propertyOfInterest (
        property_listing_id,
        client_id,
        created_at,
        updated_at
      ) VALUES (
        :propertyListingId,
        :clientId,
        UNIX_TIMESTAMP(),
        UNIX_TIMESTAMP()
      )
    `;

    const { insertId } = await DBHelper.executeQuery(sql, { propertyListingId, clientId });

    return insertId;
  } catch (error) {
    console.error(
      `Error creating propertyOfInterest for propertyListing: ${propertyListingId}, clientId: ${clientId} -- `,
      error
    );

    throw error;
  }
};

const getNullableBooleanValue = value => {
  if (value !== null && value !== undefined) {
    return value ? 1 : 0;
  }

  return null;
};

const stringifyArray = data => {
  if (data === undefined || data === null) {
    return null;
  }

  if (Array.isArray(data)) {
    return data.join('|');
  }

  return data;
};
