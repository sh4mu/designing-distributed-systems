FROM node:latest

WORKDIR /app
COPY . .

RUN npm install

ENV PORT=8080
EXPOSE ${PORT}

ENTRYPOINT [ "node", "publisher.js" ]