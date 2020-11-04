FROM node:alpine

WORKDIR /home/node/app

# Installing dependencies
COPY ./package*.json ./
RUN yarn install
RUN npm install -g nodemon

# Running the app
CMD [ "nodemon", "index.js"]