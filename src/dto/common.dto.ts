type errorMsgDto = {
  status: number;
  message: string;
};

export interface errorDto {
  error?: errorMsgDto;
}

export interface successReturnDto{
  success?: boolean;
  message?: string;
}

export interface controllerReturnDto extends successReturnDto, errorDto {}

export interface successErrorDto extends errorDto {
  success?: boolean;
}
export interface successErrorReturnDto extends errorDto {
  success?: boolean;
  message?: string;
}
export type paginationDto = {
  page?: number;
  limit?: number;
  all?: string;
};
