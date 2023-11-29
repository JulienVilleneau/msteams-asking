'use client'
import React, { useState } from 'react';
import { OpenAIClient, AzureKeyCredential, ChatCompletions } from '@azure/openai';
import '../styles/page.css';

export default function Home() {
  const [file, setFile] = React.useState<File | null>(null);
  const [questionCount, setQuestionCount] = React.useState(0);
  const [questions, setQuestions] = React.useState<Questions | null>(null);
  const [loading, setLoading] = useState(false); 
  
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };
  
  const onQuestionCountChange = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const numericValue = Number(target.value);
    setQuestionCount(numericValue);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert('Please select a file!');
      return;
    }

    // Check if the file has a .vtt extension  
    const fileExtension = file.name.split('.').pop();
    if (fileExtension?.toLowerCase() !== 'vtt') {
      alert('Please select a VTT file!');
      return;
    }
  
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => handleFileRead(event, questionCount);
      reader.readAsText(file);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Lit le fichier et appelle l'API Azure OpenAI
  const handleFileRead = async (event: ProgressEvent<FileReader>, questionCount: number) => {  
    const fileContents = event.target?.result;  
  
    if (typeof fileContents === 'string') {
      // Split the file contents into lines
      const lines = fileContents.split('\n');

      const structuredData: { name: string; line: string; }[] = [];
      const pattern: RegExp = /<v (?<name>.*?)>(?<line>.*?)<\/v>/g;

      // For each line, find matches and build JSON strings
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

      const jsonFinal = JSON.stringify(structuredData);

      // Call Azure OpenAI API to get questions back
      await callAzureOaiCompletions(jsonFinal, questionCount);
    }
    else {
      console.log("File not found");
    }
  };
  
  // Appelle l'API Azure OpenAI pour récupérer les questions
  const callAzureOaiCompletions = async (jsonFinal: string, questionCount: number) => {
    const messagesToSent = `"$(jsonFinal)" Give me $(questionCount) questions about the previous conversation. Each question must purposes 4 answers but only one is right, and must respect the following format: [{"question": "Todo?","answers":[{"option":"Answer","isCorrect":false}]}]`;
    
    const messages = [
      { role: "user", content: messagesToSent }
    ];
    const endpoint = "https://oai-jvi-openai-demo.openai.azure.com/";
    const apiKey = process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY || "";
    const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));

    const deploymentId = process.env.NEXT_PUBLIC_DEPLOYMENT_NAME || "";
    //console.log("Execute result");
    try {
      const result : ChatCompletions = await client.getChatCompletions(deploymentId, messages,
        {
          maxTokens: 800,
          temperature: 0.7,
          frequencyPenalty: 0,
          presencePenalty: 0,
          topP: 0.95,
          stop: ["\n"]
        });
      //console.log("Result is...");

      if (result && result.choices) {
        for (const choice of result.choices) {
          if (choice.message && choice.message.role === "assistant" && choice.message.content) {
            setQuestions(JSON.parse(choice.message.content));
          }
        }
      } else {
        console.log("No result");
      }
    } catch (error) {
      console.log(error);
    }
  };

  function formateQuizzContent() {
    let content = []; 

    if (!questions) {
      return <div>Aucune question n'a pu être identifiée</div>;
    }

    for (const question of questions) {
      content.push(
        <div>
          <div>&nbsp;</div>
          <div>
            Question: {question.question}  
            {question.answers.map((answer) => (
              <div>
                Answer: {answer.isCorrect ? <strong>{answer.option}</strong> : answer.option}
              </div>
            ))}
          </div>
        </div>
      );
    }
  
    return content;  
  }; 
  
  return (
    <div>
      <h1>MS Teams Asking</h1>
      <form onSubmit={onSubmit}>
        <label>
          Upload file:
          <input type="file" accept=".vtt" onChange={onFileChange} />
        </label>
        <label>
          Nombre de questions attendues:
          <input type="number" value={questionCount} onChange={onQuestionCountChange} />
        </label>
        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Chargement...' : 'Lister des questions'}
        </button>

        {loading && <div>Loader...</div>}
        {
          /* Remplacer cette ligne par un composant de loader */
        }
      </form>
      
      <div>
        {formateQuizzContent()}
      </div>
    </div>
  );
}