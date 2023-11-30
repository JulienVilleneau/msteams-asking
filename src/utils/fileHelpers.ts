export function checkIfFileExtension(file: File | null, extension: string): boolean {
    // Check if the extension file
    if (file && !file.name.endsWith(extension)) {
        alert("Veuillez sélectionner un fichier d'extension .VTT");
        return false;
    }
  
    return true;
}

export function readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event: ProgressEvent<FileReader>) => {
            const content = event.target?.result;
            resolve(content as string);
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsText(file);
    });
}