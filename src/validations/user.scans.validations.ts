import {
  ScanQueryDto,
  scanValidateDto,
  usersDataDto,
  usersReturnValidateDto,
} from 'src/dto/user.scan.module.dto';

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
export const validateUsersBody = (
  body: usersDataDto,
): usersReturnValidateDto => {
  const { email, type } = body;
  if (!email || !email.trim().length) {
    return { error: { status: 422, message: 'email is required' } };
  } else if (!type || !type.trim().length) {
    return { error: { status: 422, message: 'type is required' } };
  }
  return { data: body };
};