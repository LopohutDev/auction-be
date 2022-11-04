import {
  getScanReportBodyDto,
  scanReportValidateDto,
} from 'src/dto/admin.reports.module.dto';

export const valdiateScanAuction = (
  scaninfo: getScanReportBodyDto,
): scanReportValidateDto => {
  const { auction, location } = scaninfo;
  if (!location || !location.trim().length) {
    return { error: { status: 422, message: 'Location is required' } };
  } else if (!auction || !auction.trim().length) {
    return { error: { status: 422, message: 'Auction is required' } };
  }
  return { value: scaninfo };
};
