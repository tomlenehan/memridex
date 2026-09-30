FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM deps AS development

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM deps AS build

ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
ARG VITE_PUBLIC_SKY_ENABLED="true"
ENV VITE_PUBLIC_SKY_ENABLED=${VITE_PUBLIC_SKY_ENABLED}
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production

ENV PORT=80
ENV BACKEND_HOSTPORT=backend:80
ENV BACKEND_PROTOCOL=http

COPY --from=build /app/dist/ /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/templates/default.conf.template
