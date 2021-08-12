const DBHelper = require("./DBHelper");

exports.handler = async (event) => {
  try {
    const { chatGetMessagesInput } = event.arguments || {};

    var {
      listing_agent_id,
      property_listing_id,
      buying_agent_id,
      client_id,
      chat_id,
      user_id,
    } = chatGetMessagesInput;

    if (
      !chat_id &&
      property_listing_id &&
      buying_agent_id &&
      listing_agent_id &&
      client_id
    ) {
      const { records } = await DBHelper.executeQuery(
        "SELECT id FROM chats WHERE property_listing_id = :property_listing_id AND buying_agent_id=:buying_agent_id AND listing_agent_id=:listing_agent_id AND client_id=:client_id",
        {
          property_listing_id,
          buying_agent_id,
          client_id,
          listing_agent_id,
        }
      );
      if (Array.isArray(records) && records.length > 0) {
        console.log(records[0]);
        chat_id = records[0].id;
      }
    } else if (
      (!chat_id &&
        (!property_listing_id ||
          !buying_agent_id ||
          !listing_agent_id ||
          !client_id)) ||
      (chat_id &&
        (property_listing_id ||
          buying_agent_id ||
          listing_agent_id ||
          client_id))
    ) {
      throw new Error(
        "Must have to pass (chat_id) OR (property_listing_id and buying_agent_id and listing_agent_id and chat_title and client_id)"
      );
    }
    if (chat_id) {
      await DBHelper.executeQuery(
        "UPDATE chatMessages SET seen_by_receiver = 1 WHERE chat_id=:chat_id AND receiver_id=:user_id",
        {
          chat_id,
          user_id,
        }
      );
      const { records } = await DBHelper.executeQuery(
        "SELECT id as message_id,chat_id,sender_id,receiver_id,sender_name,send_time,message,seen_by_receiver FROM chatMessages WHERE chat_id=:chat_id",
        {
          chat_id,
        }
      );
      return records;
    } else {
      throw new Error("Something went to wrong");
    }
  } catch (error) {
    console.error("Error creating subscription: ", error);
    throw error;
  }
};
