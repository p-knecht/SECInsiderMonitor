/**
 * Add a text based filter for given key to the filter object based on the given search parameters.
 *
 * @param {Object} retrievedSearchParams - The search parameters retrieved from the request query.
 * @param {string} key - The key of the search parameter to use.
 * @param {function} condition - The condition to apply to the filter based on the search parameter value (allows for custom matching conditions e.g. exact match).
 * @param {Object} filter - The filter object to add the condition to.
 * @param {boolean} useMongo - Whether to use MongoDB native queries (true) or Prisma queries (false).
 * @returns {void}
 */
const addTextFilter = (
  retrievedSearchParams: { [key: string]: string | string[] | undefined },
  key: string,
  condition: (val: string) => any,
  filter: any,
  useMongo: boolean = false,
) => {
  const values = retrievedSearchParams[key];

  if (values) {
    const valuesArray = Array.isArray(values) ? values : [values];
    filter[useMongo ? '$and' : 'AND'].push(
      valuesArray.length === 1
        ? condition(valuesArray[0])
        : { [useMongo ? '$or' : 'OR']: valuesArray.map(condition) },
    );
  }
};

/**
 * Add a date based filter for given key to the filter object based on the given search parameters. This allows filtering by a given date range.
 *
 * @param {Object} retrievedSearchParams - The search parameters retrieved from the request query.
 * @param {string} keyPrefix - The prefix of the search parameters to use.
 * @param {string} field - The field to apply the filter.
 * @param {Object} filter - The filter object to add the condition to.
 * @param {boolean} useMongo - Whether to use MongoDB native queries (true) or Prisma queries (false).
 * @returns {void}
 */
const addDateFilter = (
  retrievedSearchParams: { [key: string]: string | string[] | undefined },
  keyPrefix: string,
  field: string,
  filter: any,
  useMongo: boolean = false,
) => {
  const dateFilter: any = {};

  if (retrievedSearchParams[`${keyPrefix}[from]`]) {
    const fromDate = new Date(retrievedSearchParams[`${keyPrefix}[from]`] as string);
    if (useMongo)
      // MongoDB requires dates to be wrapped in $date
      dateFilter.$gte = { $date: fromDate };
    else dateFilter.gte = fromDate;
  }

  if (retrievedSearchParams[`${keyPrefix}[to]`]) {
    const toDate = new Date(retrievedSearchParams[`${keyPrefix}[to]`] as string);
    if (useMongo)
      // MongoDB requires dates to be wrapped in $date
      dateFilter.$lte = { $date: toDate };
    else dateFilter.lte = toDate;
  }
  if (Object.keys(dateFilter).length)
    filter[useMongo ? '$and' : 'AND'].push({ [field]: dateFilter });
};

/**
 * Auxiliary function to build a filter object for Prisma or MongoDB queries based on the given search parameters.
 * The filter object is built based on the given type ('user' or 'filing') and the required query type (prisma or mongodb native).
 *
 * @param {Object} retrievedSearchParams - The search parameters retrieved from the request query, which will be parsed based on specification to get relevant filters
 * @param {string} type - The type of the filter ('user' or 'filing').
 * @param {boolean} useMongo - Whether to use MongoDB native queries (true) or Prisma queries (false).
 * @returns {Object} - The filter object to be used in the query.
 */
export const buildFilter = (
  retrievedSearchParams: { [key: string]: string | string[] | undefined },
  type: 'user' | 'filing',
  useMongo: boolean = false,
) => {
  const filter: any = useMongo ? { $and: [] } : { AND: [] };

  // Build a filter object for user table
  if (type === 'user') {
    addTextFilter(
      retrievedSearchParams,
      'filter[email]',
      (val) =>
        useMongo
          ? { email: { $regex: val, $options: 'i' } }
          : { email: { contains: val, mode: 'insensitive' } },
      filter,
      useMongo,
    );
    addTextFilter(
      retrievedSearchParams,
      'filter[emailVerified]',
      (val) => ({ emailVerified: val === 'true' }),
      filter,
      useMongo,
    );
    addTextFilter(
      retrievedSearchParams,
      'filter[role]',
      (val) => ({ role: val }),
      filter,
      useMongo,
    );
    addDateFilter(retrievedSearchParams, 'filter[createdAt]', 'createdAt', filter, useMongo);
    addDateFilter(retrievedSearchParams, 'filter[lastLogin]', 'lastLogin', filter, useMongo);
  }

  // Build a filter object for filing table
  if (type === 'filing') {
    addTextFilter(
      retrievedSearchParams,
      'filter[filingId]',
      (val) =>
        useMongo
          ? { filingId: { $regex: val, $options: 'i' } }
          : { filingId: { contains: val, mode: 'insensitive' } },
      filter,
      useMongo,
    );
    addTextFilter(
      retrievedSearchParams,
      'filter[formType]',
      (val) => ({ formType: val }),
      filter,
      useMongo,
    );
    addDateFilter(
      retrievedSearchParams,
      'filter[periodOfReport]',
      'formData.periodOfReport',
      filter,
      useMongo,
    );

    // nested filtering is currently only supported with MongoDB native/raw queries --> skip following filters if a Prisma filter was requested
    if (useMongo) {
      addTextFilter(
        retrievedSearchParams,
        'filter[issuer]',
        (val) => {
          if (val.match(/^\d{10}$/))
            return { 'formData.issuer.issuerCik': val }; // look for CIK full match if pattern matches
          else {
            const textSearch = { $regex: val, $options: 'i' };
            return {
              $or: [
                { 'formData.issuer.issuerCik': textSearch },
                { 'formData.issuer.issuerName': textSearch },
                { 'formData.issuer.issuerTradingSymbol': textSearch },
              ],
            };
          }
        },
        filter,
        useMongo,
      );

      addTextFilter(
        retrievedSearchParams,
        'filter[reportingOwner]',
        (val) => {
          if (val.match(/^\d{10}$/))
            return { 'formData.reportingOwner.reportingOwnerId.rptOwnerCik': val }; // look for CIK full match if pattern matches
          else {
            const textSearch = { $regex: val, $options: 'i' };
            return {
              $or: [
                { 'formData.reportingOwner.reportingOwnerId.rptOwnerCik': textSearch },
                { 'formData.reportingOwner.reportingOwnerId.rptOwnerName': textSearch },
              ],
            };
          }
        },
        filter,
        useMongo,
      );
    }

    addDateFilter(retrievedSearchParams, 'filter[dateFiled]', 'dateFiled', filter, useMongo);
  }

  // Remove empty AND filter if no filters were applied (as empty $and-filter might cause issues with MongoDB native queries)
  if (useMongo && filter.$and.length === 0) delete filter.$and;
  return filter;
};
