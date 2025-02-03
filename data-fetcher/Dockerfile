## Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /usr/src/app/data-fetcher

# Install dependencies
COPY data-fetcher/*.json .
RUN npm install

COPY *.json .. 
COPY db-schema ../db-schema
COPY data-fetcher/*.ts .
COPY data-fetcher/utility/*.ts ./utility/

# Build the app
RUN npm run build
RUN npm run prisma:generate

# Stage 2: Production Image
FROM node:22-alpine AS production
WORKDIR /usr/src/app/data-fetcher

# copy the files from the build stage
COPY --from=build /usr/src/app/data-fetcher/node_modules ./node_modules
COPY --from=build /usr/src/app/data-fetcher/*.js .
COPY --from=build /usr/src/app/data-fetcher/utility/*.js ./utility/
COPY --from=build /usr/src/app/data-fetcher/package*.json ./
COPY --from=build /usr/src/app/db-schema ../db-schema

# copy the entrypoint script and make it executable
COPY data-fetcher/docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

# delete dev dependencies and set NODE_ENV to production
RUN npm prune --omit=dev
ENV NODE_ENV=production

ENTRYPOINT ["/usr/src/app/data-fetcher/docker-entrypoint.sh"]
CMD ["npm", "run", "start:scheduled"]
