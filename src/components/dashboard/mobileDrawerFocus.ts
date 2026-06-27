export function getDrawerFocusWrapTarget<T>(
  focusableElements: readonly T[],
  activeElement: T | null,
  shiftKey: boolean,
): T | null {
  if (focusableElements.length === 0) {
    return null;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (shiftKey && activeElement === firstElement) {
    return lastElement;
  }

  if (!shiftKey && activeElement === lastElement) {
    return firstElement;
  }

  return null;
}
