export default phone => {
  // +15555555555 => 555-555-5555
  const stripped = phone.replace('+1', '');

  return `${stripped.slice(0, 3)}-${stripped.slice(3, 6)}-${stripped.slice(6)}`;
};
