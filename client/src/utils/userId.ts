/**
 * Retrieves the user ID stored in local storage or creates a new one.
 *
 * When executed in a browser environment, the function checks if a user ID exists in local storage.
 * If not, it generates a new UUID using <code>crypto.randomUUID()</code>, stores it in local storage, and returns it.
 * When not in a browser environment, it returns the string "null".
 *
 * @example
 * // In a browser:
 * const userId = getOrCreateUserId();
 *
 * @returns The user ID if running in a browser, or "null" otherwise.
 */
export function getOrCreateUserId() {
    // Check if we're in a browser environment (Next.js runs code on the server too)
    if (typeof window !== 'undefined') {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = crypto.randomUUID(); // Generate a UUID
            localStorage.setItem('userId', userId); // Store it in local storage
        }
        return userId;
    }
    return "null"
}