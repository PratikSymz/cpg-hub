import React from "react";

const FormError = ({ message }) =>
  message ? <p className="mt-2 text-sm text-red-500">{message}</p> : null;

export default FormError;
