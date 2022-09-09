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
