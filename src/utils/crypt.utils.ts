import { uuid } from './uuid.utils';

export const encrypt = (str: string): string => {
  const id = uuid().substring(2, 10);
  const encryptphase1 = btoa(str);
  const addedids = encryptphase1.slice(0, 2) + id + encryptphase1.slice(2);
  return btoa(addedids);
};

export const decrypt = (str: string): string => {
  try {
    const decryptphase1 = atob(str);
    const deattachedStr =
      decryptphase1.slice(0, 2) + decryptphase1.slice(2 + 8);
    const decrypted = atob(deattachedStr);
    return decrypted;
  } catch (error) {
    return 'Invalid String';
  }
};

export const encryptRefreshToken = (token: string) => {
  const splitedToken = token.split('.');
  if (splitedToken.length < 3) {
    return { error: 'Invalid Token' };
  }
  splitedToken[1] = encrypt(splitedToken[1]);
  return { token: btoa(splitedToken.join('.')) };
};

export const decryptRefreshToken = (token: string) => {
  try {
    const splitedToken = atob(token).split('.');
    if (splitedToken.length < 3) {
      return { error: 'Token not valid' };
    }
    splitedToken[1] = decrypt(splitedToken[1]);
    return { token: splitedToken.join('.') };
  } catch (error) {
    return { error: 'Invalid Token' };
  }
};
