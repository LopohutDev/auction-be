import {
  locationBodyDto,
  locationReturnValidateDto,
} from 'src/dto/admin.location.module.dto';

export const validateLocationBody = (
  body: locationBodyDto,
): locationReturnValidateDto => {
  const { city, address } = body;
  if (!city || !city.trim().length) {
    return { error: { status: 422, message: 'City is required' } };
  } else if (!address || !address.trim().length) {
    return { error: { status: 422, message: 'Address is required' } };
  }
  return { data: body };
};
