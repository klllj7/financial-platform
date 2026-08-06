const { DataTypes } = require("sequelize");
const sequelize = require("../../common/config/db");

// 사용자가 어떤 약관에 언제 동의했는지 저장하는 모델
const UserAgreement = sequelize.define(
  "UserAgreement",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // 서비스 이용약관 또는 개인정보 수집·이용 동의 구분
    agreementType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "agreement_type",
    },

    // 사용자가 동의한 당시의 약관 버전
    agreementVersion: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "agreement_version",
    },

    // 동의 여부
    isAgreed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_agreed",
    },

    // 실제 동의가 이루어진 시각
    agreedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "agreed_at",
    },

    // 동의 요청이 발생한 IP 주소
    userIp: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: "user_ip",
    },

    // 사용자의 브라우저 및 운영체제 정보
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "user_agent",
    },
  },
  {
    tableName: "user_agreements",
    underscored: true,
  }
);

module.exports = UserAgreement;