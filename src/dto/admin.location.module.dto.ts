import { errorDto } from './common.dto';

export interface WarehousesDataDto {
  assletter: string;
  areaname: string;
}

export type locationBodyDto = {
  city: string;
  address: string;
  Warehouses?: WarehousesDataDto[];
};

export interface locationReturnValidateDto extends errorDto {
  data?: locationBodyDto;
}

export interface locationQueryDataDto {
  location: string;
}
