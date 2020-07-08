FROM node:10-alpine
ARG NODE_AUTH_TOKEN=""

WORKDIR /app

COPY package.json yarn.lock ./
COPY ?npmrc ?yarnrc ./
RUN yarn install

COPY . ./
RUN yarn build

EXPOSE 3000

# Cleanup
RUN rm -f .npmrc

# $NODE_ENV must be exported with -e
CMD ["yarn", "run", "start:provided-env"]
