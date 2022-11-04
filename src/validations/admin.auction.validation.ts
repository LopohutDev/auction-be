import {
  auctionBodyDto,
  auctionReturnValidateDto,
} from 'src/dto/admin.auction.module.dto';

const isValidDate = (date) => {
  const regex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/;
  return regex.test(date);
};

export const validationAuctionBody = (
  body: auctionBodyDto,
): auctionReturnValidateDto => {
  const { id, endDate, endTime } = body;

  if (!id) {
    return { error: { status: 422, message: 'id is required' } };
  } else if (!endDate) {
    return { error: { status: 422, message: 'endDate is required' } };
  } else if (!endTime) {
    return { error: { status: 422, message: 'endTime is required' } };
  }
  return { data: body };
};
