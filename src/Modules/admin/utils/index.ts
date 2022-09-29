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
