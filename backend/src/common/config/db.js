const { Sequelize } = require("sequelize");
require("dotenv").config();

// Sequelize를 사용해서 PostgreSQL DB에 연결하는 설정
const sequelize = new Sequelize(
  process.env.DB_NAME, // 데이터베이스 이름
  process.env.DB_USER, // PostgreSQL 사용자명
  process.env.DB_PASSWORD, // PostgreSQL 비밀번호
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,

    // PostgreSQL 사용
    dialect: "postgres",

    // 개발 중 SQL 로그를 보고 싶으면 console.log로 변경 가능
    logging: false,

    // Neon 같은 공유(원격) DB는 SSL 연결이 필수라 DB_SSL=true일 때만 켠다.
    // 로컬 Docker Postgres는 SSL이 없어서 기본값(false)일 땐 영향 없음.
    dialectOptions:
      process.env.DB_SSL === "true"
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
  }
);

module.exports = sequelize;