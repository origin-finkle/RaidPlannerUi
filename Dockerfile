FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4200
CMD ["npm", "start", "--", "--host", "0.0.0.0"]

# when npm build works:

# RUN npm build --configuration=production

# FROM nginx:stable
# EXPOSE 80
# COPY --from=builder /app/dist /usr/share/nginx/html