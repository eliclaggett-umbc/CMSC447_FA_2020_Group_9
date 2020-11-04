FROM node:alpine

WORKDIR /home/node/app

# Installing dependencies
COPY ./package*.json ./
RUN yarn install

# Running the app
CMD [ "yarn", "run", "start"]