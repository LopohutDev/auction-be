export const queryParamToBool = (value: string) => {
  return (value + '').toLowerCase() === 'true';
};
