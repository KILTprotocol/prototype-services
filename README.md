# kilt/prototype-services

## Description

Set of auxiliary services for the KILT prototype built upon [Nest](https://github.com/nestjs/nest) framework:

* Messaging Service
* Contacts Service
* Registry Service

## Open issues

- format files according to tslint, add rules to allow console.log, etc
- use yarn with yarn.lock OR npm with package-lock.json, but not mix this

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


## Example Requests

```
curl -X POST http://localhost:3000/ctype -H 'Content-Type: application/json' -d '{"key": "test", "name":"testCType", "author": "Mario Neises"}'

curl -s http://localhost:3000/ctype/test | jq
```

## Release / Deployment

Deployment is triggered by a push to the master branch as a result to a release build. 

To build a release, start the release build job for the services project in *AWS CodeBuild*. See [here](https://github.com/KILTprotocol/release-build-job/blob/master/README.md#usage) for more info on building releases.

After a successful release build, the new version of the services is deployed to Amazon ECS.
