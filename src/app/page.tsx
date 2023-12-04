'use client'
import React, { useState } from 'react';
import { readFileContent, checkIfFileExtension } from '../utils/fileHelpers';
import { transcriptAsJson } from '../utils/transcriptReader';
import { PageProcessExec } from './page.enums';
import { getReportingMeetingAboutTranscript, getActionPlanAboutTranscript, getQuestionsAboutTranscript } from '../services/azureOpenAi'; 
import '../styles/page.css';

export default function Home() {
  const [file, setFile] = React.useState<File | null>(null);
  const [questionCount, setQuestionCount] = React.useState(3);
  const [isAsking, setIsAsking] = React.useState(false);
  const [currentAsk, setCurrentAsk] = React.useState<PageProcessExec>(PageProcessExec.None);
  const [reportingMeeting, setReportingMeeting] = React.useState<ReportingMeeting | null>(null);
  const [actionPlans, setActionPlans] = React.useState<ActionPlans | null>(null);
  const [questions, setQuestions] = React.useState<Questions | null>(null);
  const [reportingMeetingLoading, setReportingMeetingLoading] = React.useState(false);
  const [actionPlansLoading, setActionPlansLoading] = React.useState(false);
  const [questionsLoading, setQuestionsLoading] = React.useState(false);
  
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = e.target.files ? e.target.files[0] : null;  
    setFile(newFile);
  };

  const onQuestionCountChange = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const numericValue = Number(target.value);
    setQuestionCount(numericValue);
  };
  
  const onReportMeetingClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAsking(false);
    setCurrentAsk(PageProcessExec.None);
    setReportingMeetingLoading(true);
    processExec(PageProcessExec.Reporting);
  };

  const onActionPlanClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAsking(false);
    setCurrentAsk(PageProcessExec.None);
    setActionPlansLoading(true);
    processExec(PageProcessExec.ActionPlan);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAsking(false);
    setCurrentAsk(PageProcessExec.None);
    setQuestionsLoading(true);
    processExec(PageProcessExec.Question);
  };

  const readTranscript = async (file: File | null) : Promise<string> => {
    let content : string = "";

    if (file && checkIfFileExtension(file, "vtt")) {
      content = await readFileContent(file);
    } else {
      console.warn("Aucun fichier sélectionné");  
      alert("Aucun fichier sélectionné");
    }

    return content;
  }

  const processExec = async (pageProcessExec: PageProcessExec) => {
    try {
      // Read the file
      const fileContent : string = await readTranscript(file);
      if (!fileContent || fileContent == "") {
        setReportingMeetingLoading(false);
        setActionPlansLoading(false);
        setQuestionsLoading(false);
        return;
      }

      const jsonFinal = transcriptAsJson(fileContent);

      // Call Azure OpenAI API to get questions back
      let result : any;
      switch (pageProcessExec) {
        case PageProcessExec.Reporting:
          result = await getReportingMeetingAboutTranscript(jsonFinal);
          setReportingMeeting(result);
          setIsAsking(true);
          setCurrentAsk(PageProcessExec.Reporting);
          setReportingMeetingLoading(false);
          break;
        case PageProcessExec.ActionPlan:
          result = await getActionPlanAboutTranscript(jsonFinal);
          setActionPlans(result);
          setIsAsking(true);
          setCurrentAsk(PageProcessExec.ActionPlan);
          setActionPlansLoading(false);
          break;
        case PageProcessExec.Question:
          result = await getQuestionsAboutTranscript(jsonFinal, questionCount);
          setQuestions(result);
          setIsAsking(true);
          setCurrentAsk(PageProcessExec.Question);
          setQuestionsLoading(false);
          break;
      }

    } catch(error) {
      console.error('Erreur lors du traitement:', error);
      console.log(error);
      alert('Erreur lors du traitement');
    }
  };

  function formateReportingMeeting() {
    if (isAsking && currentAsk == PageProcessExec.Reporting) {
      if (!reportingMeeting) {
        return <div className="no-reporting">Impossible de faire un compte-rendu</div>;
      } else {
        return (
          <div className="reporting-container">
            <h2 className="reporting-title">Compte-rendu :</h2>
            <p className="report-content">{reportingMeeting.reportContent}</p>
          </div>
        );
      }
    }
  }; 

  function formateActionPlans() {
    if (isAsking && currentAsk == PageProcessExec.ActionPlan) {
      if (!actionPlans) {
        return <div className="no-actionplan">Pas de plans d'actions identifié</div>;
      }

      return (
        <div className="action-plan-container">
          <h2 className="action-plan-title">Plan d'actions :</h2>
          <ul className="action-plan">
            {actionPlans.map((actionPlan, index) => (
              <li key={index} className="action-plan-item">{actionPlan.libelle}</li>
            ))}
          </ul>
        </div>
      );
    }
    
    return <div></div>;
  }; 

  function formateQuestions() {
    if (isAsking && currentAsk === PageProcessExec.Question) {
      if (!questions) {
        return <div className="no-questions">Aucune question n'a pu être identifiée</div>;
      }

      return (
        <div className="questions-container">
          {questions.map((question, questionIndex) => (
            <div key={`question-${questionIndex}`} className="question-block">
              <p className="question-title">{question.question}</p>
              <ul className="answers-list">
                {question.answers.map((answer, answerIndex) => (
                  <li key={`answer-${questionIndex}-${answerIndex}`} className={"answer-item" + (answer.isCorrect ? " correct-answer" : "")}>
                    {answer.option}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }

    return null;
  }
  
  return (
    <div>
      <h1>MS Teams Asking</h1>
      <form onSubmit={onSubmit}>
        <div className="file-upload-container">
          <label className="file-upload-label">
            Télécharger le fichier .vtt
            <input type="file" accept=".vtt" onChange={onFileChange} className="file-upload-input" />
          </label>
        </div>
        <div className="w-full">
          <div className="flex">
            <div className="w-1/3 relative bg-slate-200 p-4 stack-from-bottom">
              <button className="button" type="button" disabled={reportingMeetingLoading} onClick={onReportMeetingClick}>
                {reportingMeetingLoading ? 'Chargement...' : 'Générer le compte-rendu'}
              </button>
            </div>
            <div className="w-1/3 relative bg-slate-200 p-4 stack-from-bottom">
              <button className="button" type="button" disabled={actionPlansLoading} onClick={onActionPlanClick}>
                {actionPlansLoading ? 'Chargement...' : 'Générer le plan d\'action'}
              </button>
            </div>
            <div className="w-1/3 relative bg-slate-200 p-4 stack-from-bottom">
              <label className="row">
                Nombre de questions attendues:
                <input type="number" value={questionCount} onChange={onQuestionCountChange} />
              </label>
              <button className="row button" type="submit" disabled={questionsLoading}>
                {questionsLoading ? 'Chargement...' : 'Lister des questions'}
              </button>
            </div>
          </div>
        </div>

        {/* {questionsLoading && <div>Loader...</div>} */}
        {
          /* Remplacer cette ligne par un composant de loader */
        }
      </form>
      
      <div>
        {formateReportingMeeting()}
      </div>
      <div>
        {formateActionPlans()}
      </div>
      <div>
        {formateQuestions()}
      </div>
    </div>
  );
}
