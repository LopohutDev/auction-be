import { AuctionType } from '@prisma/client';
import { errorDto } from './common.dto';

export type auctionBodyDto = {
  id: string;
  auctionType: AuctionType;
  startDate: Date;
  startTime: Date;
  endDate: Date;
  endTime: Date;
  startNumber?: number;
};

export type getAuctionQueryDto = {
  location: string;
};

export interface auctionReturnValidateDto extends errorDto {
  data?: auctionBodyDto;
}
