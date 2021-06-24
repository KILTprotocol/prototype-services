FROM node:14-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . ./
RUN yarn build

EXPOSE 3000

# $NODE_ENV must be exported with -e
CMD ["yarn", "run", "start:provided-env"]
