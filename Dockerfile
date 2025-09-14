FROM node:20-bullseye
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build
ENV PORT=8080
EXPOSE 8080
CMD ["npm","start","--","-p","8080"]
