FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

COPY tsconfig.json ./
COPY scripts ./scripts
COPY src ./src

RUN npm run build

EXPOSE 3001

CMD ["sh", "-c", "npm run prisma:migrate && if [ \"$SEED_ON_START\" = \"true\" ]; then npm run prisma:seed:dev; fi && npm run start"]
