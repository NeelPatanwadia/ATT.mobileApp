const DBHelper = require('./DBHelper');
const ReceiptHelper = require('./ReceiptHelper');

exports.handler = async event => {
  try {
    console.log('EVENT: ', event);

    const { createSubscriptionInput } = event.arguments || {};

    var {
      user_id: userId,
      purchase_state: purchaseState,
      product_id: providedProductId,
      receipt,
      platform,
      purchased_At: providedPurchasedAt,
      expires_At: providedExpiresAt,
      is_Trial: isTrialed,
      is_restore: isRestore,
    } = createSubscriptionInput;
    var productId, purchasedAt, expiresAt, originalOrderId, orderId, isTrial, latestReceipt, isRecurring;

    if (platform === 'web') {
      productId = providedProductId;
      purchasedAt = Number(providedPurchasedAt);
      expiresAt = Number(providedExpiresAt);
      originalOrderId = receipt;
      orderId = receipt;
      isTrial = isTrialed;
      latestReceipt = receipt;
      isRecurring = 1;
    }
    else if (platform === 'ios') {
      var processreceipt = await ReceiptHelper.processIOSReceipt(receipt);
      productId = processreceipt.productId;
      purchasedAt = processreceipt.purchasedAt;
      expiresAt = processreceipt.expiresAt;
      originalOrderId = processreceipt.originalOrderId;
      orderId = processreceipt.orderId;
      isTrial = processreceipt.isTrial;
      latestReceipt = processreceipt.latestReceipt;
      isRecurring = 0; // added for stripe by renis
    }
    else {
      var processreceipt = ReceiptHelper.processAndroidPurchaseToken(receipt, providedProductId);;
      productId = processreceipt.productId;
      purchasedAt = processreceipt.purchasedAt;
      expiresAt = processreceipt.expiresAt;
      originalOrderId = processreceipt.originalOrderId;
      orderId = processreceipt.orderId;
      isTrial = processreceipt.isTrial;
      latestReceipt = processreceipt.latestReceipt;
      isRecurring = 0; // added for stripe by renis
    }

    if (expiresAt < ((Number.parseInt(new Date().getTime())))) {
      console.log("ALREADY EXPIRED --  Expires At: ", expiresAt, ', Current Time: ', Number.parseInt(new Date().getTime()));
      throw new Error('Error -- This subscription has already expired');
    }

    let subscription = await checkForExistingSubscription(originalOrderId);

    if (!subscription) {
      subscription = await createSubscription({ userId, originalOrderId, platform, isRecurring });
    }

    const existingReceipt = await checkForExistingReceipt(orderId, subscription.id);

    if (!existingReceipt) {
      await insertSubscriptionReceipt({
        subscriptionId: subscription.id,
        productId,
        orderId,
        purchasedAt,
        expiresAt,
        purchaseState,
        receipt: latestReceipt || receipt,
        isTrial,
      });
    } else if ((existingReceipt.expires_at * 1000) < expiresAt) {
      console.log("Receipt already in db but expiration changed, updating subscriptionReceipt: ", existingReceipt.id);

      await updateSubscriptionReceipt({ id: existingReceipt.id, receipt: latestReceipt || receipt, expiresAt });
    }

    if (isRestore && subscription.user_id !== userId) {
      await setUserOnSubscription(userId, subscription.id);
    }

    const expirationDate = Number.parseInt(new Date(parseInt(expiresAt)).getTime());

    return {
      user_id: userId,
      is_active: expirationDate > Number.parseInt(new Date().getTime()),
      subscription: {
        id: subscription.id,
        user_id: userId,
        original_order_id: subscription.original_order_id,
        created_at: subscription.created_at,
      },
      is_recurring: subscription.is_recurring
    };
  } catch (error) {
    console.error('Error creating subscription: ', error);
    throw error;
  }
};

const checkForExistingSubscription = async originalOrderId => {
  const { records } = await DBHelper.executeQuery(
    'SELECT * FROM subscription WHERE original_order_id = :originalOrderId ORDER BY id DESC',
    {
      originalOrderId,
    }
  );

  if (Array.isArray(records) && records.length > 0) {
    return records[0];
  }

  return null;
};

const createSubscription = async ({ userId, originalOrderId, platform, isRecurring }) => {
  const sql = `
INSERT INTO subscription (user_id, original_order_id, created_at, updated_at, platform,is_recurring)
VALUES (:userId, :originalOrderId, :createdAt, :updatedAt, :platform,:isRecurring);
`;

  const now = Number.parseInt(new Date().getTime(), 10) / 1000;

  const { insertId } = await DBHelper.executeQuery(sql, { userId, originalOrderId, createdAt: now, updatedAt: now, platform, isRecurring: isRecurring });

  const { records } = await DBHelper.executeQuery('SELECT * FROM subscription WHERE id = :id', { id: insertId });

  return records[0];
};

const checkForExistingReceipt = async (orderId, subscriptionId) => {
  const { records } = await DBHelper.executeQuery(
    'SELECT * FROM subscriptionReceipt WHERE order_id = :orderId AND subscription_id = :subscriptionId',
    {
      orderId,
      subscriptionId,
    }
  );

  if (Array.isArray(records) && records.length > 0) {
    return records[0];
  }

  return null;
};

const insertSubscriptionReceipt = async ({
  subscriptionId,
  productId,
  orderId,
  purchasedAt,
  expiresAt,
  purchaseState,
  receipt,
  isTrial,
}) => {
  console.log("ADDING SUBSCRIPTION RECEIPT");

  const sql = `
INSERT INTO subscriptionReceipt (subscription_id, product_id, order_id, purchased_at, expires_at, expected_to_renew, purchase_state, receipt, is_trial, created_at, updated_at)
VALUES (:subscriptionId, :productId, :orderId, :purchasedAt, :expiresAt, :expectedToRenew, :purchaseState, :receipt, :isTrial, :createdAt, :updatedAt);
`;

  const now = Number.parseInt(new Date().getTime(), 10) / 1000;

  const formattedPurchasedAt = purchasedAt ? purchasedAt / 1000 : 0;
  const formattedExpiresAt = expiresAt ? expiresAt / 1000 : 0;
  const formattedIsTrial = isTrial ? 1 : 0;

  const { insertId } = await DBHelper.executeQuery(sql, {
    subscriptionId,
    productId,
    orderId,
    purchasedAt: formattedPurchasedAt,
    expiresAt: formattedExpiresAt,
    expectedToRenew: true,
    purchaseState,
    receipt,
    isTrial: formattedIsTrial,
    createdAt: now,
    updatedAt: now,
  });

  return insertId;
};

const updateSubscriptionReceipt = async ({
  id,
  expiresAt,
  receipt
}) => {
  const sql = `
UPDATE subscriptionReceipt SET expires_at = :expiresAt, receipt = :receipt, updated_at = :updatedAt WHERE id = :id;
`;

  const formattedExpiresAt = expiresAt ? expiresAt / 1000 : 0;

  await DBHelper.executeQuery(sql, {
    expiresAt: formattedExpiresAt,
    receipt,
    updatedAt: Number.parseInt(new Date().getTime(), 10) / 1000,
    id
  });
};

const setUserOnSubscription = async (userId, subscriptionId) => {
  const sql = `
UPDATE subscription SET user_id = :userId, updated_at = :updatedAt WHERE id = :subscriptionId
`;

  await DBHelper.executeQuery(sql, { userId, updatedAt: Number.parseInt(new Date().getTime(), 10) / 1000, subscriptionId });
};