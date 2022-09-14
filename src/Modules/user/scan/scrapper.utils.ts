import { AMZENV, SCANENV, WALLENV } from 'src/constants/common.constants';
import { scrapperReturnDataDto } from 'src/dto/user.scan.module.dto';

export const getScrapperData = async (
  barcode: string,
): Promise<scrapperReturnDataDto> => {
  const params = {
    barcode: barcode,
    key: process.env[SCANENV],
  };
  const {
    default: { get },
  } = await import('axios');
  try {
    const { data } = await get('https://api.barcodelookup.com/v3/products', {
      params,
    });
    const storedata = data?.products?.length
      ? (data.products[0].stores as [])
      : [];
    const wallmartProduct = storedata.find((l) => l.name === 'Walmart');
    const AmazonProduct = storedata.find((l) => l.name === 'Amazon');
    if (!storedata.length || (!wallmartProduct && AmazonProduct)) {
      return { error: { status: 422, message: 'No store found' } };
    }
    if (wallmartProduct) {
      const { data: walmartdata } = await get(
        `https://api.bluecartapi.com/request?api_key=${process.env[WALLENV]}&type=product&url=${wallmartProduct.link}`,
      );
      if (walmartdata.request_info.success) {
        const sendedData = {
          productId: walmartdata.product.product_id,
          images: walmartdata.product.images,
          description: walmartdata.product.description,
          title: walmartdata.product.title,
        };
        return { data: sendedData };
      }
    } else if (AmazonProduct) {
      const { data: amazondata } = await get(
        `https://api.rainforestapi.com/request?api_key=${process.env[AMZENV]}&type=product&url=${AmazonProduct.link}`,
      );
      if (amazondata.request_info.success) {
        const sendedData = {
          productId: amazondata.product?.product_id,
          images: amazondata.product?.images,
          description: amazondata.product?.description,
          title: amazondata.product?.title,
        };
        return { data: sendedData };
      }
    }
    return { error: { status: 404, message: 'No Products found' } };
  } catch (err) {
    if (err?.response?.status === 404) {
      return { error: { status: 404, message: 'No product found' } };
    }
    return { error: { status: 500, message: 'Some error occured' } };
  }
};
