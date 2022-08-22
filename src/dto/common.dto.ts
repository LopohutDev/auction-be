type errorMsgDto = {
  status: number;
  message: string;
};

export interface errorDto {
  error?: errorMsgDto;
}

export interface successReturnDto {
  success?: boolean;
  message?: string;
}

export interface controllerReturnDto extends successReturnDto, errorDto {}

export interface successErrorDto extends errorDto {
  success?: boolean;
}