import { ScanQueryDto, scanValidateDto } from 'src/dto/user.scan.module.dto';

export const validateUserScan = (
  userscaninfo: ScanQueryDto,
): scanValidateDto => {
  const { barcode, location, itemtype, auction } = userscaninfo;
  if (!barcode || !barcode.trim().length) {
    return { error: { status: 422, message: 'Barcode is required' } };
  } else if (!location || !location.trim().length) {
    return { error: { status: 422, message: 'Location is required' } };
  } else if (!itemtype || !itemtype.trim().length) {
    return { error: { status: 422, message: 'Item Type is required' } };
  } else if (!auction || !auction.trim().length) {
    return { error: { status: 422, message: 'Auction is required' } };
  }
  return { item: userscaninfo };
};
