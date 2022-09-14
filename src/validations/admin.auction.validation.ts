import {
  auctionBodyDto,
  auctionReturnValidateDto,
} from 'src/dto/admin.auction.module.dto';

export const validationAuctionBody = (
  body: auctionBodyDto,
): auctionReturnValidateDto => {
  const {
    id,
    // auctionType,
    // startDate,
    // startTime,
    endDate,
    endTime,
    startNumber,
  } = body;

  if (!id) {
    return { error: { status: 422, message: 'id is required' } };
  }
  // else if (!auctionType) {
  //   return { error: { status: 422, message: 'auctionType is required' } };
  // } else if (!startDate) {
  //   return { error: { status: 422, message: 'startDate is required' } };
  // } else if (!startTime) {
  //   return { error: { status: 422, message: 'startTime is required' } };
  // }
  else if (!endDate) {
    return { error: { status: 422, message: 'endDate is required' } };
  } else if (!endTime) {
    return { error: { status: 422, message: 'endTime is required' } };
  } else if (!startNumber) {
    return { error: { status: 422, message: 'startNumber is required' } };
  }
  return { data: body };
};
