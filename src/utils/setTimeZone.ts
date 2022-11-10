export const setTimeZone = (data: any) => {
  return `${new Date(data.date).toLocaleString('en-US', data.options)}`;
};
