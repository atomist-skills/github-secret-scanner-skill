# Set up build
FROM node:lts@sha256:c7ac71504bf2cae1ead167353d6deefced556e69e405a475ede7ece290b3f863 AS build

WORKDIR /usr/src

COPY . ./

RUN npm ci --no-optional --also=dev \ 
 && npm run skill \
 && rm -rf node_modules .git

# Set up runtime container
FROM atomist/skill:node14@sha256:c58582642c85f2767523a3b65cbddd41f50814c98fe1c805b44c8caf5f0ad89e

WORKDIR "/skill"

COPY package.json package-lock.json ./

RUN npm ci --no-optional \
 && rm -rf /root/.npm

COPY --from=build /usr/src/ .

WORKDIR "/atm/home"

ENTRYPOINT ["node", "--no-deprecation", "--no-warnings", "--expose_gc", "--optimize_for_size", "--always_compact", "--max_old_space_size=512", "/skill/bin/scan.js"]

