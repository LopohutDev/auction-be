# Project Description

Its Auction Management Backend project where we manage the products before auction begins for different warehouses in different locations.

Before Start to this application you have to add some variables in env file :

DEFAULT_PORT=5000
DEFAULT_HOST=0.0.0.0

DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=Auction12233
DB_PORT=54328
DB_HOST=localhost
DB_SCHEMA=auctionmanagement

GATEWAY_PORT=3000
GATEWAY_PRODUCT_URL="http://localhost:5000/graphql"
GATEWAY_URL="http://localhost:3002/graphql"
DB_URL=postgresql://postgres:Auction12233@0.0.0.0:54328/postgres?schema=auctionmanagement

To connect to Database you run add docker file and start your application

## Installation

```bash
$ yarn install
```

## Running the app

```bash
sudo docker-compose up auctiondb

# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT]:(https://choosealicense.com/licenses/mit/)
