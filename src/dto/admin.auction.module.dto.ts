import { errorDto } from './common.dto';

export type auctionBodyDto = {
  startDate: Date;
  startTime: Date;
  endDate: Date;
  endTime: Date;
  startNumber: number;
};

export interface auctionReturnValidateDto extends errorDto {
  data?: auctionBodyDto;
}
