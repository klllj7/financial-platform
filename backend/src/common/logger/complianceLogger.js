const winston = require("winston");
const WinstonCloudWatch = require("winston-cloudwatch");

// 로컬 개발 환경에는 CloudWatch 자격증명이 없어서, 그대로 두면 매 로그마다 에러가 난다.
// production에서만 CloudWatch로 보내고, 그 외에는 콘솔에만 찍는다.
const transports = [];

if (process.env.NODE_ENV === "production") {
  transports.push(
    new WinstonCloudWatch({
      logGroupName: "/financial-platform/compliance-logs",
      logStreamName: () => `node-api-${new Date().toISOString().slice(0, 10)}`,
      awsRegion: process.env.AWS_REGION || "ap-northeast-2",
      jsonMessage: true,
    }),
  );
} else {
  transports.push(new winston.transports.Console());
}

const complianceLogger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports,
});

// 로그인, 자료접근, 업로드/다운로드 — 3종 기록 전용 함수
function logComplianceEvent(eventType, detail) {
  complianceLogger.info({
    eventType,       // "LOGIN_SUCCESS" | "LOGIN_FAILURE" | "EVIDENCE_UPLOAD" | "EVIDENCE_DOWNLOAD" | "REPORT_GENERATE" | "REPORT_DOWNLOAD" | "DLP_MASKING"
    timestamp: new Date().toISOString(),
    ...detail,
  });
}

module.exports = { logComplianceEvent };
