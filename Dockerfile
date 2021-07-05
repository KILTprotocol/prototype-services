FROM node:14-alpine as develop

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . ./
RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]

######

FROM node:14-alpine as production

WORKDIR /app

COPY package.json yarn.lock LICENSE /app/
RUN yarn install --production --frozen-lockfile

COPY environment /app/environment
COPY --from=develop /app/dist /app/dist

EXPOSE 3000

# $NODE_ENV must be exported with -e
CMD ["yarn", "run", "start:provided-env"]
