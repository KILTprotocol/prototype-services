<p align="center">
<img width="220" src="https://user-images.githubusercontent.com/9762897/67468312-9176b700-f64a-11e9-8d88-1441380a71f6.jpg">  
  <div align="center"><sup><a href="kilt.io">kilt.io</a></sup></div> 
</p>

# kilt/prototype-services

## TL;DR

The prototype-services are not needed per-se to use KILT Protocol.

However, they're used by the [demo-client](https://demo.kilt.io/dashboard).
If you're running both a blockchain node and the demo-client locally for development purposes, you'll need to run the prototype-services locally.

## Important note

- All prototype-services are centralised. In the future, there could be decentralised, centralised or even offline ways to
  distribute the CTYPE or send messages.
- ⚠️⚠️⚠️ The prototype-services are implemented for demo purposes only; we don't recommend using them in production.

## About the prototype-services

The prototype-services count three distinct services: CTYPE, Messaging and Contact.

### CTYPE registry service

To use the KILT protocol, all participants need to share CTYPE definitions, as this is the meta
model for all claims. A hash of the CTYPE is written to the KILT blockchain but the data itself
needs to be passed from the CTYPE creator to all other participants in some way.
The CTYPE service:

1. takes a CTYPE definition;
2. checks its state on the chain;
3. writes it to the database.

### Messaging service

The messaging service offers a way to send a message from a sender to a receiver in a secure
way. Currently, the KILT Protocol works over this messaging service and users can
communicate over this central service through which they can send each other KILT related
messages. The demo client uses the Crypto and Messaging modules of the SDK to encrypt a
message before sending it to the service, so only the receiver is able to decrypt it. The
messaging services adds a message identifier and a “received-at” timestamp to the message.
The receiver is able to fetch and delete the message from this service.

### Contact service

Besides CTYPEs and messages, the KILT protocol also requires users to get to know each
other. To really simplify demoing use cases of the KILT protocol with the client, identities may
register themselves after being created to the contact service with an alias. Of course, in real
applications there will be many ways to get in contact and exchange information like public
keys. The centralised demo contact service is more like a public telephone book, where
everybody is registered, and users can find Attesters and Verifiers and learn their public keys
or DIDs.

## How the services are built

All prototype-services are implemented in TypeScript using node.js as a service framework and MongoDB to store data.
To simplify the demo ecosystem, all services are implemented as a centralised solution.
They're built upon [Nest](https://github.com/nestjs/nest) framework.

## Installing the services

```bash
$ yarn
```

## Running the services locally for development purposes

```
docker-compose up mongodb
```

Use `-d` to run this in detached mode.

Stopping the services container and removing the image:

```
docker-compose down -v
```

```bash
$ yarn start
```

## Running the services locally in production mode

```bash
$ yarn start:prod
```

## Testing

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

## Running services in docker locally

Start MongoDB and services with `docker-compose`:

```
docker-compose up
```
This will build the services image locally when first used. 
Use `docker-compose up --build` to rebuild if necessary.

The services backend then starts, connects to the MongoDB and waits on port 3000:

```
http://localhost:3000
```

## Example Requests

```
curl -X POST http://localhost:3000/ctype -H 'Content-Type: application/json' -d '{"key": "test", "name":"testCType", "author": "Mario Neises"}'

curl -s http://localhost:3000/ctype/test | jq
```

## Releasing / Deploying

Deployment is triggered by a push to the master branch as a result to a release build.

To build a release, start the release build job for the services project in _AWS CodeBuild_. See [here](https://github.com/KILTprotocol/release-build-job/blob/master/README.md#usage) for more info on building releases.

After a successful release build, the new version of the services is deployed to Amazon ECS.

## Open issues

- format files according to tslint, add rules to allow console.log, etc
- use yarn with yarn.lock OR npm with package-lock.json, but not mix this
