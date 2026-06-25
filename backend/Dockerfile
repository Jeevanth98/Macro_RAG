FROM node:20-slim

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

ENV PORT=8000
ENV DATABASE_URL="file:./dev.db"

EXPOSE 8000

# Push schema, seed the database, and start the app
CMD npx prisma db push && npm run seed && npm run dev
