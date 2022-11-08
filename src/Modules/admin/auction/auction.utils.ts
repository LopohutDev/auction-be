import * as moment from 'moment';

import { addDays } from 'src/utils/common.utils';

type rowDto = {
  locid: string;
};

const checkBlackFriday = (futureDate: any) => {
  // const month = futureDate.getMonth();
  const month = futureDate.month();
  // const currMonthLast = new Date(
  //   futureDate.getFullYear(),
  //   futureDate.getMonth() + 1,
  //   0,
  // );
  const currMonthLast = moment().endOf('month');

  // const currMonthLastDay = currMonthLast.getDay();
  const currMonthLastDay = currMonthLast.day();

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

    // const monthLastFriday = currMonthLast.setDate(currMonthLast.getDate() + d);
    const monthLastFriday = currMonthLast
      // .add(currMonthLast.date() + d, 'days')
      .set('date', currMonthLast.date() + d)
      .format();
    // const blackFriday = new Date(monthLastFriday).toLocaleDateString();
    const blackFriday = moment(monthLastFriday).format('DD/MM/YYYY');
    // const endBlackFriday = new Date(
    //   addDays(3, futureDate),
    // ).toLocaleDateString();
    const endBlackFriday = moment(futureDate)
      .add(3, 'days')
      .format('DD/MM/YYYY');

    console.log('endBlackFriday------>>>>>', blackFriday, endBlackFriday);
    return blackFriday == endBlackFriday;
  }
};

const setAuction = (i: number, j: number, row: rowDto, currDate: any) => {
  // const currDateDay = currDate.getDay();
  const currDateDay = currDate.day();
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

  // const futureDate = new Date(addDays(n));
  const futureDate = moment().add(n, 'days');

  // const futureDateDay = futureDate.getDay();
  const futureDateDay = futureDate.day();

  if (futureDateDay === 2 || futureDateDay === 3 || futureDateDay === 4) {
    n = n + 2;
    const blackFriday: any = checkBlackFriday(futureDate);

    newArr = {
      auctionType: 'Auction1',
      // startDate: new Date(futureDate.setHours(8, 0, 0)),
      startDate: moment
        .utc(moment(futureDate).set({ hour: 8, minute: 0, second: 0 }))
        .format(),

      // endDate: blackFriday
      //   ? new Date(new Date(addDays(3, futureDate)).setHours(19, 0, 0))
      //   : new Date(new Date(addDays(2, futureDate)).setHours(19, 0, 0)),
      endDate: blackFriday
        ? moment
            .utc(
              moment(futureDate)
                .add(3, 'days')
                .set({ hour: 19, minute: 0, second: 0 }),
            )
            .format()
        : moment
            .utc(
              moment(futureDate)
                .add(2, 'days')
                .set({ hour: 19, minute: 0, second: 0 }),
            )
            .format(),
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
      // startDate: new Date(futureDate.setHours(8, 0, 0)),
      startDate: moment
        .utc(moment(futureDate).set({ hour: 8, minute: 0, second: 0 }))
        .format(),

      // endDate: new Date(new Date(addDays(3, futureDate)).setHours(19, 0, 0)),
      endDate: moment
        .utc(
          moment(futureDate)
            .add(3, 'days')
            .set({ hour: 19, minute: 0, second: 0 }),
        )
        .format(),

      locid: row.locid,
    };
  }
  return { newArr, n, m };
};

export default setAuction;
