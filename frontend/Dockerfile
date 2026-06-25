FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 5173

# Run Vite with host flag so it listens on all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
