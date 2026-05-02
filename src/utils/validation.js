/**
 * Validates the format of an Indian Voter ID (EPIC Number).
 * Typical format: 3 alphabets followed by 7 digits (e.g., ABC1234567).
 *
 * @param {string} epicNumber - The Voter ID string to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateVoterIdFormat(epicNumber) {
  if (!epicNumber) return false;
  
  const epicRegex = /^[A-Z]{3}[-\s]?[0-9]{7}$/i;
  const extendedEpicRegex = /^[A-Z]{3,4}[-\s]?[0-9]{6,7}$/i;

  return epicRegex.test(epicNumber) || extendedEpicRegex.test(epicNumber);
}
