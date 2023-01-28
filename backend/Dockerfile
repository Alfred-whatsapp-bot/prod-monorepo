FROM node:lts-alpine

WORKDIR /alfred-bot-new
RUN apk update && apk add bash && apk add --no-cache nmap && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
    echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
    apk update && \
    apk add --no-cache \
    chromium \
    harfbuzz \
    "freetype>2.8" \
    ttf-freefont \
    nss 
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
COPY . /alfred-bot-new
RUN npm install pm2 -g
RUN npm install
COPY ./default.conf /etc/nginx/conf.d/
COPY ./init /docker-entrypoint-initdb.d
# CMD pm2 start src/main.js \ 
#     --node-args='--es-module-specifier-resolution=node' \
#     --name alfred-bot-new && \
CMD pm2-runtime start src/httpCtrl.js \
    --node-args='--es-module-specifier-resolution=node' \
    --name alfred-bot-new \
    sed -i "s/:3001/:$PORT/g" /etc/nginx/conf.d/ \
    EXPOSE 3001