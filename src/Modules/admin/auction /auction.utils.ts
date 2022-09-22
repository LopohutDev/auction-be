const setAuction = (i, row) => {
  let newArr = {};
  let n = i;

  const futureDate = new Date(new Date().getTime() + n * 24 * 60 * 60 * 1000);

  const futureDateDay = futureDate.getDay();

  if (futureDateDay === 2 || futureDateDay === 3 || futureDateDay === 4) {
    n = n + 2;
    newArr = {
      auctionType: 'Auction1',
      startDate: futureDate.toISOString(),
      startTime: new Date(futureDate.setHours(8, 0, 0)).toISOString(),
      endDate: new Date(
        new Date(futureDate).getTime() + 2 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      endTime: new Date(
        new Date(
          new Date(futureDate).getTime() + 2 * 24 * 60 * 60 * 1000,
        ).setHours(19, 0, 0),
      ).toISOString(),
      locid: row.locid,
    };
  }

  if (
    futureDateDay === 5 ||
    futureDateDay === 6 ||
    futureDateDay === 0 ||
    futureDateDay === 1
  ) {
    n = n + 3;
    newArr = {
      auctionType: 'Auction2',
      startDate: futureDate.toISOString(),
      startTime: new Date(futureDate.setHours(8, 0, 0)).toISOString(),
      endDate: new Date(
        new Date(futureDate).getTime() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      endTime: new Date(futureDate.setHours(19, 0, 0)).toISOString(),
      locid: row.locid,
    };
  }
  return { newArr, n };
};

export default setAuction;
