FROM node:22.22-alpine3.22

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 6000

CMD ["node", "dist/server.js"]