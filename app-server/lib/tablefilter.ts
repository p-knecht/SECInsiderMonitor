const processOrFilter = (
  retrievedSearchParams: { [key: string]: string | string[] | undefined },
  key: string,
  condition: (val: string) => any,
  filter: any,
) => {
  const values = retrievedSearchParams[key];
  if (values) {
    const valuesArray = Array.isArray(values) ? values : [values];
    filter.AND.push(
      valuesArray.length === 1 ? condition(valuesArray[0]) : { OR: valuesArray.map(condition) },
    );
  }
};

const processDateFilter = (
  retrievedSearchParams: { [key: string]: string | string[] | undefined },
  keyPrefix: string,
  field: string,
  filter: any,
) => {
  const dateFilter: any = {};
  if (retrievedSearchParams[`${keyPrefix}[from]`]) {
    dateFilter.gte = new Date(retrievedSearchParams[`${keyPrefix}[from]`] as string);
  }
  if (retrievedSearchParams[`${keyPrefix}[to]`]) {
    dateFilter.lte = new Date(retrievedSearchParams[`${keyPrefix}[to]`] as string);
  }
  if (Object.keys(dateFilter).length) {
    filter.AND.push({ [field]: dateFilter });
  }
};

export const buildUserTableFilter = (retrievedSearchParams: {
  [key: string]: string | string[] | undefined;
}) => {
  const filter: any = { AND: [] };

  processOrFilter(
    retrievedSearchParams,
    'filter[email]',
    (val) => ({ email: { contains: val, mode: 'insensitive' } }),
    filter,
  );
  processOrFilter(
    retrievedSearchParams,
    'filter[emailVerified]',
    (val) => ({ emailVerified: val === 'true' }),
    filter,
  );
  processOrFilter(retrievedSearchParams, 'filter[role]', (val) => ({ role: val }), filter);
  processDateFilter(retrievedSearchParams, 'filter[createdAt]', 'createdAt', filter);
  processDateFilter(retrievedSearchParams, 'filter[lastLogin]', 'lastLogin', filter);

  return filter;
};
