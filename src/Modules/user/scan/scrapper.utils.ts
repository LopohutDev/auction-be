import { AMZENV, WALLENV } from 'src/constants/common.constants';
import {
  scanItemParamsDto,
  scrapperReturnDataDto,
} from 'src/dto/user.scan.module.dto';
import { uuid } from 'src/utils/uuid.utils';
import { createExceptionFile } from './exceptionhandling.utils';

export const getScrapperData = async (
  data: any,
  scaninfo: scanItemParamsDto,
): Promise<scrapperReturnDataDto> => {
  // const params = {
  //   barcode: barcode,
  //   key: process.env[SCANENV],
  // };
  const {
    default: { get },
  } = await import('axios');
  try {
    // const { data } = await get('https://api.barcodelookup.com/v3/products', {
    //   params,
    // });

    const storedata = data?.products?.length
      ? (data.products[0].stores as [])
      : [];

    const wallmartProduct = storedata.find((l) => l.name === 'Walmart');
    const AmazonProduct = storedata.find((l) => l.name === 'Amazon.com');
    if (!storedata.length || (!wallmartProduct && !AmazonProduct)) {
      return {
        scanParams: scaninfo,
        error: { status: 422, message: 'The scrapping was not successful.' },
      };
    }
    if (wallmartProduct) {
      const { data: walmartdata } = await get(
        `https://api.bluecartapi.com/request?api_key=${process.env[WALLENV]}&type=product&url=${wallmartProduct.link}`,
      );

      if (walmartdata.request_info.success) {
        const { images, description, title, buybox_winner } =
          walmartdata.product;
        if (!images || !description || !title || !buybox_winner?.price) {
          return {
            scanParams: scaninfo,
            error: {
              status: 422,
              message: 'Could not find the product images or description.',
            },
          };
        }
        const sendedData = {
          productId: uuid(),
          images: walmartdata.product.images,
          description: walmartdata.product.description,
          title: walmartdata.product.title,
          price: walmartdata.product?.buybox_winner?.price,
          manufacturer: 'Walmart',
          dimensions: walmartdata.product?.dimensions,
        };
        return { data: sendedData, scanParams: scaninfo };
      } else {
        return {
          scanParams: scaninfo,
          error: { status: 404, message: 'The scrapping was not successful.' },
        };
      }
    } else if (AmazonProduct) {
      const { data: amazondata } = await get(
        `https://api.rainforestapi.com/request?api_key=${process.env[AMZENV]}&type=product&url=${AmazonProduct.link}`,
      );
      if (amazondata.request_info.success) {
        const { images, description, title, buybox_winner } =
          amazondata.product;
        if (!images || !description || !title || !buybox_winner?.price) {
          return {
            scanParams: scaninfo,
            error: { status: 422, message: 'No item found' },
          };
        }

        const sendedData = {
          productId: uuid(),
          images: amazondata.product?.images,
          description:
            amazondata.product?.description ||
            amazondata.product?.feature_bullets?.join(' '),
          title: amazondata.product?.title,
          price: amazondata.product?.buybox_winner?.price,
          manufacturer: 'Amazon',
          dimensions: amazondata.product?.dimensions,
        };
        return { data: sendedData, scanParams: scaninfo };
      } else {
        return {
          scanParams: scaninfo,
          error: { status: 404, message: 'The scrapping was not successful.' },
        };
      }
    }
    createExceptionFile(
      'Some Exception occur for data: ' +
        JSON.stringify({ scan: scaninfo, data }),
    );
    return {
      scanParams: scaninfo,
      error: { status: 404, message: 'Something went wrong' },
    };
  } catch (err) {
    console.log('err', err);
    if (err?.response?.status === 404) {
      return {
        scanParams: scaninfo,
        error: { status: 404, message: 'Something went wrong' },
      };
    }
    createExceptionFile('Unhandled Exception for barcode' + scaninfo.barcode);
    return {
      scanParams: scaninfo,
      error: { status: 500, message: 'Something went wrong' },
    };
  }
};

export const getLotNo = (previousLotNo: string, isNew?: boolean): string => {
  const NumbLot = previousLotNo.match(/\d+/);
  const stringlot = previousLotNo.match(/[D-Z]/);
  const Chars = [
    'D',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
  ];
  const charindexof = Chars.indexOf(stringlot[0]);
  const numb = Number(NumbLot[0]) + 1;
  if (isNew || numb == 151) {
    return 20 + Chars[charindexof + 1];
  }

  return numb + Chars[charindexof];
};

export const getLotNoStoreReturn = (
  previousLotNo: string,
  isNew?: boolean,
): string => {
  const NumbLot = previousLotNo.match(/\d+/);
  const numb = Number(NumbLot[0]) + 1;
  if (isNew) {
    return '200';
  }

  return numb.toString();
};
