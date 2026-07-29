const crypto = require("crypto");

const getEncryptionKey = () => {
  const secret = process.env.AI_CREDENTIAL_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    const error = new Error(
      "AI_CREDENTIAL_ENCRYPTION_KEY를 32자 이상으로 설정해 주세요.",
    );
    error.code = "AI_CREDENTIAL_ENCRYPTION_KEY_REQUIRED";
    error.statusCode = 503;
    throw error;
  }
  return crypto.createHash("sha256").update(secret).digest();
};

const encryptCredential = (plainText) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
};

const decryptCredential = ({ encrypted, iv, authTag }) => {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]).toString("utf8");
};

module.exports = { encryptCredential, decryptCredential };
