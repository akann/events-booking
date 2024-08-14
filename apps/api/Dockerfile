FROM node:18-alpine

ENV API_PORT 4202
ENV NX_SKIP_NX_CACHE true

WORKDIR /app

COPY package*.json  ./

RUN npm install

COPY . .

EXPOSE 4202

CMD ["npx", "nx", "serve", "api"]
