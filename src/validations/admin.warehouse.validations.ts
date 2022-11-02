import {
  warehouseBodyDto,
  warehouseReturnValidateDto,
} from 'src/dto/admin.warehouse.module.dto';

export const validationWarehouseBody = (
  body: warehouseBodyDto,
): warehouseReturnValidateDto => {
  const { areaname, location } = body;

  if (!areaname || !areaname.trim().length) {
    return { error: { status: 422, message: 'AreaName is required' } };
  } else if (!location) {
    return { error: { status: 422, message: 'location is required' } };
  }
  return { data: body };
};
