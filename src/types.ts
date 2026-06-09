export interface Choice {
  id: number;
  text: string;
  scoreChange: number;
  feedbackExplanation: string;
}

export interface GameHistoryItem {
  turn: number;
  scenario: string;
  chosenOptionId: number;
  chosenOptionText: string;
  scoreChange: number;
}

export interface GameStep {
  scenario: string;
  choices: Choice[];
}

export interface Avatar {
  id: string;
  name: string;
  icon: string;
  emoji: string;
  color: string;
}
