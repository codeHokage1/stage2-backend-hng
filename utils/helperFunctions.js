exports.handleValidationError = (error) => {
  const errors = error.errors.map((err) => ({
    field: err.path,
    message: err.message,
  }));

  return errors;
};

exports.handleUniqueConstraintError = (error) => {
    const errors = error.errors.map((err) => ({
        field: err.path,
        message: `${err.path} must be unique`,
    }));
    
    return errors;
}
