FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Asegurar directorios de persistencia para SQLite y uploads
RUN mkdir -p data uploads

EXPOSE 4000

CMD ["node", "src/server.js"]
