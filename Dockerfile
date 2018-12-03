FROM node:10-alpine

WORKDIR /app

RUN apk add yarn

COPY . ./

RUN yarn install
RUN yarn build

EXPOSE 3000

# $NODE_ENV must be exported with -e
#
CMD ["yarn", "run", "start:provided-env"]