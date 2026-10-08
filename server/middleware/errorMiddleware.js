const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.originalUrl}`,
    });
};

const errorHandler = (err, req, res, next) => {
    console.error(err);

    const statusCode =
        res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        success: false,
        message: err.message || "Server error",
    });
};

export {
    notFound,
    errorHandler,
};