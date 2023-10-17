# Set up build
FROM node:lts@sha256:d764525456dfe2f96a436ba00f864ee8ae3690bfb457c9f12a3a2a35b2d8be41 AS build

WORKDIR /skill

COPY . ./

RUN npm ci --no-optional --also=dev \
 && npm run skill \
 && rm -rf node_modules .git

# Set up runtime container
FROM atomist/skill:alpine_3.16-node_16@sha256:db6b383da5bc60839a7635d0d7e09940ee9b5b77d061f53fa77b2ddca4d33fdd

LABEL com.docker.skill.api.version="container/v1"
COPY --from=build /skill/.atomist/skill.yaml /

WORKDIR "/skill"

COPY package.json package-lock.json ./

RUN apk add --no-cache \
 npm=8.10.0-r0 \
 python3=3.10.9-r0 \
 make=4.3-r0 \
 g++=11.2.1_git20220219-r2 \
 && npm ci --no-optional \
 && npm cache clean --force \
 && apk del npm python3 make g++

COPY --from=build /skill .

ENTRYPOINT ["node", "--no-deprecation", "--no-warnings", "--expose_gc", "--optimize_for_size", "--always_compact", "--max_old_space_size=512", "/skill/node_modules/.bin/atm-skill"]
CMD ["run"]
