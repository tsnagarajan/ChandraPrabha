FROM node:20-bullseye
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm rebuild swisseph --build-from-source
RUN npm run build
ENV PORT=8080
EXPOSE 8080
CMD ["npm","start"]
