FROM node:20-alpine as build

WORKDIR /app

# Copie les dépendances
COPY package*.json ./

# Installe les dépendances
RUN npm ci

# Copie le code
COPY . .

# Build l'app
RUN npm run build

# Stage production
FROM nginx:alpine

# Copie le build dans nginx
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/build /usr/share/nginx/html

# Expose le port
EXPOSE 80

# Lance nginx
CMD ["nginx", "-g", "daemon off;"]
