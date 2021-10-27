# Set up build
FROM node:lts@sha256:807050b113fe722f90c0f2b64be3c0ecb7d85f9dc0e5c2ad3577be758f985509 AS build

WORKDIR /usr/src

COPY . ./

RUN npm ci --no-optional --also=dev \ 
 && npm run skill \
 && rm -rf node_modules .git

# Set up runtime container
FROM atomist/skill:node14@sha256:2c98a06ec9cc2504c1d93ea519cbe01f2aae30771c37e7fe8fa92e450b03db98

WORKDIR "/skill"

COPY package.json package-lock.json ./

RUN npm ci --no-optional \
 && rm -rf /root/.npm

COPY --from=build /usr/src/ .

WORKDIR "/atm/home"

ENTRYPOINT ["node", "--no-deprecation", "--no-warnings", "--expose_gc", "--optimize_for_size", "--always_compact", "--max_old_space_size=512", "/skill/bin/scan.js"]

