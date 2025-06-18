FROM node:20

WORKDIR /usr/src/app

# package*.json と Prisma スキーマフォルダを先にコピー
COPY package.json ./
COPY package-lock.json ./
COPY prisma ./prisma

# ビルドに必要なツールを入れる
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

RUN npm install --legacy-peer-deps

# コンテナ内にスキーマファイル (./prisma/schema.prisma) があるのでクライアント生成が成功する
RUN npx prisma generate

# 残りのソースコードをコピー
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"] 