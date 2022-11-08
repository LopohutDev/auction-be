import * as moment from 'moment';

export const addDays = (days: number, date?: Date): Date => {
  if (date) {
    return new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);
  } else {
    return new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000);
  }
};

export const subDays = (days: number): any => {
  const date = moment.utc();
  date.subtract(days, 'days');
  date.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  return moment(date).format();
};
