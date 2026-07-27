require('dotenv').config();

// Neon 같은 공유(원격) DB는 SSL 연결이 필수라 DB_SSL=true일 때만 켠다.
// 로컬 Docker Postgres는 SSL이 없어서 기본값(false)일 땐 영향 없음.
const dialectOptions =
  process.env.DB_SSL === 'true'
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {};

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectOptions,
  },
};