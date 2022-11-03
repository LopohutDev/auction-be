import { addDays } from 'src/utils/common.utils';

type rowDto = {
  locid: string;
};

const checkBlackFriday = (futureDate: any) => {
  const month = futureDate.getMonth();
  const currMonthLast = new Date(
    futureDate.getFullYear(),
    futureDate.getMonth() + 1,
    0,
  );

  const currMonthLastDay = currMonthLast.getDay();

  let d = null;
  if (month + 1 == 11) {
    switch (currMonthLastDay) {
      case 1:
        d = -3;
        break;

      case 2:
        d = -4;
        break;

      case 3:
        d = -5;
        break;

      case 4:
        d = -6;
        break;

      case 5:
        d = 0;
        break;

      case 6:
        d = -1;
        break;

      case 0:
        d = -2;
        break;

      default:
        null;
        break;
    }

    const monthLastFriday = currMonthLast.setDate(currMonthLast.getDate() + d);
    const blackFriday = new Date(monthLastFriday).toLocaleDateString();
    const endBlackFriday = new Date(
      addDays(3, futureDate),
    ).toLocaleDateString();

    return blackFriday == endBlackFriday;
  }
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
    const blackFriday: any = checkBlackFriday(futureDate);

    newArr = {
      auctionType: 'Auction1',
      startDate: new Date(futureDate.setHours(8, 0, 0)),

      endDate: blackFriday
        ? new Date(new Date(addDays(3, futureDate)).setHours(19, 0, 0))
        : new Date(new Date(addDays(2, futureDate)).setHours(19, 0, 0)),
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
      startDate: new Date(futureDate.setHours(8, 0, 0)),

      endDate: new Date(new Date(addDays(3, futureDate)).setHours(19, 0, 0)),

      locid: row.locid,
    };
  }
  return { newArr, n, m };
};

export default setAuction;
