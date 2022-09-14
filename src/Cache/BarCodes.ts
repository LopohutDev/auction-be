export const BarcodeData = {
  data: {},

  get(barcodeId: string) {
    if (!barcodeId) {
      return { error: 'Barcode is required' };
    } else if (barcodeId && BarcodeData.data[barcodeId]) {
      return { data: BarcodeData.data[barcodeId] };
    }
    return { data: null };
  },

  set(key: string, value: any, ttl?: number) {
    if (!key || !value) {
      return { error: 'invalid values' };
    } else if (BarcodeData.data[key]) {
      return { error: 'Data is already present' };
    }
    const date = new Date().setSeconds(new Date().getSeconds() + ttl || 600);
    BarcodeData.data[key] = {
      ...value,
      exp: date.valueOf(),
    };
    return { success: true };
  },

  removeExpiredData(id: string) {
    if (!id) {
      return { error: 'Not valid data' };
    } else if (BarcodeData.data[id] && BarcodeData.data[id]?.exp < Date.now()) {
      delete BarcodeData.data[id];
      return { success: true };
    }

    return { data: true };
  },

  removeTempData(id: string) {
    if (!id) {
      return { error: 'Not Valid' };
    }
    delete BarcodeData.data[id];

    return { success: true };
  },
};
