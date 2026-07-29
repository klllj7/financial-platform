const multer = require("multer");
const path = require("path");

// 업로드된 파일을 서버 로컬 디스크(backend/uploads/regulations)에 저장하는 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../../uploads/regulations"));
  },
  // 같은 이름의 파일을 여러 번 올려도 서로 덮어쓰지 않도록,
  // 저장할 때는 "업로드 시각-원본파일명"으로 새 이름을 만든다.
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

module.exports = upload;
