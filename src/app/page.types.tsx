type Answer = {
    option: string;
    isCorrect: boolean;
};

type Question = {
    //id: string | number; // Assuming each question has a unique identifier
    question: string;
    answers: Answer[];
};

type Questions = Question[];