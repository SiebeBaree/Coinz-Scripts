FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
COPY .env ./
COPY dist ./dist

# For production
# ENV NODE_ENV=production
ENV PORT=7301
EXPOSE 7301

RUN npm ci --emit=dev

CMD [ "npm", "run", "deploy" ]