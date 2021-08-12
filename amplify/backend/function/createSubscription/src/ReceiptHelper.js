const { SSM } = require('aws-sdk');
const Verifier = require('google-play-billing-validator');
const axios = require('axios').default;
const axiosRetry = require('axios-retry');

axiosRetry(axios, {
  retries: 5,
  retryDelay: retryCount => retryCount * 3000,
});

const statusCodes = {
  OK: 0,
  EXPIRED: 21006,
  MALFORMED_OR_TEMP_ISSUE: 21002,
  SERVER_UNAVAILABLE: 21005,
  DATA_ACCESS_ERROR: 21009,
};

const statusCodesToRetry = [
  statusCodes.MALFORMED_OR_TEMP_ISSUE,
  statusCodes.SERVER_UNAVAILABLE,
  statusCodes.DATA_ACCESS_ERROR,
];

const ssm = new SSM();

exports.processIOSReceipt = async receipt => {
  try {
    const { verificationEndpoint, appSecret  } = await getParameters();

    let receiptInfo = await postReceiptData({ receipt, appSecret, verificationEndpoint });
    let responseStatus = null;

    if (!receiptInfo || receiptInfo.status === null || receiptInfo.status === undefined) {
      throw new Error('Invalid verify receipt response');
    }

    responseStatus = receiptInfo.status;

    for (let i = 1; i <= 3; i++) {
      if (statusCodesToRetry.includes(responseStatus)) {
        console.log(`Retrying receipt validation on bad receipt status: ${responseStatus} retry #${i}`);
        await sleep(i * 1000);

        receiptInfo = await postReceiptData({ receipt, appSecret, verificationEndpoint });

        if (!receiptInfo || !receiptInfo.status) {
          throw new Error(`Invalid verify receipt response on retry #${i}`);
        }

        responseStatus = receiptInfo.status;
      }
    }

    if (responseStatus !== statusCodes.OK && responseStatus !== statusCodes.EXPIRED) {
      throw new Error(`Invalid receipt status: ${receiptInfo.status}`);
    }
    
    console.log("RECEIPT INFO: ", receiptInfo);
    
    const sortedInAppReceipts = receiptInfo.receipt.in_app.sort((a, b) => parseInt(b.purchase_date_ms) - parseInt(a.purchase_date_ms));
    const sortedLatestReceipts = receiptInfo.latest_receipt_info.sort((a, b) => parseInt(b.purchase_date_ms) - parseInt(a.purchase_date_ms));

    const latestInAppReceipt = sortedInAppReceipts[0];
    const latestReceiptInfo = sortedLatestReceipts[0];

    console.log("LATEST IN APP RECEIPT: ", latestInAppReceipt);
    console.log("LATEST RECEIPT INFO: ", latestReceiptInfo);

    const lastPurchasedReceipt = parseInt(latestInAppReceipt.purchase_date_ms) > parseInt(latestReceiptInfo.purchase_date_ms) ? latestInAppReceipt : latestReceiptInfo;
    
    console.log("LATEST RECEIPT: ", lastPurchasedReceipt);

    const isTrial = lastPurchasedReceipt.is_trial_period === "true";

    return {
      receiptType: receiptInfo.receipt.receipt_type,
      productId: lastPurchasedReceipt.product_id,
      purchasedAt: parseInt(lastPurchasedReceipt.purchase_date_ms),
      expiresAt: parseInt(lastPurchasedReceipt.expires_date_ms),
      originalOrderId: lastPurchasedReceipt.original_transaction_id,
      orderId: lastPurchasedReceipt.transaction_id,
      isTrial,
      latestReceipt: receiptInfo.receipt.latest_receipt
    };

  } catch (error) {
    console.error('Error processing receipt: ', error);
    throw error;
  }
};

exports.processAndroidPurchaseToken = async (purchaseToken, productId) => {
  try {
    const { accessEmail, accessKey, packageName } = await getParameters();

    const options = {
      email: accessEmail,
      key: accessKey,
    };

    const verifier = new Verifier(options);

    const receipt = {
      packageName,
      productId,
      purchaseToken,
    };

    const receiptInfo  = await verifier.verifySub(receipt);

    console.log("ANDROID RECEIPT INFO: ", receiptInfo);

    const { isSuccessful, errorMessage, payload } = receiptInfo;

    if(!isSuccessful || errorMessage) {
      throw new Error("Error verifying Android Purchase Token: " + (errorMessage || "unsuccessful response"));
    }

    return {
      productId,
      purchasedAt: payload.startTimeMillis,
      expiresAt: payload.expiryTimeMillis,
      originalOrderId: payload.orderId.split('..')[0],
      orderId: payload.orderId,
      isTrial: payload.paymentState === 2,
    };
  } catch(error) {
    console.error("Error processing purchase token: ", error);
    throw error;
  }
};

const postReceiptData = async ({ receipt, appSecret, verificationEndpoint }) => {
  const receiptInfoResponse = await axios.post(
    verificationEndpoint,
    {
      'receipt-data': receipt,
      password: appSecret,
      'exclude-old-transactions': false,
    },
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (!receiptInfoResponse.data) {
    throw new Error('Receipt verification returned invalid response: ', receiptInfoResponse.statusText);
  }

  const { data } = receiptInfoResponse;

  return data;
};

async function sleep(duration) {
  new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
}

async function getParameters() {
  const ssmParams = {
    Names: [
      `/AboutTimeTours/${process.env.ENV}/ios/appSecret`,
      `/AboutTimeTours/${process.env.ENV}/ios/verificationEndpoint`,
      `/AboutTimeTours/${process.env.ENV}/android/accessEmail`,
      `/AboutTimeTours/${process.env.ENV}/android/accessKey`,
      `/AboutTimeTours/${process.env.ENV}/android/packageName`,
    ],
    WithDecryption: true,
  };

  const { Parameters } = await ssm.getParameters(ssmParams).promise();

  const result = Parameters.reduce((accum, parameter) => {
    const name = parameter.Name.split('/').pop();

    accum[name] = parameter.Value;

    return accum;
  }, {});

  return result;
}
