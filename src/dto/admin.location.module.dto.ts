import { errorDto } from './common.dto';

export type locationBodyDto = {
  city: string;
  address: string;
};

export interface locationReturnValidateDto extends errorDto {
  data?: locationBodyDto;
}
