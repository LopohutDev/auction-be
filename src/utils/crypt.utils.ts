import { uuid } from './uuid.utils';

export const encrypt = (str: string): string => {
  const id = uuid().substring(2, 10);
  const encryptphase1 = btoa(str);
  const addedids = encryptphase1.slice(0, 2) + id + encryptphase1.slice(2);
  return btoa(addedids);
};

export const decrypt = (str: string): string => {
  const decryptphase1 = atob(str);
  const deattachedStr = decryptphase1.slice(0, 2) + decryptphase1.slice(2 + 8);
  const decrypted = atob(deattachedStr);
  return decrypted;
};
