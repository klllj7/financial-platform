// 성공 응답을 통일된 형식으로 내려주는 함수
const success = (res, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
  });
};

// 실패 응답을 통일된 형식으로 내려주는 함수
const fail = (res, code, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code,
      message,
    },
  });
};

module.exports = { success, fail };