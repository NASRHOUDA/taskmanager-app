FROM node:20-alpine

WORKDIR /app

# Copie les dépendances
COPY package*.json ./

# Installe les dépendances
RUN npm ci --only=production

# Copie le code
COPY . .

# Expose le port
EXPOSE 3000

# Lance l'app
CMD ["npm", "start"]
