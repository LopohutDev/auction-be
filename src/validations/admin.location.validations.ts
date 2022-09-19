import {
  locationBodyDto,
  locationReturnValidateDto,
  usersQueryDataDto,
  usersReturnValidateDto,
  WarehousesDataDto,
} from 'src/dto/admin.location.module.dto';

const isNotValidWarehouse = (warehouses: WarehousesDataDto[]) => {
  for (let i = 0; i < warehouses.length; i += 1) {
    if (!warehouses[i].areaname || !warehouses[i]?.areaname?.trim().length) {
      return 'InValid Areaname';
    } else if (
      !warehouses[i].assletter ||
      !warehouses[i]?.assletter?.trim().length
    ) {
      return 'InValid Associate Letter';
    }
  }
  return false;
};

export const validateLocationBody = (
  body: locationBodyDto,
): locationReturnValidateDto => {
  const { city, address, Warehouses } = body;
  if (!city || !city.trim().length) {
    return { error: { status: 422, message: 'City is required' } };
  } else if (!address || !address.trim().length) {
    return { error: { status: 422, message: 'Address is required' } };
  } else if (Warehouses && !Array.isArray(Warehouses)) {
    return { error: { status: 422, message: 'Warehouses not valid' } };
  } else if (Warehouses && isNotValidWarehouse(Warehouses)) {
    return {
      error: {
        status: 422,
        message: isNotValidWarehouse(Warehouses) as string,
      },
    };
  }
  return { data: body };
};
export const validateUsersBody = (
  body: usersQueryDataDto,
): usersReturnValidateDto => {
  const { id, type} = body;
  if (! id || ! id.trim().length) {
    return { error: { status: 422, message: ' id is required' } };
  } else if (!type || !type.trim().length) {
    return { error: { status: 422, message: 'type is required' } };
  } 
  return { data: body };
  };
