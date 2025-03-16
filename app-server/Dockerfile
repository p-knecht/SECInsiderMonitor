## Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /usr/src/app/app-server

# Install dependencies
COPY app-server/*.json .
RUN npm install

COPY *.json .. 
COPY db-schema ../db-schema
COPY app-server/*.ts .
COPY app-server/*.mjs .
COPY app-server/actions ./actions/
COPY app-server/app ./app/
COPY app-server/components ./components/
COPY app-server/data ./data/
COPY app-server/hooks ./hooks/
COPY app-server/lib ./lib/
COPY app-server/public ./public/
COPY app-server/schemas ./schemas/

# Build the app
RUN npm run prisma:generate
RUN npm run build:appserver
RUN npm run build:initialize-db-indexes 

# Stage 2: Production Image
FROM node:22-alpine AS production
WORKDIR /usr/src/app/app-server

# copy the files from the build stage
COPY --from=build /usr/src/app/app-server/node_modules ./node_modules
COPY --from=build /usr/src/app/app-server/.next ./.next
COPY --from=build /usr/src/app/app-server/public ./public
COPY --from=build /usr/src/app/app-server/package*.json ./
COPY --from=build /usr/src/app/db-schema ../db-schema
COPY --from=build /usr/src/app/app-server/initialize-database-indexes.js ./initialize-database-indexes.js

# delete dev dependencies and set NODE_ENV to production
RUN npm prune --omit=dev
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"] 