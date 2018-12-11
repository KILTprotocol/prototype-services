# kilt/prototype-services

## Description

Set of auxiliary services for the KILT prototype built upon [Nest](https://github.com/nestjs/nest) framework:

* Messaging Service
* Contacts Service
* Registry Service

## Installation

```bash
$ yarn install
```

## Running the app

The services backend uses MongoDB to store and retrieve information. During development it is best to start the MongoDB with `docker-compose`:
```
docker-compose up mongodb
```


```bash
# development
$ yarn start

# production mode
$ yarn start:prod
```

## Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

## Run services in docker locally

Make sure you have an active AWS profile (eg. $AWS_PROFILE pointing to the kilt-profile).
Login to the ECS Registry:

```
$(aws ecr get-login --no-include-email --region eu-central-1)
```

Start MongoDB and services with `docker-compose`:

```
docker-compose up
```

The services backend then starts, connects to the MongoDB and waits on port 3000:

```
http://localhost:3000
```
