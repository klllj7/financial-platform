const fs = require("fs");
const path = require("path");

// regulationController.js가 uploads/regulations에 저장하는 것과 동일한 패턴으로,
// 자동생성된 증빙자료는 uploads/evidence 아래에 저장한다.
// app.js가 "/uploads"를 정적 서빙하고 있어서 별도 다운로드 API 없이
// 반환된 publicPath로 바로 다운로드할 수 있다.
//
// 나중에 S3로 옮길 때는 이 파일의 saveEvidenceFile 내부 구현만 S3 업로드로
// 바꾸고, publicPath에 S3 URL을 반환하도록 고치면 된다. 호출부(evidence.service.js)는
// 그대로 둬도 된다.
const UPLOADS_ROOT = path.join(__dirname, "../../../../uploads/evidence");

/**
 * relativePath 예: "6/1/2026/탈옥탐지로그_2026.csv"
 * content: string 또는 Buffer
 */
const saveEvidenceFile = async (relativePath, content) => {
  const absolutePath = path.join(UPLOADS_ROOT, relativePath);
  await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.promises.writeFile(absolutePath, content, "utf8");

  return `/uploads/evidence/${relativePath}`;
};

module.exports = { saveEvidenceFile };
