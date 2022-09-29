import { ScanQueryDto, scanValidateDto } from 'src/dto/user.scan.module.dto';

export const validateUserScan = (
  userscaninfo: ScanQueryDto,
  skipBarcode?: boolean,
): scanValidateDto => {
  const { barcode, areaname, itemtype, auction } = userscaninfo;
  if (!skipBarcode && (!barcode || !barcode.trim().length)) {
    return { error: { status: 422, message: 'Barcode is required' } };
  } else if (!areaname || !areaname.trim().length) {
    return { error: { status: 422, message: 'Location is required' } };
  } else if (!itemtype || !itemtype.trim().length) {
    return { error: { status: 422, message: 'Item Type is required' } };
  } else if (!auction || !auction.trim().length) {
    return { error: { status: 422, message: 'Auction is required' } };
  }
  return { item: userscaninfo };
};
