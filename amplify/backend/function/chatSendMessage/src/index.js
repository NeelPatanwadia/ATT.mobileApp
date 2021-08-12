const DBHelper = require("./DBHelper");

exports.handler = async (event) => {
  try {
    var addedRecord = null;

    const { chatSendMessageInput } = event.arguments || {};

    var {
      property_listing_id,
      client_id,
      buying_agent_id,
      listing_agent_id,
      chat_title,
      message,
      sender_id,
      receiver_id,
      sender_name,
      send_time,
      chat_id,
    } = chatSendMessageInput;

    const sql = `
    INSERT INTO chatMessages (chat_id, sender_id, receiver_id, send_time, sender_name,message)
    VALUES (:chat_id, :sender_id, :receiver_id, :send_time, :sender_name,:message);
    `;

    if (
      !chat_id &&
      property_listing_id &&
      buying_agent_id &&
      listing_agent_id &&
      chat_title &&
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
      } else {
        const now = Number.parseInt(new Date().getTime(), 10) / 1000;
        const sqlAddNewChat = `
        INSERT INTO chats (chat_title, listing_agent_id, buying_agent_id, client_id, property_listing_id,created_at)
        VALUES (:chat_title, :listing_agent_id, :buying_agent_id, :client_id, :property_listing_id,:created_at);
        `;
        const result = await DBHelper.executeQuery(sqlAddNewChat, {
          chat_title,
          listing_agent_id,
          buying_agent_id,
          client_id,
          property_listing_id,
          created_at: now,
        });
        chat_id = result.insertId;
      }
    } else if (
      (!chat_id &&
        (!property_listing_id ||
          !buying_agent_id ||
          !listing_agent_id ||
          !chat_title ||
          !client_id)) ||
      (chat_id &&
        (property_listing_id ||
          buying_agent_id ||
          listing_agent_id ||
          chat_title ||
          client_id))
    ) {
      throw new Error(
        "Must have to pass (chat_id) OR (property_listing_id and buying_agent_id and listing_agent_id and chat_title and client_id)"
      );
    }

    if (chat_id) {
      const { insertId } = await DBHelper.executeQuery(sql, {
        chat_id,
        sender_id,
        receiver_id,
        send_time,
        sender_name,
        message,
      });
      return { id: insertId, receiver_id: receiver_id,chat_id:chat_id };
    } else {
      throw new Error("Something went to wrong");
    }
  } catch (error) {
    console.error("Error creating subscription: ", error);
    throw error;
  }
};
