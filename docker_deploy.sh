#!/bin/bash

# parse optional arg registry: '-r'
# Usage: sh docker_deploy.sh -r register.com:port
while getopts ":r:" opt; do
  case $opt in
  r)
    DOCKER_PUSH_REGISTRY=$OPTARG
    ;;
  ?)
    echo "invalid arg"
    exit 1
    ;;
  esac
done

# set image:tag
IMAGE_NAME=hiseas/ai-tg-web
#if [[ -z "${IMAGE_TAG}" ]]; then
#    GIT_TAG=$(2>/dev/null git describe --tags --exact-match)
#    GIT_REVISION=`git rev-parse --short HEAD`
#    if [[ -n "$GIT_TAG" ]]; then
#        IMAGE_TAG="$GIT_TAG"
#    else
#        IMAGE_TAG="$GIT_REVISION"
#    fi
#fi
IMAGE_TAG=$(git describe --tags)
DOCKER_PUSH_REGISTRY=${DOCKER_PUSH_REGISTRY:-maven-wh.niub.la:8482}
service=ai-tg-web

# Prepare for docker build
echo "Prepare for docker build..."

if [ -e "bin/$service" ]; then
  echo "bin/$service build success"
else
  echo "bin/$service build fail"
  exit 1
fi

# docker build
echo "Building ${IMAGE_NAME}:${IMAGE_TAG}"
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -f Dockerfile .
if [ $? -eq 0 ]; then
  echo "succeed"
else
  echo "error failed ！！！"
  exit 1
fi

echo "Build docker image ${IMAGE_NAME}:${IMAGE_TAG} done."

# docker tag with repo
docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_PUSH_REGISTRY}/${IMAGE_NAME}:latest
docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_PUSH_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}

# docker push
echo "Push docker images to ${DOCKER_PUSH_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
docker push ${DOCKER_PUSH_REGISTRY}/${IMAGE_NAME}:latest
docker push ${DOCKER_PUSH_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
if [ $? -eq 0 ]; then
  echo "succeed"
else
  echo "error failed ！！！"
  exit 1
fi
echo "Push docker images done."
