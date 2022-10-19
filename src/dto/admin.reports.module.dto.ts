import { errorDto } from './common.dto';

export type getReportsQueryDto = {
  location: string;
  range: string;
};

export type getScanReportBodyDto = {
  location: string;
  auction: string;
  markdone?: boolean;
};

export type updateMarkDoneBodyDto = {
  id: number;
  markdone: boolean;
};

export interface getScanReportsDto {
  scrapperId: string;
  location: string;
  isUploaded: boolean;
}

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
