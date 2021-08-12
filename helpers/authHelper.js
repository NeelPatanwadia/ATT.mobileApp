/* eslint-disable camelcase */
import { Auth } from 'aws-amplify';

const getUserAttributes = async () => {
  try {
    const userInfo = await Auth.currentUserInfo();

    if (!userInfo) {
      throw new Error('Could not get authenticated user');
    }

    const { id: identity } = userInfo;

    const {
      attributes: { email, sub, phone_number, phone_number_verified },
    } = userInfo;

    return { identity, email, sub, phone_number, phone_number_verified };
  } catch (error) {
    console.log('Error getting user info: ', error);
    throw error;
  }
};

const AuthHelper = {
  getUserAttributes,
};

export default AuthHelper;
