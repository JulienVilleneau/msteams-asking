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
    setReportingMeetingLoading(true);
    processExec(PageProcessExec.Reporting);
  };

  const onActionPlanClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionPlansLoading(true);
    processExec(PageProcessExec.ActionPlan);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        return;
      }

      const jsonFinal = transcriptAsJson(fileContent);

      // Call Azure OpenAI API to get questions back
      let result : any;
      switch (pageProcessExec) {
        case PageProcessExec.Reporting:
          result = await getReportingMeetingAboutTranscript(jsonFinal);
          setReportingMeeting(result);
          setReportingMeetingLoading(false);
          break;
        case PageProcessExec.ActionPlan:
          result = await getActionPlanAboutTranscript(jsonFinal);
          setActionPlans(result);
          setActionPlansLoading(false);
          break;
        case PageProcessExec.Question:
          result = await getQuestionsAboutTranscript(jsonFinal, questionCount);
          setQuestions(result);
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
    if (!reportingMeeting) {
      return <div>Impossible de faire un compte-rendu</div>;
    } else {
      return <div>{reportingMeeting.reportContent}</div>;
    }
  }; 

  function formateActionPlans() {
    let content = [];

    if (!actionPlans) {
      return <div>Pas de plans d'actions identifié</div>;
    }

    return (
      <div>
        <ul className="action-plan">
          {actionPlans.map((actionPlan, index) => (
            <li key={index}>{actionPlan.libelle}</li>
          ))}
        </ul>
      </div>
    );
  }; 

  function formateQuestions() {
    let content = []; 

    if (!questions) {
      return <div>Aucune question n'a pu être identifiée</div>;
    }

    let i = 0;
    for (const question of questions) {
      content.push(
        <div key={i}>
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
      i++;
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
        <div className="w-full">
          <div className="flex">
            <div className="w-1/3 relative bg-slate-200 p-4">
              <button className="button absolute bottom-0" type="button" disabled={reportingMeetingLoading} onClick={onReportMeetingClick}>
              {reportingMeetingLoading ? 'Chargement...' : 'Générer le compte-rendu'}
              </button>
            </div>
            <div className="w-1/3 relative bg-slate-200 p-4">
              <button className="button absolute bottom-0" type="button" disabled={actionPlansLoading} onClick={onActionPlanClick}>
                {actionPlansLoading ? 'Chargement...' : 'Générer le plan d\'action'}
              </button>
            </div>
            <div className="w-1/3 bg-slate-200 p-4">
              <label>
                Nombre de questions attendues:
                <input type="number" value={questionCount} onChange={onQuestionCountChange} />
              </label>
              <button className="button" type="submit" disabled={questionsLoading}>
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
