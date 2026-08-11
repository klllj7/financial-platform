const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({ region: process.env.AWS_REGION || "ap-northeast-2" });
const BUCKET = process.env.EVIDENCE_BUCKET;

/**
 * relativePath 예: "6/1/2026/탈옥탐지로그_2026.csv"
 * content: string 또는 Buffer
 *
 * 반환값은 S3 객체 key(예: "evidence/6/1/2026/...")다. DB(file_path)에는
 * 이 key를 그대로 저장하고, 실제 다운로드 URL은 요청 시점에
 * getEvidenceFileDownloadUrl()로 매번 새로 발급한다(버킷이 비공개라
 * key만으로는 접근 불가).
 */
const saveEvidenceFile = async (relativePath, content) => {
  const key = `evidence/${relativePath}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: content,
  }));

  return key;
};

/** 저장된 key로 5분간 유효한 다운로드용 presigned URL을 발급한다. */
const getEvidenceFileDownloadUrl = async (key) => {
  if (!key) return null;
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: 300 });
};

/** "전체 자료 다운로드" zip처럼 서버가 직접 파일 내용을 스트리밍해야 할 때 사용한다. */
const getEvidenceFileStream = async (key) => {
  const response = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return response.Body;
};

/**
 * 버킷이 Object Lock 활성화 상태라 버전 자체는 남지만(감사 이력 보존),
 * 최신 버전은 삭제 마커가 붙어 이후 다운로드/조회에서는 더 이상 안 보인다.
 * key가 없거나 이미 지워진 상태여도 에러 없이 조용히 넘어간다(S3 DeleteObject는 멱등적).
 */
const deleteEvidenceFile = async (key) => {
  if (!key) return;
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};

module.exports = {
  saveEvidenceFile,
  getEvidenceFileDownloadUrl,
  getEvidenceFileStream,
  deleteEvidenceFile,
};
