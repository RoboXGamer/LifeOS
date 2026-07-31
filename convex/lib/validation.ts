export function cleanName(value: string, label: string, maximum = 80): string {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > maximum) {
    throw new Error(`${label} must be between 1 and ${maximum} characters.`);
  }
  return name;
}

export function cleanDescription(
  value: string | undefined,
): string | undefined {
  const description = value?.trim();
  if (!description) return undefined;
  if (description.length > 5000) {
    throw new Error("Description must be 5,000 characters or fewer.");
  }
  return description;
}

export function cleanColor(value: string): string {
  const color = value.trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(color)) {
    throw new Error("Choose a valid six-digit color.");
  }
  return color;
}

export function cleanIcon(value: string): string {
  const icon = value.trim();
  if (!/^[a-z][a-zA-Z0-9]*$/.test(icon) || icon.length > 40) {
    throw new Error("Choose a valid Area icon.");
  }
  return icon;
}
