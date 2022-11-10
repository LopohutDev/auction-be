import { errorDto } from './common.dto';

export type auctionBodyDto = {
  id: string;
  endDate: string;
  endTime: string;
  startNumber: number;
};

export type getAuctionQueryDto = {
  location: string;
};

export type getRecoverQueryDto = {
  auction: string;
};

export enum auctionStatusDto {
  Past = 'Past',
  Current = 'Current',
  Future = 'Future',
}

export interface auctionReturnValidateDto extends errorDto {
  data?: auctionBodyDto;
}
