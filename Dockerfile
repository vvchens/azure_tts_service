FROM node

WORKDIR /app

COPY package.json .

RUN npm ci

COPY index.js .
COPY azure_tts_service.js .

CMD ["index.js"]