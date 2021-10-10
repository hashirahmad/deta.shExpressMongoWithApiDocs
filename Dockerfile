FROM node:14.6.0-alpine

#RUN apt-get update

WORKDIR /usr/src/app
#ARG NODE_ENV
#ENV NODE_ENV $NODE_ENV

COPY . .
RUN npm install && npm run build_docs

EXPOSE 5000
CMD [ "npm", "start" ]
