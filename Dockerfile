FROM node:24

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src
RUN mkdir -p playlists logs

CMD ["node", "src/build_pokaz.js"]
