/**
 * Centralized Error Handling Middleware for DepthWizard Backend
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[DepthWizard Error]', err);

  const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
      status,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
