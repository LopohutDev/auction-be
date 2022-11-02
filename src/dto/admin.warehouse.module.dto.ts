import { WarehousesDataDto } from './admin.location.module.dto';
import { errorDto } from './common.dto';

export interface warehouseBodyDto extends WarehousesDataDto {
  location: string;
}

export interface warehouseReturnValidateDto extends errorDto {
  data?: warehouseBodyDto;
}

export interface itemTypeBodyDto {
  name: string;
}
