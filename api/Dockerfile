FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src

RUN npx prisma generate

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
