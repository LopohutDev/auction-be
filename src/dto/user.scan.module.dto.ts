import { Scans } from '@prisma/client';
import { errorDto, successErrorDto } from './common.dto';

export type ScanQueryDto = {
  barcode: string;
  location: string;
  itemtype: string;
  auction: string;
};

export interface ScanDataReturnDto extends successErrorDto {
  data?: Scans[];
}

export interface scanValidateDto extends errorDto {
  item?: ScanQueryDto;
}

interface scrapperImagesDataDto {
  link: string;
  id: string;
  zoomable: boolean;
}
export interface scrapperDataDto {
  productId: string;
  images: Array<scrapperImagesDataDto> | [];
  description: string;
  title: string;
  price: string;
}

export interface scanItemParamsDto {
  barcode: string;
  areaname: string;
  locationItemId: string;
  auctionId: string;
}

export interface scrapperReturnDataDto extends errorDto {
  data?: scrapperDataDto;
  scanParams?: scanItemParamsDto;
}
