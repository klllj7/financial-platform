const multer = require("multer");
const path = require("path");

const ALLOWED_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".csv",
  ".json",
  ".log",
  ".pdf",
]);

const uploadChatAttachment = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8",
    );
    const extension = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      const error = new Error(
        "TXT, MD, CSV, JSON, LOG, PDF 파일만 첨부할 수 있습니다.",
      );
      error.code = "CHAT_ATTACHMENT_TYPE_NOT_ALLOWED";
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  },
}).single("attachment");

module.exports = uploadChatAttachment;
