const DBHelper = require("./DBHelper");
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
    console.log('EVENT: ', event);
    let userId;
    try {

        const { adminGrantSubscriptionInput } = event.arguments || {};
        const { 
            user_id,
            platform,
            expires_at: expiresAt
        } = adminGrantSubscriptionInput;

        userId = user_id;

        if (!userId || !platform || !expiresAt) {
            throw new Error('user_id, platform, expires_at are required');
        }

        const { subscription_id: existingSubId } = await checkForExistingSub(userId);

        if (existingSubId) {
            throw new Error('Subscription already exists')
        }

        const { original_order_id: originalOrderId, id: subscriptionId } = await createSubscription(userId, platform);
        return await createSubscriptionReceipt(originalOrderId, subscriptionId, expiresAt);
    } catch (error) {
        console.error(`Error creating a subscription for user ${userId}:`, error.message);
        throw error;
    }
};

  const createSubscription = async (userId, platform) => {
    const sql = `
      INSERT INTO subscription (user_id, original_order_id, platform, insert_uuid, created_at, updated_at) 
      VALUES (:userId, :originalOrderId, :platform, :uuid, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
    `;
  
    try {
        const now = Number.parseInt(new Date().getTime(), 10) / 1000;
        const uuid = uuidv4();

        const { insertId } = await DBHelper.executeQuery(sql, { userId, originalOrderId: `manual_${userId}`, createdAt: now, platform, uuid });

        await DBHelper.executeQuery('UPDATE user SET subscription_id = :subscriptionId, updated_at = UNIX_TIMESTAMP() WHERE id = :userId', { subscriptionId: insertId, userId });

        const { records } = await DBHelper.executeQuery('SELECT * FROM subscription WHERE id = :id', { id: insertId });

        return records[0];
    } catch (error) {
        console.error('Could not create a manual subscription', error);
        throw error;
    }
  
  };

const createSubscriptionReceipt = async (originalOrderId, subscriptionId, expiresAt) => {
    const sql = `
        INSERT INTO subscriptionReceipt (subscription_id, product_id, order_id, purchase_state, purchased_at, expires_at, expected_to_renew, is_trial, created_at, updated_at, receipt, insert_uuid)
        VALUES (:subscriptionId, :productId, :orderId, :purchaseState, :purchasedAt, :expiresAt, :expectedToRenew, :isTrial, :createdAt, UNIX_TIMESTAMP(), :receipt, :uuid);
    `

    try {
        const now = Number.parseInt(new Date().getTime(), 10) / 1000;
        const uuid = uuidv4();
        const { insertId } = await DBHelper.executeQuery(sql, {
            subscriptionId: subscriptionId,
            productId: 'manual_annual_subscription',
            orderId: originalOrderId,
            purchaseState: 'MANUAL',
            purchasedAt: now,
            expiresAt,
            expectedToRenew: false,
            isTrial: 0,
            createdAt: now,
            receipt: `manualReceipt_${uuid}`,
            uuid
        });

        const { records } = await DBHelper.executeQuery('SELECT * FROM subscriptionReceipt WHERE id = :id', {id: insertId});

        return records[0];
    } catch(error) {
        console.error(`Could not create a manual subscription receipt for subscription_id: ${subscriptionId}`, error)
    }
}

const checkForExistingSub = async (userId) => {
    const { records } = await DBHelper.executeQuery('SELECT subscription_id FROM user WHERE id = :userId LIMIT 0, 1', { userId });
    return records[0];
}