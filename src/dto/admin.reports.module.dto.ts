import { errorDto } from './common.dto';

export type getReportsQueryDto = {
  location: string;
};

export type getScanReportBodyDto = {
  location: string;
  auction: string;
};

export type getScanQueryDto = {
  page: number;
  limit: number;
  location: string;
};

export interface scanReportValidateDto extends errorDto {
  value?: getScanReportBodyDto;
}

export enum ScannedFailedStatus {
  DONE = 'DONE',
  UNDERREVIEW = 'UNDERREVIEW',
}
