import {
  locationBodyDto,
  locationItemTypeDto,
  locationReturnValidateDto,
  usersQueryDataDto,
  usersReturnValidateDto,
  WarehousesDataDto,
} from 'src/dto/admin.location.module.dto';

const isNotValidWarehouse = (warehouses: WarehousesDataDto[]) => {
  for (let i = 0; i < warehouses.length; i += 1) {
    if (!warehouses[i].areaname || !warehouses[i]?.areaname?.trim().length) {
      return 'Invalid Areaname';
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { areaname, ...others } = warehouses[i];
    if (Object.keys(others).length) {
      const data = Object.keys(others);
      return `${data[0]} is not required`;
    }
  }
  return false;
};

const isNotValidlocationItemType = (itemType: locationItemTypeDto[]) => {
  for (let i = 0; i < itemType.length; i += 1) {
    if (!itemType[i].itemtag || !itemType[i]?.itemtag?.trim().length) {
      return 'Invalid Tag Name';
    } else if (!itemType[i].itemname || !itemType[i]?.itemname?.trim().length) {
      return 'Invalid Item Name';
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { itemtag, itemname, ...others } = itemType[i];
    if (Object.keys(others).length) {
      const data = Object.keys(others);
      return `${data[0]} is not required`;
    }
  }
  return false;
};

export const validateLocationBody = (
  body: locationBodyDto,
): locationReturnValidateDto => {
  const { city, address, warehouses, itemtype } = body;
  if (!city || !city.trim().length) {
    return { error: { status: 422, message: 'City is required' } };
  } else if (!address || !address.trim().length) {
    return { error: { status: 422, message: 'Address is required' } };
  } else if (!warehouses || !Array.isArray(warehouses)) {
    return { error: { status: 422, message: 'Warehouses not valid' } };
  } else if (!warehouses.length) {
    return {
      error: { status: 422, message: 'Atleast one warehouse required' },
    };
  } else if (warehouses && isNotValidWarehouse(warehouses)) {
    return {
      error: {
        status: 422,
        message: isNotValidWarehouse(warehouses) as string,
      },
    };
  } else if (!itemtype || !Array.isArray(itemtype)) {
    return { error: { status: 422, message: 'Item Type not valid' } };
  } else if (!itemtype.length) {
    return {
      error: { status: 422, message: 'Atleast one item type required' },
    };
  } else if (itemtype && isNotValidlocationItemType(itemtype)) {
    return {
      error: {
        status: 422,
        message: isNotValidlocationItemType(itemtype) as string,
      },
    };
  }
  return { data: body };
};

export const validateUsersBody = (
  body: usersQueryDataDto,
): usersReturnValidateDto => {
  const { id, type } = body;
  if (!id || !id.trim().length) {
    return { error: { status: 422, message: ' id is required' } };
  } else if (!type || !type.trim().length) {
    return { error: { status: 422, message: 'type is required' } };
  }
  return { data: body };
};

export const toFindDuplicates = (arry) => {
  const itemTagArr = arry.map(function (item) {
    return item.itemtag;
  });
  const isDuplicateTag = itemTagArr.some(function (item, idx) {
    return itemTagArr.indexOf(item) != idx;
  });

  const itemNameArr = arry.map(function (item) {
    return item.itemname;
  });
  const isDuplicateName = itemNameArr.some(function (item, idx) {
    return itemNameArr.indexOf(item) != idx;
  });

  return { isDuplicateTag, isDuplicateName };
};
