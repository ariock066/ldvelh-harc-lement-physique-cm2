import React from "react";
import { GameHistoryItem } from "../types";
import { CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";

interface HistoryTimelineProps {
  history: GameHistoryItem[];
}

export default function HistoryTimeline({ history }: HistoryTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
        <Clock className="w-8 h-8 text-slate-300 mx-auto" />
        <p className="text-slate-500 font-sans text-xs">
          Pas encore de décisions mémorisées. Ton carnet de bord se templira au fil de tes choix !
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
        <h3 className="font-sans font-bold text-sm text-slate-700">📋 Carnet de décisions</h3>
        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
          {history.length} action{history.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-300">
        {history.slice().reverse().map((item, idx) => {
          let badgeColor = "bg-neutral-100 text-neutral-600 border-neutral-200";
          let badgeIcon = <AlertCircle className="w-3.5 h-3.5 text-neutral-500" />;
          let label = "Neutre (Passif)";

          if (item.scoreChange > 0) {
            badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
            badgeIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
            label = "Courageux/Actif";
          } else if (item.scoreChange < 0) {
            badgeColor = "bg-rose-50 text-rose-700 border-rose-100";
            badgeIcon = <XCircle className="w-3.5 h-3.5 text-rose-500" />;
            label = "Inadapté/Silence";
          }

          return (
            <div
              key={idx}
              className="bg-white border border-slate-100 rounded-xl p-3 text-xs space-y-2 relative shadow-2sm"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">
                  Tour {item.turn}
                </span>
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${badgeColor}`}>
                  {badgeIcon}
                  {label}
                </span>
              </div>
              <p className="text-slate-400 italic line-clamp-1">"{item.scenario}"</p>
              <p className="text-slate-700 font-medium">
                👉 <span className="text-slate-900">{item.chosenOptionText}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
