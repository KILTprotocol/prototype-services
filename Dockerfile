FROM node:10-alpine

WORKDIR /app

COPY . ./

RUN yarn install
RUN yarn build

EXPOSE 3000

# $NODE_ENV must be exported with -e
CMD ["yarn", "run", "start:provided-env"]
