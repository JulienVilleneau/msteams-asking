// Reporting
type ReportingMeeting = {
    reportContent: string;
};

// ActionPlan
type ActionPlan = {
    libelle: string;
};
type ActionPlans = ActionPlan[];


// Questions
type Answer = {
    option: string;
    isCorrect: boolean;
};
type Question = {
    question: string;
    answers: Answer[];
};
type Questions = Question[];


type CallbackFunction = (error: Error | null, content: string | null) => void;