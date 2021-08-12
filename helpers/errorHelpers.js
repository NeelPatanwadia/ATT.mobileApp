export const parseFriendlyGraphQLError = (gqlResponse, fallbackMessage) => {
  try {
    const { errors } = gqlResponse;

    if (errors && errors.length > 0) {
      const { message } = errors[0];

      console.log('MESSAGE: ', message);

      if (message && message.includes('Error -- ')) {
        const result = message.replace('Error -- ', '');

        return result;
      }
    }

    return fallbackMessage;
  } catch (error) {
    console.log('Error parsing error: ', error);

    return fallbackMessage;
  }
};
