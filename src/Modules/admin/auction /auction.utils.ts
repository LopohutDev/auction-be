import { addDays } from 'src/utils/common.utils';

type rowDto = {
  locid: string;
};

const setAuction = (i: number, j: number, row: rowDto, currDate: Date) => {
  const currDateDay = currDate.getDay();
  let newArr = {};
  let n = i;
  let m = j;
  if (n === 1 && m === 0) {
    m++;
    switch (currDateDay) {
      case 1:
        n = 1;
        break;

      case 2:
        n = 0;
        break;

      case 3:
        n = -1;
        break;

      case 4:
        n = 1;
        break;

      case 5:
        n = 0;
        break;

      case 6:
        n = -1;
        break;

      case 0:
        n = 2;
        break;

      default:
        null;
        break;
    }
  }

  const futureDate = new Date(addDays(n));

  const futureDateDay = futureDate.getDay();

  if (futureDateDay === 2 || futureDateDay === 3 || futureDateDay === 4) {
    n = n + 2;
    newArr = {
      auctionType: 'Auction1',
      startDate: futureDate.toISOString(),
      startTime: new Date(futureDate.setHours(8, 0, 0)).toISOString(),
      endDate: new Date(addDays(2, futureDate)).toISOString(),
      endTime: new Date(
        new Date(addDays(2, futureDate)).setHours(19, 0, 0),
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
      endDate: new Date(addDays(3, futureDate)).toISOString(),
      endTime: new Date(
        new Date(addDays(3, futureDate)).setHours(19, 0, 0),
      ).toISOString(),
      locid: row.locid,
    };
  }
  return { newArr, n, m };
};

export default setAuction;
