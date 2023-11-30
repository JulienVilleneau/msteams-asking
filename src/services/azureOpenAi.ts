import { OpenAIClient, AzureKeyCredential, ChatCompletions } from '@azure/openai';


export const getReportingMeetingAboutTranscript = async (jsonFinal: string) => {
    try {
        const messagesToSent = `${jsonFinal} Build a report meeting in French with the following format: {"reportContent": "Todo"}`;

        const result = await callChatCompletions(messagesToSent);
        if (!result || !result.choices) {
            console.log("No result");
            return null;
        } else {
            const choice = result.choices[0];
            console.log(choice);
            if (choice.message && choice.message.role === "assistant" && choice.message.content) {
                return JSON.parse(choice.message.content) as ReportingMeeting;
            }
            return null;
        }
    } catch(error) {
        console.log(error);
    }
    
    return null;
}

export const getActionPlanAboutTranscript = async (jsonFinal: string) => {
    try {
        const messagesToSent = `${jsonFinal} Build a action plan as bullet points of the meeting in French respecting the following format: [{"libelle":"content"}]`;

        const result = await callChatCompletions(messagesToSent);
        if (!result || !result.choices) {
            console.log("No result");
            return null;
        } else {
            const choice = result.choices[0];
            console.log(choice);
            if (choice.message && choice.message.role === "assistant" && choice.message.content) {
                return JSON.parse(choice.message.content) as ActionPlans;
            }
            return null;
        }
    } catch(error) {
        console.log(error);
    }
    
    return null;
}

export const getQuestionsAboutTranscript = async (jsonFinal: string, questionCount: number) => {
    try {
        const messagesToSent = `${jsonFinal} Give me ${questionCount} questions & answer in French about the previous conversation. Each question must purposes 4 answers but only one is right, and must respect the following format: [{"question": "Todo?","answers":[{"option":"Answer","isCorrect":false}]}]`;

        const result = await callChatCompletions(messagesToSent);
        if (!result || !result.choices) {
            console.log("No result");
            return null;
        } else {
            const choice = result.choices[0];
            if (choice.message && choice.message.role === "assistant" && choice.message.content) {
                return JSON.parse(choice.message.content) as Questions;
            }
            return null;
        }
    } catch(error) {
        console.log(error);
    }
    
    return null;
}

// Appelle l'API Azure OpenAI pour récupérer les questions
const callChatCompletions = async (messagesToSent: string) : Promise<ChatCompletions> => {
    try {
        // Préparation de l'appel
        const messages = [
            { role: "user", content: messagesToSent }
        ];
        const endpoint = "https://oai-jvi-openai-demo.openai.azure.com/";
        const apiKey = process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY || "";
        const client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
        const deploymentId = process.env.NEXT_PUBLIC_DEPLOYMENT_NAME || "";
        //console.log(process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY);
        //console.log("Execute result");
        
        // Appel l'API Azure OpenAI
        return await client.getChatCompletions(deploymentId, messages);

    } catch (error) {
        console.log(error);
        throw error;
    }
}  