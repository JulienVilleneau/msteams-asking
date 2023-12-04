export function jsonParse(jsonString : string) {
    // Replace newline characters with their escaped version
    const escapedJsonString = jsonString.replace(/\n/g, "\\n").replace(/\r/g, "\\r");

    try {
        return JSON.parse(escapedJsonString);
    } catch (error) {
        console.error("Failed to parse JSON:", error);
        // Handle the error as appropriate for your application
        return "";
    }
}  