FROM mcr.microsoft.com/playwright:v1.36.0-focal

WORKDIR /app
COPY package.json package.json
RUN npm install --production
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
