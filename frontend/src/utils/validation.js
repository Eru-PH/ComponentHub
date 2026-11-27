export function isValidEmail(email) {
  const cleanEmail = String(email || '').trim();
  const atPosition = cleanEmail.indexOf('@');

  return (
    atPosition > 0 &&
    !cleanEmail.includes(' ') &&
    cleanEmail.indexOf('.', atPosition) > atPosition + 1
  );
}