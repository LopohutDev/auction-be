import { errorDto } from './common.dto';

export type warehouseBodyDto = {
  areaname: string;
  assletter: string;
  location: string;
};

export interface warehouseReturnValidateDto extends errorDto {
  data?: warehouseBodyDto;
}
