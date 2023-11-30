export function transcriptAsJson(transcript : string) {
    const structuredData: { name: string; line: string; }[] = [];
    const pattern: RegExp = /<v (?<name>.*?)>(?<line>.*?)<\/v>/g;

    // For each line, find matches and build JSON strings
    const lines = transcript.split('\n');
    lines.forEach((line) => {
      const matches = Array.from(line.matchAll(pattern));
      if (matches) {
        for (const match of matches) {
            if (match.groups) {
                structuredData.push({ name: match.groups.name, line: match.groups.line });
            }
        }
      }
    });
    
    return JSON.stringify(structuredData);
}