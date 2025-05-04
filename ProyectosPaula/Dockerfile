FROM node

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm install

COPY . . 

EXPOSE 8001

CMD ["node", "src/index.js"]

