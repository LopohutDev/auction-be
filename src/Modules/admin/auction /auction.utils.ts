const setAuction = (arr, row, i) => {
  const futureDate = new Date(new Date().getTime() + i * 24 * 60 * 60 * 1000);

  const futureDateDay = futureDate.getDay();

  if (futureDateDay === 2 || futureDateDay === 3 || futureDateDay === 4) {
    i = i + 2;
    arr.push({
      auctionType: 'Auction1',
      startDate: futureDate.toISOString(),
      startTime: new Date(futureDate.setHours(8, 0, 0)).toISOString(),
      endDate: new Date(
        new Date(futureDate).getTime() + 2 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      endTime: new Date(futureDate.setHours(19, 0, 0)).toISOString(),
      locid: row.locid,
    });
  }

  if (
    futureDateDay === 5 ||
    futureDateDay === 6 ||
    futureDateDay === 0 ||
    futureDateDay === 1
  ) {
    i = i + 3;
    arr.push({
      auctionType: 'Auction2',
      startDate: futureDate.toISOString(),
      startTime: new Date(futureDate.setHours(8, 0, 0)).toISOString(),
      endDate: new Date(
        new Date(futureDate).getTime() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      endTime: new Date(futureDate.setHours(19, 0, 0)).toISOString(),
      locid: row.locid,
    });
  }
};

export default setAuction;
