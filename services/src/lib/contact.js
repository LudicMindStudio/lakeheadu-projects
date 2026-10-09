// The contact line in two parts: a short channel word ("Phone", "Text",
// "Email") and the number or address. The editor writes both. The entry
// stores one string built from them.

const JOIN = " · ";

export function composeContact(text, value) {
  return [text, value]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(JOIN);
}

export function splitContact(contact) {
  const parts = String(contact ?? "").split(JOIN);
  const text = (parts.shift() ?? "").trim();
  return { text, value: parts.join(JOIN).trim() };
}
