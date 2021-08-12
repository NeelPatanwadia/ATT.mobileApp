import React, { useState, useContext, useEffect, useRef } from 'react';
import { TextInput, View, TouchableOpacity, ActivityIndicator, Image, Keyboard, Alert } from 'react-native';
import InputScrollView from 'react-native-input-scroll-view';
import Communications from 'react-native-communications';
import { NavigationEvents } from 'react-navigation';
import Modal from 'react-native-modal';
import { color, colors, tw } from 'react-native-tailwindcss';
import dateformat from 'dateformat';
import { FontAwesome5 } from '@expo/vector-icons';
import Swipeable from 'react-native-swipeable-row';
import {
  AgentModal,
  BodyText,
  PrimaryButton,
  PrimaryInput,
  SecondaryButton,
  MlsForm,
  CustomPill,
  Badge,
} from '../../components';
import { notificationService, propertyService, tourService, userService } from '../../services';
import { AddCircleIcon, PhoneIcon, ChatBubbleIcon, EditIcon } from '../../assets/images';
import AgentTabContext from '../../navigation/AgentTabContext';
import ClientContext from './ClientContext';
import ClientListingSelect from './ClientListingSelect';
import { logEvent, APP_REGIONS, EVENT_TYPES } from '../../helpers/logHelper';
import { buildCancelShowingRequest } from '../../notifications/messageBuilder';

const ClientsProfileForm = ({
  client,
  editable,
  updateCallback,
  deleteCallback,
  openEdit,
  closeEdit,
  openNotesEdit,
  closeNotesEdit,
  notesEditable,
  scrollContainer,
  navigation,
}) => {
  const lastNameField = useRef(null);
  const phoneNumberField = useRef(null);
  const notesField = useRef(null);

  const inputFields = { lastNameField, phoneNumberField };

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [notesFocused, setNotesFocused] = useState(false);
  const [clientFields, setClientFields] = useState({
    firstName: '',
    lastName: '',
    agentNotes: '',
    cellPhone: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    if (!editable) {
      setError('');
      setSaving(false);
      updateValuesFromClient();
    }
  }, [editable]);

  useEffect(() => {
    if (!editable) {
      return;
    }

    if (clientFields.firstName) {
      validateFirstName();
    }

    if (clientFields.lastName) {
      validateLastName();
    }

    if (clientFields.cellPhone) {
      validateCellPhone();
    }
  }, [editable, clientFields.firstName, clientFields.lastName, clientFields.cellPhone]);

  const focusInput = field => {
    inputFields[field].current.focus();
  };

  const validateFirstName = () => {
    if (!clientFields.firstName) {
      setValidationErrors(prevState => ({ ...prevState, firstName: 'First Name is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, firstName: '' }));

    return true;
  };

  const validateLastName = () => {
    if (!clientFields.lastName) {
      setValidationErrors(prevState => ({ ...prevState, lastName: 'Last Name is required' }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, lastName: '' }));

    return true;
  };

  const validateCellPhone = () => {
    if (!clientFields.cellPhone) {
      setValidationErrors(prevState => ({
        ...prevState,
        cellPhone: 'Cell Phone is required',
      }));

      return false;
    }

    setValidationErrors(prevState => ({ ...prevState, cellPhone: '' }));

    return true;
  };

  const updateClient = async () => {
    setSaving(true);

    if (!(validateFirstName() && validateLastName() && validateCellPhone())) {
      setSaving(false);

      return;
    }

    const updatedClient = {
      id: client.id,
      ...{ ...clientFields, agentNotes: client.agentNotes ? client.agentNotes : '' },
      // ...{ ...clientFields, agentNotes: clientFields.agentNotes ? clientFields.agentNotes.replace(/\n/g, '\\n') : '' },
    };

    try {
      const dbClient = await userService.mutations.updateUser(updatedClient);

      updateCallback(dbClient);
    } catch (error) {
      console.log('Error saving client profile: ', error);
      setError('Error saving profile');
      setSaving(false);
    }
  };

  const updateClientNotes = async () => {
    setSaving(true);
    const updatedClient = {
      id: client.id,
      ...{ ...clientFields, agentNotes: clientFields.agentNotes ? clientFields.agentNotes.replace(/\n/g, '\\n') : '' },
    };

    try {
      const dbClient = await userService.mutations.updateUser(updatedClient);

      setSaving(false);
      updateCallback(dbClient);
    } catch (error) {
      console.log('Error saving client profile: ', error);
      setError('Error saving profile');
      setSaving(false);
    }
  };

  const deleteClient = async () => {
    setDeleting(true);

    await userService.mutations
      .unassociateClientFromAgent(client.id)
      .then(dbClient => {
        setDeleting(false);
        navigation.navigate('AgentClients');
        deleteCallback(dbClient);
      })
      .catch(error => {
        console.log('Error removing client: ', error);
        setDeleting(false);
      });
  };

  const setClientField = (field, value) => {
    setClientFields(prevState => ({ ...prevState, [field]: value }));
  };

  const updateValuesFromClient = () => {
    setClientFields({
      firstName: client ? client.firstName || '' : '',
      lastName: client ? client.lastName || '' : '',
      agentNotes: client ? client.agentNotes || '' : '',
      cellPhone: client ? client.cellPhone || '' : '',
    });

    setValidationErrors({
      firstName: '',
      lastName: '',
      cellPhone: '',
    });
  };

  const editButtons = () => {
    if (!editable) {
      return (
        <TouchableOpacity onPress={openEdit}>
          <EditIcon width={22} height={22} />
        </TouchableOpacity>
      );
    }

    if (saving) {
      return <ActivityIndicator size="small" color={colors.gray500} />;
    }

    return (
      <View style={[tw.flexRow]}>
        <TouchableOpacity onPress={closeEdit} style={[tw.mR4]} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
          <FontAwesome5 name="times-circle" style={[tw.textGray700, tw.text2xl]} />
        </TouchableOpacity>

        <TouchableOpacity onPress={updateClient} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
          <FontAwesome5 name="check-circle" style={[tw.textBlue500, tw.text2xl]} />
        </TouchableOpacity>
      </View>
    );
  };

  const notesEditButton = () => {
    if (!notesEditable) {
      return (
        <TouchableOpacity onPress={openNotesEdit}>
          <EditIcon width={22} height={22} />
        </TouchableOpacity>
      );
    }

    if (saving) {
      return <ActivityIndicator size="small" color={colors.gray500} />;
    }

    return (
      <View style={[tw.flexRow]}>
        <TouchableOpacity onPress={closeNotesEdit} style={[tw.mR4]} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
          <FontAwesome5 name="times-circle" style={[tw.textGray700, tw.text2xl]} />
        </TouchableOpacity>

        <TouchableOpacity onPress={updateClientNotes} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
          <FontAwesome5 name="check-circle" style={[tw.textBlue500, tw.text2xl]} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <View style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.borderB, tw.borderGray300, tw.pB2, tw.pR4, tw.mT12]}>
        <BodyText bold style={[tw.textBlue500, tw.mR4]}>
          Profile
        </BodyText>
        {editButtons()}
      </View>
      <View style={[tw.mB8]}>
        <BodyText style={[tw.mL2, tw.mT6]}>First Name</BodyText>
        <PrimaryInput
          placeholder=""
          autoCapitalize="words"
          onChangeText={newFirstName => setClientField('firstName', newFirstName)}
          value={clientFields.firstName}
          editable={editable}
          onBlur={validateFirstName}
          errorMessage={validationErrors.firstName}
          returnKeyType="next"
          onSubmitEditing={() => focusInput('lastNameField')}
        />
        <BodyText style={[tw.mL2, tw.mT6]}>Last Name</BodyText>
        <PrimaryInput
          placeholder=""
          autoCapitalize="words"
          onChangeText={newLastName => setClientField('lastName', newLastName)}
          value={clientFields.lastName}
          editable={editable}
          onBlur={validateLastName}
          errorMessage={validationErrors.lastName}
          onSubmitEditing={() => Keyboard.dismiss()}
          ref={lastNameField}
        />

        <BodyText style={[tw.mL2, tw.mT6]}>Email Address</BodyText>
        <PrimaryInput placeholder="" value={client ? client.emailAddress : ''} editable={false} />

        <BodyText style={[tw.mL2, tw.mT6]}>Cell Phone</BodyText>
        <PrimaryInput
          placeholder=""
          onBlur={validateCellPhone}
          value={client ? client.cellPhone : ''}
          editable={false}
        />

        <View style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.borderB, tw.borderGray300, tw.pB2, tw.mT8]}>
          <BodyText bold style={[tw.textBlue500, tw.mR4]}>
            Notes
          </BodyText>
          {notesEditButton()}
        </View>

        <TextInput
          multiline
          maxLength={255}
          editable={notesEditable}
          placeholder={notesEditable ? 'Enter client notes here' : ''}
          scrollEnabled={false}
          onContentSizeChange={() => (notesEditable ? scrollContainer.scrollToEnd() : null)}
          onChangeText={newNotes => setClientField('agentNotes', newNotes)}
          value={clientFields.agentNotes}
          onFocus={() => setNotesFocused(true)}
          onBlur={() => setNotesFocused(false)}
          style={[
            tw.textXl,
            tw.borderGray300,
            tw.mT2,
            notesEditable ? tw.textGray800 : tw.textGray600,
            notesEditable !== false ? tw.borderB : null,
            notesFocused !== false ? tw.pB20 : tw.pB2,
          ]}
          ref={notesField}
        />
      </View>

      {error ? (
        <View style={[tw.justifyCenter]}>
          <BodyText center style={[tw.textBlue500, tw.mB2]}>
            {error}
          </BodyText>
        </View>
      ) : null}

      {editable && (
        <View style={[tw.flexRow, tw.pX4]}>
          <View style={[tw.inline, tw.flex1, tw.selfCenter, tw.justifyCenter]}>
            <AgentModal
              trigger={<SecondaryButton textStyle={[tw.textRed500, tw.mB4]} title="Delete Client" />}
              navigation={navigation}
              title="Delete Client"
            >
              <BodyText style={[tw.mT8, tw.text2xl, tw.selfCenter]}>
                Are you sure you want to delete this client?
              </BodyText>
              <BodyText
                style={[tw.text2xl, tw.mY8, tw.selfCenter]}
              >{`${client.firstName} ${client.lastName}`}</BodyText>

              <View style={[tw.flexRow, tw.justifyAround]}>
                <View style={[tw.inline, tw.w1_2, tw.pR1]}>
                  <SecondaryButton
                    title="Cancel"
                    onPress={() => navigation.goBack(null)}
                    style={[tw.border2, tw.borderGray700]}
                  />
                </View>

                <View style={[tw.inline, tw.w1_2, tw.pL1, tw.mT2]}>
                  <PrimaryButton title="Delete" onPress={deleteClient} style={[tw.bgRed500]} loading={deleting} />
                </View>
              </View>
            </AgentModal>
          </View>
        </View>
      )}
    </>
  );
};

const ClientDetails = ({ navigation, screenProps: { user, newMessages } }) => {
  const scrollContainer = useRef(null);
  const { client, clients, setClients, propertyOfInterest, setClient } = useContext(ClientContext);

  const [tours, setTours] = useState([]);
  const [propertiesOfInterest, setPropertiesOfInterest] = useState([]);
  const [propertyListings, setPropertyListings] = useState([]);
  const [editingClient, setEditingClient] = useState(false);
  const { setNavigationParams } = useContext(AgentTabContext);
  const [openMLSForm, setOpenMLSForm] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [removeProperty, setRemoveProperty] = useState({});
  const [removeTourLoading, setRemoveTourLoading] = useState({});
  const [propertyAdding, setPropertyAdding] = useState({});

  useEffect(() => {
    listPropertiesOfInterest();
    listPropertyListings();
    listClientTours();
  }, [propertyOfInterest]);

  useEffect(() => {
    if (editingClient && editingNotes && scrollContainer.current) {
      scrollContainer.current.scrollToEnd({ animated: true });
    }
  }, [editingClient, editingNotes]);

  useEffect(() => {
    setEditingClient(false);
    setEditingNotes(false);
  }, [client]);

  const listPropertiesOfInterest = async () => {
    try {
      let pois = await propertyService.queries.listPropertiesOfInterest({ clientId: client.id });
      const lastVisitedPois = await propertyService.queries.listLastvisitedPropertyOfInterest({ clientId: client.id });

      for (let i = 0; i < pois.length; i++) {
        for (let j = 0; j < lastVisitedPois.length; j++) {
          if (pois[i].propertyListingId === lastVisitedPois[j].propertyListingId) {
            if (lastVisitedPois[j].listingAgentFirstName)
              pois[i].listingAgent = {
                firstName: lastVisitedPois[j].listingAgentFirstName,
                lastName: lastVisitedPois[j].listingAgentLastName,
              };
            if (lastVisitedPois[j].startTime) pois[i].lastTouredTime = lastVisitedPois[j].startTime;
          }
        }
      }
      pois = pois.sort((a, b) => (b.createdAt < a.createdAt ? -1 : 1));
      setPropertiesOfInterest(pois);
    } catch (error) {
      console.log('Error getting properties of interest: ', error);
    }
  };

  const listPropertyListings = async () => {
    try {
      const clientListings = await propertyService.queries.listPropertyListings({ sellerId: client.id });

      setPropertyListings(clientListings || []);
    } catch (error) {
      console.log('Error getting properties listings: ', error);
    }
  };

  const listClientTours = async () => {
    try {
      const clientTours = await tourService.queries.listTours({ clientId: client.id });

      setTours(clientTours);
    } catch (error) {
      console.log('Error getting client tours: ', error);
    }
  };

  const onAddProperty = newProperty => {
    if (newProperty) {
      listPropertiesOfInterest();
    }

    setOpenMLSForm(false);
  };

  const openCallLink = () => {
    try {
      const cleanPhone = client.cellPhone.replace(/\D/g, '');

      Communications.phonecall(cleanPhone, true);
    } catch (error) {
      logEvent({
        message: `Error Opening Call Screen for Client ${client.id}: ${JSON.stringify(error)}`,
        appRegion: APP_REGIONS.AGENT_UI,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const openSMSLink = () => {
    try {
      const cleanPhone = client.cellPhone.replace(/\D/g, '');

      Communications.text(cleanPhone, '');
    } catch (error) {
      logEvent({
        message: `Error Opening SMS Screen for Client ${client.id}: ${JSON.stringify(error)}`,
        appRegion: APP_REGIONS.AGENT_UI,
        eventType: EVENT_TYPES.ERROR,
      });
    }
  };

  const clientHeader = (
    <View style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.mT12]}>
      <BodyText style={[tw.text2xl]}>{`${client.firstName} ${client.lastName}`}</BodyText>
      <View style={[tw.flexRow, tw.itemsCenter, tw.pR4]}>
        <TouchableOpacity
          onPress={openCallLink}
          style={[tw.mL6]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <PhoneIcon width={18} height={18} fill={color.gray700} />
        </TouchableOpacity>
        <TouchableOpacity onPress={openSMSLink} style={[tw.mL6]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChatBubbleIcon width={22} height={22} fill={color.gray700} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const removeTour = async tour => {
    setRemoveTourLoading(prevState => ({ ...prevState, [tour.id]: true }));
    if (tour.status === 'complete') {
      deleteTourAndTourStops(tour.id);
    } else {
      const tourStopsObject = await tourService.queries.getTourStopOfCompletedTour(tour.id);
      const tourStops = Object.keys(tourStopsObject).map(e => tourStopsObject[e]);

      if (tourStops.length > 0) {
        Alert.alert(
          'Approve home warning',
          `One or more homes on this Tour have an approved showing request. If you click Continue, the Listing Agents for these showings will receive a message that the showing has been cancelled.`,
          [
            {
              text: 'Continue',
              onPress: () => sendTextMessage(tour.id, tourStops),
            },
            {
              text: 'Cancel',
              onPress: () => setRemoveTourLoading(prevState => ({ ...prevState, [tour.id]: false })),
            },
          ]
        );
      } else {
        deleteTourAndTourStops(tour.id);
      }
    }
  };

  const sendTextMessage = async (id, tourStops) => {
    await Promise.all(
      tourStops.map(async ts => {
        const { push, sms, email } = buildCancelShowingRequest({
          address: ts.propertyAddress.includes(',') ? ts.propertyAddress.split(',')[0] : ts.propertyAddress,
        });

        if (ts.status === 'approved' && ts.listingAgent && ts.listingAgent.cellPhone) {
          try {
            return notificationService.mutations.createNotification({
              userId: ts.listingAgent.id,
              pushMessage: push,
              smsMessage: sms,
              email,
            });
          } catch (error) {
            console.log('error', error);
            setRemoveTourLoading(prevState => ({ ...prevState, [id]: false }));

            return false;
          }
        }
      })
    );
    await deleteTourAndTourStops(id);
  };

  const deleteTourAndTourStops = async tourId => {
    const res = await tourService.mutations.deleteTourAndReferences(tourId);

    if (res && res.tourId) {
      setTours(tours.filter(t => t.id !== tourId));
    }
    setRemoveTourLoading(prevState => ({ ...prevState, [tourId]: false }));
  };

  const selectTour = async selectedTour => {
    navigation.push('TourDetails', { selectedTourId: selectedTour.id, selectedTour, isFrom: 'ClientDetails' });
  };

  const tourListItems = tours.map((tour, idx) => {
    const tourDate = dateformat(tour.startTime * 1000, 'mm/dd');

    return (
      <Swipeable
        key={tour.id}
        rightButtons={[
          <TouchableOpacity
            onPress={() => removeTour(tour)}
            style={[tw.w20, tw.hFull, tw.flexCol, tw.itemsCenter, tw.justifyCenter, tw.bgRed500, tw.mL4]}
            disabled={removeTourLoading[tour.id]}
          >
            {removeTourLoading[tour.id] ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <FontAwesome5 name="trash" color="white" style={[tw.text2xl]} />
            )}
          </TouchableOpacity>,
        ]}
      >
        <TouchableOpacity
          onPress={() => selectTour(tour)}
          key={`tour-${idx}`}
          style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.h12, tw.borderB, tw.borderGray300]}
        >
          <BodyText style={[tw.flex1]}>{tour.name}</BodyText>
          <BodyText style={[tw.mR4, tw.textRight]}>{tourDate}</BodyText>
        </TouchableOpacity>
      </Swipeable>
    );
  });

  const toursList = (
    <View style={[tw.wFull, tw.mT12]}>
      <View
        style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.pB2, tw.pR4]}
      >
        <BodyText bold style={[tw.textBlue500]}>
          Tours
        </BodyText>
        <TouchableOpacity
          onPress={() => navigation.navigate('NewTourClientSelect', { clientIdFromProfile: client.id })}
        >
          <AddCircleIcon width={22} height={22} fill={color.blue500} />
        </TouchableOpacity>
      </View>
      {tourListItems}
    </View>
  );

  const onRemovePropertyOfInterest = async poi => {
    setRemoveProperty(prevState => ({ ...prevState, [poi.id]: true }));
    const res = await propertyService.queries.checkIfPropertyOfInterestHasUpcomingTours(poi.id);

    if (res.isInUpcomingTour) {
      Alert.alert(
        '',
        `This home is currently included in an Upcoming Tour for this client. You must first remove this home from the Upcoming Tour in order to remove it from this clients' Homes of Interest.`
      );
      setRemoveProperty(prevState => ({ ...prevState, [poi.id]: false }));
    } else {
      removePropertyOfInterest(poi);
    }
  };

  const removePropertyOfInterest = async poi => {
    const res = await propertyService.mutations.deleteHomeOfInterestAndReference(poi.id);

    if (res.propertyOfInterestId) {
      const pois = propertiesOfInterest.filter(prop => prop.id !== poi.id);

      setPropertiesOfInterest(pois);
    }
    setRemoveProperty(prevState => ({ ...prevState, [poi.id]: false }));
  };

  const onReAddProperty = async property => {
    setPropertyAdding(prevState => ({ ...prevState, [property.id]: true }));
    try {
      await propertyService.mutations.updatePropertyOfInterest({
        id: property.id,
        seen_by_client: false,
        active_for_client: true,
      });

      await listPropertiesOfInterest();
    } catch (error) {
      console.log('Error removing property', error);
    }

    setPropertyAdding(prevState => ({ ...prevState, [property.id]: false }));
  };

  const homesListItems = propertiesOfInterest.map((prop, idx) => {
    let showMessageBadge = false;
    const {
      clientId,
      propertyListing: { id: propertyLisitingId },
    } = prop;

    if (newMessages && newMessages.length > 0) {
      const clientUnreadMessage = newMessages.find(
        x => x.clientId === clientId && x.propertyListingId === propertyLisitingId
      );

      if (clientUnreadMessage && clientUnreadMessage.clientId) {
        showMessageBadge = true;
      }
    }

    return (
      <Swipeable
        key={prop.id}
        rightButtons={[
          <TouchableOpacity
            onPress={() => onRemovePropertyOfInterest(prop)}
            style={[tw.w20, tw.hFull, tw.flexCol, tw.itemsCenter, tw.justifyCenter, tw.bgRed500, tw.mL4]}
            disabled={removeProperty[prop.id]}
          >
            {removeProperty[prop.id] ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <FontAwesome5 name="trash" color="white" style={[tw.text2xl]} />
            )}
          </TouchableOpacity>,
        ]}
      >
        <View
          key={`property-of-interest-${idx}`}
          style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.mY1, tw.borderB, tw.borderGray300]}
        >
          <View style={[tw.flexCol, tw.itemsCenter, tw.justifyCenter, tw.mR2]}>
            {showMessageBadge && <Badge noCountNeeded md />}
          </View>
          {prop.mediaUrl ? (
            <Image style={[tw.h16, tw.w16, tw.mR1, tw.mB1]} source={{ uri: prop.mediaUrl }} resizeMode="contain" />
          ) : (
            <View style={[tw.h16, tw.w16, tw.mR1, tw.mB1, tw.itemsCenter, tw.justifyCenter, tw.bgBlue100]}>
              <BodyText center sm>
                No Images
              </BodyText>
            </View>
          )}
          <TouchableOpacity
            style={[tw.flexRow, tw.flex1, tw.justifyBetween]}
            onPress={() =>
              navigation.navigate('AgentHomeDetails', {
                propertyOfInterestId: prop.id,
              })
            }
          >
            <View style={[tw.flex1, tw.pY1, tw.justifyCenter]}>
              <BodyText>{`${
                prop.propertyListing.address.includes(',')
                  ? prop.propertyListing.address.split(',')[0]
                  : prop.propertyListing.address
              }, ${prop.propertyListing.zip}`}</BodyText>
              {prop.listingAgent && prop.listingAgent.firstName && prop.listingAgent.lastName && (
                <BodyText bold>{`Listing Agent - ${prop.listingAgent &&
                  prop.listingAgent.firstName} ${prop.listingAgent && prop.listingAgent.lastName}`}</BodyText>
              )}
              {prop.lastTouredTime && (
                <BodyText bold>{`Toured on ${dateformat(prop.lastTouredTime * 1000, 'mmm dd, yyyy')}`}</BodyText>
              )}
            </View>
            <View style={[tw.justifyCenter, tw.itemsCenter]}>
              {prop && prop.propertyListing && prop.propertyListing.isCustomListing ? (
                <CustomPill containerStyle={[tw.h6, tw.justifyCenter, tw.pY0, tw.mY1]} />
              ) : null}
              {prop && !prop.activeForClient && (
                <PrimaryButton
                  key={prop.id}
                  style={[tw.w20, tw.h8]}
                  title="RE-ADD"
                  loadingTitle="ADDING"
                  hideIndicator
                  onPress={() => onReAddProperty(prop)}
                  loading={propertyAdding[prop.id]}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Swipeable>
    );
  });

  const homesOfInterestList = (
    <View style={[tw.wFull, tw.mT12]}>
      <View
        style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.pB2, tw.pR4]}
      >
        <BodyText bold style={[tw.textBlue500]}>
          Homes of Interest
        </BodyText>
        <TouchableOpacity onPress={() => setOpenMLSForm(true)}>
          <AddCircleIcon width={22} height={22} fill={color.blue500} />
        </TouchableOpacity>
        {client && openMLSForm && (
          <Modal isVisible={openMLSForm} onBackdropPress={() => setOpenMLSForm(false)}>
            <MlsForm
              title="Add Home of Interest"
              client={client}
              successCallback={onAddProperty}
              throwOnDuplicate
              closeModal={() => setOpenMLSForm(false)}
              user={user}
              onAddCustom={() => {
                listPropertiesOfInterest();
                navigation.pop();
              }}
            />
          </Modal>
        )}
      </View>
      {homesListItems}
    </View>
  );

  const listedHomeItems = propertyListings.map((prop, idx) => (
    <View
      key={`property-listing-${idx}`}
      style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.mY1, tw.borderB, tw.borderGray300]}
    >
      {prop.mediaUrl ? (
        <Image style={[tw.h16, tw.w16, tw.mR1, tw.mB1]} source={{ uri: prop.mediaUrl }} resizeMode="contain" />
      ) : (
        <View style={[tw.h16, tw.w16, tw.mR1, tw.mB1, tw.itemsCenter, tw.justifyCenter, tw.bgBlue100]}>
          <BodyText center sm>
            No Images
          </BodyText>
        </View>
      )}
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('AgentHomeDetails', {
            propertyListingId: prop.id,
          })
        }
        style={[tw.flexRow, tw.wFull, tw.justifyBetween]}
      >
        <BodyText>{`${prop.address.includes(',') ? prop.address.split(',')[0] : prop.address}, ${prop.zip}`}</BodyText>
      </TouchableOpacity>
    </View>
  ));

  const listedHomesList = (
    <View style={[tw.wFull, tw.mT12]}>
      <View
        style={[tw.wFull, tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.borderB, tw.borderGray300, tw.pB2, tw.pR4]}
      >
        <BodyText bold style={[tw.textBlue500]}>
          Homes for Sale
        </BodyText>
        <AgentModal
          title="Select a Listing"
          trigger={
            <TouchableOpacity>
              <AddCircleIcon width={22} height={22} fill={color.blue500} />
            </TouchableOpacity>
          }
          navigation={navigation}
        >
          <ClientListingSelect client={client} refreshClientListings={listPropertyListings} user={user} />
        </AgentModal>
      </View>
      {listedHomeItems}
    </View>
  );

  const onClientUpdate = dbClient => {
    const updatedClients = clients.map(mapClient => (mapClient.id === dbClient.id ? dbClient : mapClient));

    setClient(dbClient);
    setClients(updatedClients);
  };

  const onClientDelete = dbClient => {
    const updatedClients = [];

    for (const mapClient of clients) {
      if (mapClient.id !== dbClient.id) updatedClients.push(mapClient);
    }

    setClients(updatedClients);
  };

  return (
    <InputScrollView style={[tw.wFull, tw.hFull, tw.bgPrimary]} ref={scrollContainer} keyboardOffset={200}>
      <NavigationEvents
        onWillFocus={() =>
          setNavigationParams({
            headerTitle: 'Client Details',
            showBackBtn: true,
            showSettingsBtn: true,
          })
        }
      />
      <View style={[tw.pX4]}>
        {clientHeader}
        {homesOfInterestList}
        {toursList}
        {listedHomesList}
        <ClientsProfileForm
          client={client}
          editable={editingClient}
          notesEditable={editingNotes}
          clients={clients}
          openEdit={() => setEditingClient(true)}
          closeEdit={() => setEditingClient(false)}
          openNotesEdit={() => setEditingNotes(true)}
          closeNotesEdit={() => setEditingNotes(false)}
          updateCallback={onClientUpdate}
          deleteCallback={onClientDelete}
          scrollContainer={scrollContainer.current}
          navigation={navigation}
        />
      </View>
    </InputScrollView>
  );
};

export default ClientDetails;
