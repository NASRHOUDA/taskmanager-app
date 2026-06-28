# ---- Étape de build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Vérification que le build a bien produit un index.html (vu dans tes logs Jenkins)
RUN test -f /app/build/index.html && echo "✅ Build réussi" || (echo "❌ Build échoué - index.html manquant" && exit 1)

# ---- Étape finale ----
FROM nginx:alpine

# Patch des paquets système Alpine
RUN apk update && apk upgrade --no-cache

COPY --from=build /app/build /usr/share/nginx/html

RUN test -f /usr/share/nginx/html/index.html && echo "✅ Fichiers copiés avec succès" || (echo "❌ Erreur: index.html non trouvé" && exit 1)

# Config nginx pour une SPA React : toute route inconnue retombe sur index.html
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html =404; \
    } \
    add_header X-Content-Type-Options nosniff; \
    add_header X-Frame-Options DENY; \
}' > /etc/nginx/conf.d/default.conf

# nginx tourne en root par défaut sur l'image officielle (nécessaire pour bind sur le port 80),
# mais on peut au moins durcir les permissions sur les fichiers servis.
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
