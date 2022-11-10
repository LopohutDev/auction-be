import * as moment from 'moment';

type rowDto = {
  locid: string;
};

const checkBlackFriday = (futureDate: any) => {
  const month = futureDate.month();
  const currMonthLast = moment().endOf('month');

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

    const monthLastFriday = currMonthLast

      .set('date', currMonthLast.date() + d)
      .format();

    const blackFriday = moment(monthLastFriday).format('DD/MM/YYYY');

    const endBlackFriday = moment(futureDate)
      .add(3, 'days')
      .format('DD/MM/YYYY');

    return blackFriday == endBlackFriday;
  }
};

const setFutureAuction = (i: number, j: number, row: rowDto, currDate: any) => {
  const currDateDay = moment(currDate).day();

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

  const futureDate = moment(currDate).add(n, 'days');

  const futureDateDay = futureDate.day();

  if (futureDateDay === 2 || futureDateDay === 3 || futureDateDay === 4) {
    n = n + 2;
    const blackFriday: any = checkBlackFriday(futureDate);

    newArr = {
      auctionType: 'Auction1',

      startDate: moment
        .utc(moment(futureDate).set({ hour: 8, minute: 0, second: 0 }))
        .format(),

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

      startDate: moment
        .utc(moment(futureDate).set({ hour: 8, minute: 0, second: 0 }))
        .format(),

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

export default setFutureAuction;
