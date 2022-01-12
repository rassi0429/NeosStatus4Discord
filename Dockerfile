FROM node:16-alpine
WORKDIR /app
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .
COPY ./src ./src
RUN npm i && npm run build
CMD ["node","./build/main.js"]