import { errorDto } from './common.dto';

export interface WarehousesDataDto {
  areaname: string;
}

export interface locationItemTypeDto {
  itemtype: string;
  tagname: string;
}

export type locationBodyDto = {
  city: string;
  address: string;
  warehouses: WarehousesDataDto[];
  itemtype: locationItemTypeDto[];
};

export interface locationReturnValidateDto extends errorDto {
  data?: locationBodyDto;
}

export interface locationQueryDataDto {
  location: string;
}
export type usersQueryDataDto = {
  id: string;
  type: string;
};
export interface usersReturnValidateDto extends errorDto {
  data?: usersQueryDataDto;
}
