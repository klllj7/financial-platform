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
    // multer는 파일명을 latin1로 잘못 해석해서 넘겨주기 때문에,
    // 한글 등 UTF-8 파일명이 깨지는 걸 막으려면 다시 utf8로 복원해줘야 한다.
    // (이 값을 req.file.originalname에도 반영해둬야, 컨트롤러에서 DB에 저장하는
    //  file_name도 깨지지 않는다.)
    file.originalname = Buffer.from(file.originalname, "latin1").toString("utf8");

    const uniqueSuffix = Date.now();
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

module.exports = upload;
