export const paginationHelper = (allData, page: number, limit: number) => {
  const pageCount = Math.ceil(allData.length / limit);

  if (!page) {
    page = 1;
  }
  if (page > pageCount) {
    page = pageCount;
  }
  const data = allData.slice(page * limit - limit, page * limit);
  return { data, pageCount };
};

export const setObjectLowercaseKeys = (obj: any) => {
  const entries = Object.entries(obj);

  return Object.fromEntries(
    entries.map(([key, value]) => {
      return [key.toLowerCase(), value];
    }),
  );
};

export const setArrayLowercaseKeys = (array: any) => {
  const data = array.map((entry) => {
    const modified = {};
    Object.keys(entry).forEach((key) => {
      const value = entry[key];
      key = key.toLowerCase();
      modified[key] = value;
    });
    return modified;
  });

  return data;
};
