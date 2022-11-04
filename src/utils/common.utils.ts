export const addDays = (days: number, date?: Date): Date => {
  if (date) {
    return new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);
  } else {
    return new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000);
  }
};

export const subDays = (days: number): Date => {
  const date = new Date();
  date.setDate(new Date().getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
};
