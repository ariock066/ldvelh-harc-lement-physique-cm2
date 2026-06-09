import React from "react";
import { Info, Phone, Users, Shield, BookOpen } from "lucide-react";

export default function InstructionCard() {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex items-center space-x-3 text-slate-800 border-b border-slate-100 pb-3">
        <BookOpen className="w-6 h-6 text-indigo-500" />
        <h3 className="font-sans font-bold text-lg">Ton guide de conseiller</h3>
      </div>

      {/* Difference between Warning & Snitching */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          Alerter n'est pas cafarder !
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
            <span className="font-bold text-emerald-700 block mb-1">📢 Alerter :</span>
            C'est rapporter des faits graves pour <strong className="text-emerald-800">aider, protéger ou sauver</strong> un camarade en danger. C'est un acte de courage et de citoyenneté.
          </div>
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
            <span className="font-bold text-rose-700 block mb-1">🤫 Cafarder :</span>
            C'est rapporter un petit secret ou une bêtise sans gravité uniquement pour <strong className="text-rose-800">faire punir ou nuire</strong> à quelqu'un.
          </div>
        </div>
      </div>

      {/* Collective and Adults */}
      <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
        <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          Le rôle des adultes et du groupe
        </h4>
        <p className="leading-relaxed">
          Le harcèlement se nourrit du <strong>secret et du silence</strong>. Face à un comportement agressif, n'essaie pas de résoudre tout seul la violence physique :
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li><strong>Préviens l'équipe de l'école</strong> : Maître/Maîtresse, surveillants, directrice, CPE. Ils sont formés et là pour vous protéger.</li>
          <li><strong>Fais groupe</strong> : Les harceleurs perdent leur pouvoir lorsque les témoins s'unissent pour soutenir la victime.</li>
        </ul>
      </div>

      {/* Support Number */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-900">
        <Phone className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-sm text-amber-800">Harcèlement scolaire ? Info service :</span>
          <span className="text-lg font-black tracking-wider text-amber-600">3018</span>
          <p className="mt-1 text-[10px] text-amber-700 leading-tight">
            Numéro d'appel gratuit, anonyme et confidentiel en France pour les parents, les enfants et les enseignants.
          </p>
        </div>
      </div>
    </div>
  );
}
