const customOnCreateTourStopMessage = `subscription customOnCreateTourStopMessage {
  customOnCreateTourStopMessage(tour_stop_id: $tour_stop_id, conversation_key: $conversation_key) {
    id
    from_user
    to_user
    status
    start_time
    message
    tour_stop_id
    created_at
    updated_at
  }
}
`;

const customOnCreateUserMessage = `subscription customOnCreateUserMessage {
  customOnCreateUserMessage(conversation_key: $conversation_key) {
    id
    from_user
    to_user
    status
    start_time
    message
    tour_stop_id
    created_at
    updated_at
  }
}
`;

export { customOnCreateTourStopMessage, customOnCreateUserMessage };
