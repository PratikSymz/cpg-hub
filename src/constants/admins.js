export const ADMIN_EMAILS = [
  "geneve@gmail.com",
  "geneve@cpgrow.com",
  "pratik.buds@gmail.com",
];

export const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.some(
    (adminEmail) => adminEmail.toLowerCase() === email.toLowerCase()
  );
};
