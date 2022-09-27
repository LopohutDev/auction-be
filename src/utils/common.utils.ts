export const addDays = (days: number, date?: Date): Date => {
  if (date) {
    return new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);
  } else {
    return new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000);
  }
};
