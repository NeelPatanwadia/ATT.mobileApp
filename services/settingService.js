import { executeQuery } from '../helpers/apiHelpers';
import { getSetting as gqlGetSetting } from '../src/graphql/queries';

export const getSetting = async codeName =>
  executeQuery({
    query: gqlGetSetting,
    params: { code_name: codeName },
    fieldName: 'getSetting',
    isList: false,
    errorPrefix: `Error Getting Setting with Code Name: ${codeName}: `,
  });

export const queries = {
  getSetting,
};

const tourService = {
  queries,
};

export default tourService;
