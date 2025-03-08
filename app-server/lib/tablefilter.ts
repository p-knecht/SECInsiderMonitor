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

export const buildFilter = (
  retrievedSearchParams: { [key: string]: string | string[] | undefined },
  type: 'user' | 'filing',
  useMongo: boolean = false,
) => {
  const filter: any = useMongo ? { $and: [] } : { AND: [] };

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

    // nested filtering is currently only supported with MongoDB native/raw queries --> skip following filters for Prisma
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

  // Remove empty AND filter if no filters were applied (as empty $and-filter causes issues with MongoDB native queries)
  if (useMongo && filter.$and.length === 0) delete filter.$and;
  return filter;
};
