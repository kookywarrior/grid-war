FROM node:slim

WORKDIR /app
COPY . .
RUN npm install

ARG PORT
EXPOSE ${PORT:-3000}

CMD ["npm", "run", "start"]