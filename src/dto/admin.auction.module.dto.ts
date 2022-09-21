import { AuctionType } from '@prisma/client';
import { errorDto } from './common.dto';

export type auctionBodyDto = {
  id: string;

  endDate: Date;
  endTime: Date;
  startNumber: number;
};

export type getAuctionQueryDto = {
  location: string;
};

export type getRecoverQueryDto = {
  id: string;
};

export enum auctionStatusDto {
  Past,
  Current,
  Future,
}

export interface auctionReturnValidateDto extends errorDto {
  data?: auctionBodyDto;
}
