import { errorDto } from './common.dto';

export type registerBodyDto = {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  location: string;
};

export interface returnRegisterUserDto extends errorDto {
  user?: registerBodyDto;
}
