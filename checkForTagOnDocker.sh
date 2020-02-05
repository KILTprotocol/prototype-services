#!/bin/sh

curl -s "https://registry.hub.docker.com/v2/repositories/$1/tags/" | jq '."results"[]["name"]' | grep -q $2; test $? -eq 1
