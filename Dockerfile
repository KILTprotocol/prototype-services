FROM node:10-alpine

WORKDIR /app

RUN apk add yarn

COPY . ./

# environment variable $KILT_NPM_AUTH_TOKEN must be provided when building the image:
# docker built --build-arg KILT_NPM_AUTH_TOKEN=xxx ...
ARG KILT_NPM_AUTH_TOKEN=""
RUN echo "//registry.npmjs.org/:_authToken=$KILT_NPM_AUTH_TOKEN" > .npmrc
RUN yarn config set @kiltprotocol:registry https://registry.npmjs.org

RUN yarn install
RUN yarn upgrade "@kiltprotocol/prototype-sdk"
RUN yarn build

EXPOSE 3000

# $NODE_ENV must be exported with -e
CMD ["yarn", "run", "start:provided-env"]