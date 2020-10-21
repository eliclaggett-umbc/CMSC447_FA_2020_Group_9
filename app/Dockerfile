
FROM node:14

WORKDIR /home/node/app

# Installing dependencies
COPY ./package*.json ./
RUN npm install

# Running the app
CMD [ "npm", "run", "dev" ]