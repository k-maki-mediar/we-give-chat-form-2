FROM node:18-alpine

WORKDIR /usr/src/app

# package.json をコピーして依存関係をインストール
COPY package*.json ./
RUN npm install --legacy-peer-deps

# アプリケーションのソースをコピー
COPY . .

# Next.js の開発サーバーを起動
EXPOSE 3000
CMD ["npm", "run", "dev"] 