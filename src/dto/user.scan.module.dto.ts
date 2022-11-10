import { Scans } from '@prisma/client';
import { errorDto, successErrorDto } from './common.dto';

export type ScanQueryDto = {
  barcode: string;
  areaname: string;
  itemtype: string;
  auction: string;
  email: string;
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
  manufacturer: string;
}

export interface scanItemParamsDto {
  barcode: string;
  areaname: string;
  locationItemId: string;
  auctionId: string;
  userid: string;
  username: string;
  locid: string;
  tag: string;
  autionStartNo: number;
  lastInsertId: number;
  locationName: string;
}

export interface scrapperReturnDataDto extends errorDto {
  data?: scrapperDataDto;
  scanParams?: scanItemParamsDto;
}

export interface locationScansDto {
  lotNo: string;
  Title: string;
  Category?: string;
  Featured?: string;
  QuantityAvailable?: number;
  StartingBid?: number;
  NewLot?: string;
  Description: string;
  Quantity?: number;
  Consignor?: number;
  StartBidEach?: number;
}
export interface locationScansDallasDto {
  LotNo: string;
  Title: string;
  Description1: string;
  Quantity?: number;
  Consignor?: number;
  StartBidEach?: number;
}
