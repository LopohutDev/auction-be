import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { AppModule } from 'src/app.module';
import { AdminLocationRoute } from '../../routes/admin.routes';

describe('Location', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(`/GET ${AdminLocationRoute}`, () => {
    return request(app.getHttpServer())
      .get(AdminLocationRoute)
      .expect(422)
      .expect({ statusCode: 422, message: 'Location is required' });
  });

  it(`/POST ${AdminLocationRoute}`, () => {
    const values = {
      city: faker.address.city(),
      address: faker.address.streetAddress(),
      Warehouses: Array.from({ length: 3 }).map(() => {
        return {
          assletter: faker.random.alpha({ casing: 'upper' }),
          areaname: faker.random.alpha({ casing: 'upper' }),
        };
      }),
    };
    return request(app.getHttpServer())
      .post(AdminLocationRoute)
      .send(values)
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
