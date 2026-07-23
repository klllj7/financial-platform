export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    data: null,
    error: {
      code: "COMMON_404",
      message: `존재하지 않는 API입니다: ${req.method} ${req.originalUrl}`,
    },
  });
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || "COMMON_500";

  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code: errorCode,
      message:
        statusCode === 500
          ? "서버 처리 중 오류가 발생했습니다."
          : err.message,
    },
  });
}

// next를 코드에서 직접 사용하지 않더라도 Express가 에러 미들웨어로 인식하려면 매개변수 네 개를 유지해야 합니다.