#!/bin/sh

aws --region="eu-central-1" ecr list-images --repository-name=$1 | jq '."imageIds"[]["imageTag"]' | grep -q $2; test $? -eq 1
