import { Scans } from '@prisma/client';
import { successErrorDto } from './common.dto';

export type ScanQueryDto = {
  barcode: string;
};

export interface ScanDataReturnDto extends successErrorDto {
  data?: Scans[];
}
