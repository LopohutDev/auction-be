FROM node:16.11-bullseye

WORKDIR /src

COPY . .

RUN yarn install

CMD ["node", "../dist/main.js"]