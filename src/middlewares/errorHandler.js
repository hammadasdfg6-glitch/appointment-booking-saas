

export async function errorHandler(err,req,res,next) {
    err.status ??= "fail";
    err.statusCode ??= 500;
    err.message ??= "!";

  return res.status(err.statusCode).json({
    status: err.status,
    statusCode: err.statusCode,
    message: err.message,
  });
}