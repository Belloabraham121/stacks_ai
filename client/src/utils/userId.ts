
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