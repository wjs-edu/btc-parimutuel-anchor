FROM node:20-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile --silent
COPY . .
ENV PORT=8080
EXPOSE 8080
CMD ["node","tools/verifier-server.js"]
