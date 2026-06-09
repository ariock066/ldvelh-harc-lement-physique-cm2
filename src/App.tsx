import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, 
  Heart, 
  HelpCircle, 
  Play, 
  ArrowRight, 
  RotateCcw, 
  Award, 
  AlertCircle, 
  BookOpen, 
  User, 
  School, 
  Utensils, 
  MapPin, 
  Users, 
  Lock,
  Compass,
  MessageCircle,
  Lightbulb,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { Avatar, GameHistoryItem, GameStep } from "./types";
import InstructionCard from "./components/InstructionCard";
import HistoryTimeline from "./components/HistoryTimeline";

const AVATARS: Avatar[] = [
  { id: "alex", name: "Alex", emoji: "👦", icon: "alex", color: "from-blue-400 to-indigo-500" },
  { id: "clara", name: "Clara", emoji: "👧", icon: "clara", color: "from-pink-400 to-rose-500" },
  { id: "camille", name: "Camille", emoji: "🧑", icon: "camille", color: "from-teal-400 to-emerald-500" },
  { id: "maxence", name: "Maxence", emoji: "🧒", icon: "maxence", color: "from-amber-400 to-orange-500" },
];

const EDUCATIONAL_TIPS = [
  "Un témoin a autant de pouvoir que le harceleur. Ton action peut tout changer !",
  "Alerter la maîtresse, ce n'est pas cafarder : c'est venir en aide à un camarade.",
  "Le harcèlement se nourrit du silence. Briser le secret est le premier pas.",
  "La maîtresse, la directrice et les surveillants sont là pour vous écouter et vous aider.",
  "Le numéro gratuit 3018 est confidentiel et écoute les élèves et les parents.",
  "L'union fait la force. Si tous les camarades s'opposent aux moqueries, elles s'arrêtent."
];

export default function App() {
  const [screen, setScreen] = useState<"intro" | "playing" | "end">("intro");
  const [playerName, setPlayerName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar>(AVATARS[0]);
  
  // Game States
  const [turn, setTurn] = useState(1);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [currentStep, setCurrentStep] = useState<GameStep | null>(null);
  
  // Interactive Feedback (after clicking a choice, before continuing)
  const [selectedChoiceId, setSelectedChoiceId] = useState<number | null>(null);
  const [choiceFeedback, setChoiceFeedback] = useState<{
    text: string;
    scoreChange: number;
    explanation: string;
  } | null>(null);

  // Status variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate educational tips during loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % EDUCATIONAL_TIPS.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Load first step when game starts
  const startGame = async () => {
    const finalName = playerName.trim() || selectedAvatar.name;
    setPlayerName(finalName);
    setScreen("playing");
    setTurn(1);
    setScore(0);
    setHistory([]);
    setSelectedChoiceId(null);
    setChoiceFeedback(null);
    await fetchNextStep(finalName, 1, 0, []);
  };

  const shuffleDeterministic = <T,>(array: T[], seed: number): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Use a seed-based pseudo-random generator with sine to remain stable across renders
      const j = Math.floor((Math.abs(Math.sin(seed + i)) * 1000) % (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
    return shuffled;
  };

  const getOfflineStep = (name: string, turnNum: number, currentScore: number): GameStep => {
    if (turnNum === 21) {
      if (currentScore >= 12) {
        return {
          scenario: `LA BONNE FIN : Grâce au courage et à la vigilance de ${name}, la parole s'est libérée de façon spectaculaire au sein de l'école. Tu as osé avertir la maîtresse, rassurer Lucas lors des moments difficiles, et mobiliser le reste de la classe dans la cour. Thomas a été convoqué par la directrice de l'école pour un rappel à l'ordre ferme et des sanctions constructives. Lucas n'est désormais plus isolé : il a retrouvé sa confiance, sourit à nouveau et partage joyeusement ses magnifiques dessins avec tout le monde. Ensemble, vous avez démontré qu'agir de manière collective est la clé pour repousser le harcèlement !`,
          choices: [
            { id: 1, text: "Terminer et célébrer cette victoire citoyenne", scoreChange: 0, feedbackExplanation: "Félicitations pour tes gestes héroïques et bienveillants !" }
          ]
        };
      } else if (currentScore >= 5) {
        return {
          scenario: `LA FIN MOYENNE : ${name} a fait de louables efforts pour soutenir son camarade, mais par moments, l'hésitation ou la peur de faire des vagues a freiné tes interventions. Après de nouvelles brimades le dernier mois, l'équipe enseignante a fini par être correctement alertée et Thomas a reçu un rappel à l'ordre officiel. Cependant, pour Lucas, la blessure intérieure accumulée était déjà profonde et son angoisse quotidienne trop lourde à porter. Ses parents ont pris la décision de l'inscrire dans un autre collège pour la rentrée prochaine afin de lui offrir un nouveau départ. La classe garde un sentiment mitigé, regrettant de ne pas avoir fait bloc beaucoup plus tôt.`,
          choices: [
            { id: 1, text: "Recommencer pour tenter d'obtenir une issue plus heureuse", scoreChange: 0, feedbackExplanation: "Chaque geste posé tôt peut changer tout le destin de Lucas !" }
          ]
        };
      } else {
        return {
          scenario: `LA MAUVAISE FIN : Le silence pesant a régné durant toute cette année scolaire. Thomas a continué ses intimidations physiques et ses brimades répétées au quotidien sous les yeux passifs ou complices d'une classe silencieuse. Lucas s'est totalement renfermé sur lui-même, ses notes ont chuté en flèche et sa tristesse est devenue permanente. L'entrée en classe de sixième s'annonce d'autant plus inquiétante que Thomas prévoit de continuer ses méchancetés. Tu ressens un profond regret de ne pas avoir parlé à un adulte ou d'avoir ri pour préserver ton statut. Ta passivité a indirectement légitimé ces actes.`,
          choices: [
            { id: 1, text: "Prendre un nouveau départ et surmonter le silence", scoreChange: 0, feedbackExplanation: "La bienveillance est une force active, ne reste jamais spectateur passif !" }
          ]
        };
      }
    }

    const staticScenarios: Record<number, GameStep> = {
      1: {
        scenario: `Aujourd'hui, c'est la récréation du matin. Dans la cour de l'école, tu aperçois Lucas, un élève discret de ta classe de CM2. Thomas, un garçon plus grand et intimidant, s'approche de lui et le bouscule brusquement de l'épaule. Les affaires de Lucas (son cahier de dessin et ses feutres) tombent par terre et se dispersent sur le goudron. Lucas baisse la tête, visiblement humilié, sans oser réagir.`,
        choices: [
          { id: 1, text: "S'approcher de Lucas pour l'aider à ramasser ses feutres et lui demander s'il va bien.", scoreChange: 1, feedbackExplanation: "Bravo ! En faisant cela, tu montres à Lucas qu'il a du soutien et tu brises l'effet de spectateur." },
          { id: 2, text: "Observer de loin sans bouger, en espérant que le surveillant de la cour verra ce qui se passe.", scoreChange: 0, feedbackExplanation: "C'est une réaction compréhensible par peur d'avoir des ennuis, mais Lucas reste seul face à sa détresse." },
          { id: 3, text: "Ricaner avec les copains de Thomas pour éviter d'être la prochaine cible.", scoreChange: -1, feedbackExplanation: "Attention ! Rire ou cautionner, c'est encourager le harceleur et lui donner de la puissance." }
        ]
      },
      2: {
        scenario: `C'est l'heure du repas à la cantine. Thomas s'installe à la table de Lucas et tire violemment son plateau repas vers lui en rigolant. 'T'as pas besoin de manger toi, donne-moi tes frites !', lui lance-t-il. Plusieurs élèves de CM2 observent la scène en silence. Lucas regarde son plateau vide en serrant les poings.`,
        choices: [
          { id: 1, text: "Dire calmement à haute voix : 'Arrête Thomas, rends-lui ses frites, c'est pas drôle du tout.'", scoreChange: 1, feedbackExplanation: "Super ! Ton courage encourage les autres à réprouver le comportement de Thomas." },
          { id: 2, text: "Continuer à manger sans faire de bruit pour préserver ton propre calme.", scoreChange: 0, feedbackExplanation: "Ton silence permet à Thomas d'agir en toute impunité." },
          { id: 3, text: "Dire à Lucas : 'Allez, laisse-lui, de toute façon elles ont l'air froides.'", scoreChange: -1, feedbackExplanation: "Mauvaise idée. Tu minimises l'agression et tu demandes à la victime de se soumettre." }
        ]
      },
      3: {
        scenario: `En retournant en classe, tu croises Lucas en larmes dans le couloir. Ses crayons de couleur fétiches sont cassés et éparpillés par terre. Thomas passe à côté en sifflotant avec un air de défi. Personne d'autre n'est là pour assister à la scène.`,
        choices: [
          { id: 1, text: "Consoler Lucas et l'accompagner pour en parler immédiatement à la maîtresse.", scoreChange: 1, feedbackExplanation: "Excellent ! Prévenir la maîtresse n'est pas du cafardage, c'est assister un camarade en détresse." },
          { id: 2, text: "Aider Lucas à ramasser ses débris de crayons mais lui conseiller de ne rien dire pour éviter les représailles.", scoreChange: 0, feedbackExplanation: "L'aider est gentil, mais encourager le silence permet au harcèlement de durer." },
          { id: 3, text: "Lui dire : 'Tu es trop fragile, Lucas, tu devrais garder tes crayons dans ton cartable.'", scoreChange: -1, feedbackExplanation: "Aïe. Blâmer la victime accentue sa culpabilité et disculpe le harceleur." }
        ]
      },
      4: {
        scenario: `Pendant le cours d'EPS (sport), la classe doit former deux équipes de football. Thomas est nommé capitaine de l'équipe des Blancs. Au moment où Lucas est le dernier sur le banc, Thomas le désigne du doigt en criant : 'Je ne veux pas de ce boulet dans mon équipe ! Il sait même pas courir !'`,
        choices: [
          { id: 1, text: "Lever la main et dire à l'enseignant de sport : 'Monsieur, on peut intégrer Lucas avec nous ? On a besoin d'un bon joueur.'", scoreChange: 1, feedbackExplanation: "Formidable ! Inclure Lucas brise sa solitude et montre qu'il a toute sa place dans le sport." },
          { id: 2, text: "Ne rien dire et attendre que l'enseignant de EPS règle le placement d'autorité.", scoreChange: 0, feedbackExplanation: "Hésiter laisse Lucas blessé et humilié sur le banc sous le regard de tous." },
          { id: 3, text: "Murmurer à ton voisin : 'C'est vrai qu'il est super lent au foot...'", scoreChange: -1, feedbackExplanation: "C'est blessant. Tu renforces le préjugé de rejet alimenté par Thomas." }
        ]
      },
      5: {
        scenario: `Le lendemain matin avant la sonnerie, dans la cour, Thomas et ses copains coincent Lucas contre le grillage de l'école. Thomas lui fait un croche-pattes répétitif tandis que ses comparses lui confisquent sa casquette favorite. Lucas tente de se dégager, mais ils bloquent ses mouvements.`,
        choices: [
          { id: 1, text: "Courir directement chercher le surveillant de récréation pour qu'il intervienne.", scoreChange: 1, feedbackExplanation: "Parfait ! Face à de l'intimidation physique de groupe, alerter un adulte s'impose pour la sécurité." },
          { id: 2, text: "Crier de loin 'Eh laissez-le !' puis partir d'un autre côté par peur de te faire coincer aussi.", scoreChange: 0, feedbackExplanation: "Tu as essayé brièvement, mais abandonner Lucas le laisse désemparé face au groupe." },
          { id: 3, text: "Rire de la casquette rigolote de Lucas que Thomas fait tourner dans les airs.", scoreChange: -1, feedbackExplanation: "Très négatif. Tu prends le parti des persécuteurs physiques, blessant profondément Lucas." }
        ]
      }
    };

    let step: GameStep;
    if (staticScenarios[turnNum]) {
      // Clone so we don't mutate static configuration
      step = {
        scenario: staticScenarios[turnNum].scenario,
        choices: [...staticScenarios[turnNum].choices]
      };
    } else {
      const places = [
        "lors de la sortie des classes devant le portail d'entrée",
        "près du grand préau pendant une averse",
        "dans les vestiaires après le cours d'éducation physique",
        "lors d'un atelier collectif d'histoire-géographie",
        "dans le couloir de la bibliothèque",
        "sur le chemin du retour à la maison près du square de quartier",
        "pendant la pause de l'après-midi à proximité des bancs"
      ];
      const place = places[turnNum % places.length];

      const actions = [
        "Thomas bouscule à nouveau Lucas et cherche à faire basculer son sac d'école à terre.",
        "Thomas lui bloque agressivement le passage dans l'escalier avec un air sombre et intimidant.",
        "Thomas détourne le cahier de cours de Lucas et fait mine de vouloir le déchirer s'il refuse de lui donner son goûter.",
        "Thomas lui assène des moqueries répétitives devant d'autres élèves de l'école."
      ];
      const action = actions[turnNum % actions.length];

      step = {
        scenario: `[Jour ${Math.ceil(turnNum / 3)}, Étape ${turnNum}/20] Alors que vous vous trouvez ${place}, une nouvelle confrontation se prépare. ${action} Lucas est anxieux, cherche de l'aide du regard et n'ose pas riposter par crainte d'aggraver la situation.`,
        choices: [
          { id: 1, text: "S'interposer pacifiquement ou proposer à Lucas de venir jouer avec d'autres camarades de classe pour désamorcer l'agression.", scoreChange: 1, feedbackExplanation: "Génial ! Le collectif est l'arme pacifique la plus puissante contre les intimidations répétées." },
          { id: 2, text: "Considérer que cela se passe entre eux et s'éloigner pour observer comment la situation évolue.", scoreChange: 0, feedbackExplanation: "Attendre passivement n'apporte aucun réconfort à une victime en situation d'impuissance face à son harceleur." },
          { id: 3, text: "Te moquer toi aussi ou dire à Thomas de l'embêter plus fort pour prouver ta complicité.", scoreChange: -1, feedbackExplanation: "C'est dramatique. Tu deviens un harceleur de soutien et tu aggraves le calvare quotidien de Lucas." }
        ]
      };
    }

    // Shuffle the choices deterministically using turnNum as seed, then overwrite ids (1, 2, 3) to render in order
    if (step.choices && step.choices.length > 1) {
      step.choices = shuffleDeterministic(step.choices, turnNum).map((choice, idx) => ({
        ...choice,
        id: idx + 1
      }));
    }

    return step;
  };

  const fetchNextStep = async (
    name: string,
    currentTurn: number,
    currentScore: number,
    gameHistory: GameHistoryItem[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate offline dynamic master of the game thinking time for 500ms
      await new Promise((resolve) => setTimeout(resolve, 500));
      const step = getOfflineStep(name, currentTurn, currentScore);
      setCurrentStep(step);
    } catch (err: any) {
      console.error(err);
      setError("Le maître du jeu a rencontré une hésitation imprévue. Mais l'aventure continue !");
    } finally {
      setLoading(false);
    }
  };

  // Handle pupil's choice
  const handleChoiceSelect = (choice: any) => {
    if (choiceFeedback) return; // Prevent double select before continuing
    setSelectedChoiceId(choice.id);
    setChoiceFeedback({
      text: choice.text,
      scoreChange: choice.scoreChange,
      explanation: choice.feedbackExplanation,
    });
  };

  // Confirm choice feedback and load next step
  const handleContinue = async () => {
    if (!currentStep || !choiceFeedback || selectedChoiceId === null) return;

    const newScore = score + choiceFeedback.scoreChange;
    const newHistoryItem: GameHistoryItem = {
      turn,
      scenario: currentStep.scenario,
      chosenOptionId: selectedChoiceId,
      chosenOptionText: choiceFeedback.text,
      scoreChange: choiceFeedback.scoreChange,
    };
    const updatedHistory = [...history, newHistoryItem];

    const nextTurn = turn + 1;
    setScore(newScore);
    setHistory(updatedHistory);
    setTurn(nextTurn);
    
    // Reset selection feedback
    setSelectedChoiceId(null);
    setChoiceFeedback(null);

    if (nextTurn > 21) {
      // Reached the endgame limit
      setScreen("end");
    } else {
      await fetchNextStep(playerName, nextTurn, newScore, updatedHistory);
    }
  };

  // Restart clean game state
  const resetGame = () => {
    setScreen("intro");
    setPlayerName("");
    setTurn(1);
    setScore(0);
    setHistory([]);
    setCurrentStep(null);
    setSelectedChoiceId(null);
    setChoiceFeedback(null);
  };

  // Compute suitable scene icons
  const getSceneIcon = (scenario: string) => {
    const text = scenario.toLowerCase();
    if (text.includes("cantine") || text.includes("repas") || text.includes("plateau") || text.includes("fles") || text.includes("cantiner")) {
      return <Utensils className="w-5 h-5 text-amber-500" />;
    }
    if (text.includes("sport") || text.includes("eps") || text.includes("foot") || text.includes("vestiaire")) {
      return <Compass className="w-5 h-5 text-indigo-500" />;
    }
    if (text.includes("couloir") || text.includes("classe") || text.includes("escalier") || text.includes("bibliothèque")) {
      return <School className="w-5 h-5 text-teal-400" />;
    }
    return <MapPin className="w-5 h-5 text-rose-500" />;
  };

  // Get localized location names
  const getSceneLocation = (scenario: string, turnNum: number) => {
    const text = scenario.toLowerCase();
    if (text.includes("cantine") || text.includes("repas") || text.includes("plateau")) {
      return "Le Réfectoire / La Cantine";
    }
    if (text.includes("sport") || text.includes("eps") || text.includes("foot") || text.includes("vestiaire")) {
      return "Le Terrain de Sport / Vestiaires";
    }
    if (text.includes("classe") || text.includes("travail de groupe")) {
      return "La Salle de Classe (CM2)";
    }
    if (text.includes("couloir") || text.includes("escalier") || text.includes("bibliothèque")) {
      return "Les Couloirs de l'École";
    }
    if (text.includes("chemin") || text.includes("retour") || text.includes("parc") || text.includes("portail")) {
      return "Chemin de l'École / Extérieur";
    }
    return `Cour de Récréation (Jour ${Math.ceil(turnNum / 3)})`;
  };

  return (
    <div className="min-h-screen bg-[#F8F4F0] flex flex-col justify-between selection:bg-blue-100 selection:text-blue-800">
      
      {/* Header with Artistic Flair styling */}
      <header id="app-header" className="bg-white border-b border-gray-200 py-5 px-6 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1024px] mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl shadow-sm border border-blue-100">
              🎒
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#3B82F6] font-bold block">Interactif • CM2</span>
              <h1 className="font-sans font-extrabold text-slate-800 text-lg md:text-xl">L'Aventure du Courage</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-end space-y-1.5">
              <div className="flex space-x-1" id="progress-steps-flair-container">
                {Array.from({ length: 20 }).map((_, index) => {
                  const stepNum = index + 1;
                  const isActive = turn === stepNum;
                  const isCompleted = turn > stepNum;
                  return (
                    <div
                      key={index}
                      className={`progress-step-flair ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                      title={`Étape ${stepNum}`}
                    />
                  );
                })}
              </div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                Tour {turn <= 20 ? turn : 20} sur 20
              </span>
            </div>

            {screen === "playing" && (
              <button
                id="btn-quit"
                onClick={resetGame}
                className="text-xs bg-[#F8F4F0] hover:bg-slate-200/60 text-slate-600 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 border border-slate-200/50"
              >
                <RotateCcw className="w-3 h-3" />
                Quitter
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-[1024px] w-full mx-auto p-4 md:p-8 flex flex-col justify-center">
        
        {/* Scenario Select / Character Creation */}
        {screen === "intro" && (
          <motion.div
            id="intro-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-200/60 p-6 md:p-10 max-w-3xl mx-auto w-full space-y-8"
          >
            <div className="text-center space-y-3">
              <span className="text-[10px] bg-blue-50 text-blue-600 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-blue-100">
                Livre dont tu es le héros
              </span>
              <h2 className="serif-font font-bold italic text-2xl md:text-3.5xl text-slate-800 leading-tight">
                L'aventure de Lucas : Seras-tu un témoin courageux ?
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm md:text-base max-w-2xl mx-auto font-serif italic text-balance">
                Tu es élève en CM2. Tu remarques que ton camarade <strong>Lucas</strong> est victime de bousculades et de méchancetés répétées de la part de <strong>Thomas</strong>. Tes décisions vont orienter le destin de Lucas sur 20 moments clés d'école. Découvre l'importance d'agir face au harcèlement !
              </p>
            </div>

            {/* Character Setup */}
            <div className="space-y-6 bg-[#F8F4F0] p-6 rounded-2xl border border-slate-200/50">
              <div className="space-y-2">
                <label className="text-slate-700 block font-bold text-sm" htmlFor="name-input">
                  👤 Choisis ton prénom de jeu (Témoin) :
                </label>
                <input
                  id="name-input"
                  type="text"
                  maxLength={16}
                  placeholder={`Ex: ${selectedAvatar.name}`}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 font-sans shadow-inner transition"
                />
              </div>

              {/* Avatar Selector */}
              <div className="space-y-3">
                <span className="text-slate-700 block font-bold text-sm">
                  🎨 Choisis ton personnage / avatar :
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {AVATARS.map((avatar) => {
                    const isSelected = selectedAvatar.id === avatar.id;
                    return (
                      <button
                        key={avatar.id}
                        id={`avatar-option-${avatar.id}`}
                        onClick={() => {
                          setSelectedAvatar(avatar);
                          if (!playerName) {
                            setPlayerName(""); // Let fallback stay if manually cleaned
                          }
                        }}
                        className={`flex flex-col items-center p-3 rounded-xl border-2 transition text-left cursor-pointer ${
                          isSelected
                            ? "bg-white border-blue-500 ring-2 ring-blue-100 shadow-sm"
                            : "bg-[#F8F4F0] border-slate-300/60 hover:bg-slate-100"
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${avatar.color} flex items-center justify-center text-2xl shadow-sm mb-2`}>
                          {avatar.emoji}
                        </div>
                        <span className="text-xs font-bold text-slate-800 text-center">{avatar.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CTA action */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-2">
              <button
                id="btn-start-game"
                onClick={startGame}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold font-sans flex items-center justify-center gap-2 shadow-sm transition hover:shadow-md cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
              >
                <Play className="w-5 h-5 fill-white text-white" />
                Commencer l'Aventure
              </button>
            </div>

            {/* Quick Educational Fact */}
            <div className="text-center font-sans text-xs text-slate-500 flex items-center justify-center gap-1.5 pt-4 border-t border-slate-100">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Conforme aux programmes d'Éducation Civique de l'Éducation Nationale française (CM2).</span>
            </div>
          </motion.div>
        )}

        {/* Game Core Screen */}
        {screen === "playing" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1024px] mx-auto w-full">
            
            {/* LEFT / CENTER WORKPLACE - NARRATIVE AND CHOICES */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Progress and HUD bar */}
              <div id="game-hud" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-600 font-bold border border-blue-100 px-3 py-1 rounded-full uppercase text-[10px] tracking-wide">
                      Étape {turn} / 20
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-bold text-slate-600">Aventurier : {playerName} {selectedAvatar.emoji}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-slate-400">
                    <Heart className="w-4 h-4 text-blue-500 fill-blue-500" />
                    <span>Progression</span>
                  </div>
                </div>

                {/* Simulated Progress Slider Indicator */}
                <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (turn / 20) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Main Narrative Card */}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-3xl border border-slate-200/80 p-10 shadow-sm text-center min-h-[350px] flex flex-col justify-center items-center space-y-8"
                  >
                    {/* Animated spinner for school adventure */}
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                      <div className="absolute top-0 left-0 w-16 h-16 flex items-center justify-center text-xl">
                        🎒
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-slate-800 font-bold text-lg serif-font">Le Maître du Jeu prépare l'histoire...</p>
                      <p className="text-slate-400 text-xs italic">La journée se profile de manière immersive...</p>
                    </div>

                    {/* Fun informative fact rotation during loading to teach children */}
                    <div className="bg-[#F8F4F0] border border-slate-200/60 rounded-2xl p-5 max-w-md mx-auto space-y-2">
                      <span className="text-[10px] bg-blue-50 text-blue-600 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Le Savais-tu ?
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans">
                        "{EDUCATIONAL_TIPS[tipIndex]}"
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={turn}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div id="narrative-card" className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
                      {/* Decorative large quotes for Artistic Flair theme */}
                      <span className="serif-font text-8xl text-slate-200/40 select-none absolute -top-4 -left-1 font-extrabold">“</span>
                      
                      {/* Top background accent based on location */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500" />
                      
                      {/* Location Badge */}
                      {currentStep && (
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4 relative z-10">
                          <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
                            {getSceneIcon(currentStep.scenario)}
                            <span className="serif-font italic">{getSceneLocation(currentStep.scenario, turn)}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold font-mono">SCÈNE • {turn}</span>
                        </div>
                      )}

                      {/* Scenario Narrative */}
                      {currentStep && (
                        <div className="space-y-4 relative z-10">
                          <p className="text-slate-800 serif-font text-lg md:text-xl leading-relaxed italic text-balance pl-2 border-l-2 border-blue-100">
                            {currentStep.scenario}
                          </p>
                        </div>
                      )}

                      {error && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs flex items-start gap-2 relative z-10">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Note pédagogique :</span>
                            {error}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Interactive feedback card block (If selected but not continued yet) */}
                    {choiceFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border rounded-2xl p-6 shadow-sm border-blue-200 bg-blue-50/10 space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500">Action sélectionnée :</span>
                          {choiceFeedback.scoreChange > 0 && (
                            <span className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Choix Constructif (+1)
                            </span>
                          )}
                          {choiceFeedback.scoreChange === 0 && (
                            <span className="bg-amber-50 text-amber-700 border-amber-200 border text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Choix Neutre (+0)
                            </span>
                          )}
                          {choiceFeedback.scoreChange < 0 && (
                            <span className="bg-rose-50 text-rose-700 border-rose-200 border text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              Choix Inadapté (-1)
                            </span>
                          )}
                        </div>
                        
                        <p className="font-bold text-slate-800 text-sm italic font-serif bg-slate-50 p-3 rounded-lg border border-slate-100">
                          "{choiceFeedback.text}"
                        </p>

                        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-xs text-slate-600 leading-relaxed font-sans shadow-inner">
                          <strong className="text-slate-800 block mb-1">💡 Pourquoi ce choix ?</strong>
                          {choiceFeedback.explanation}
                        </div>

                        <div className="flex justify-end">
                          <button
                            id="btn-continue-game"
                            onClick={handleContinue}
                            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition cursor-pointer"
                          >
                            <span>Continuer mon aventure</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* 3 Numbered Choices Buttons */}
                    {!choiceFeedback && currentStep && currentStep.choices && (
                      <div id="choices-container" className="space-y-4">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">
                          Que décides-tu de faire ? (Choisis une action)
                        </span>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {currentStep.choices.map((choice) => (
                            <button
                              key={choice.id}
                              id={`choice-btn-${choice.id}`}
                              onClick={() => handleChoiceSelect(choice)}
                              className="w-full text-left bg-white hover:bg-[#FDFBF7] border border-slate-200 hover:border-blue-300 rounded-2xl p-5 flex items-start space-x-4 text-sm md:text-base text-slate-800 font-sans transition-all duration-200 hover:shadow-md cursor-pointer choice-card-flair active:scale-[0.99] border-l-4 hover:border-l-blue-500"
                            >
                              <div className="bg-blue-50 text-blue-600 font-semibold w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-serif">
                                {choice.id}
                              </div>
                              <span className="font-medium self-center">{choice.text}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT SIDEBAR - DECISIONS HISTORIC AND PEDAGOGICAL RESOURCES */}
            <div className="space-y-6">
              
              {/* Citizenship performance badge */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Award className="w-20 h-20 text-slate-800" />
                </div>
                <span className="text-[10px] text-slate-400 block uppercase font-extrabold tracking-widest">Score du Citoyen</span>
                <div className="text-xl font-extrabold text-slate-800 flex items-center justify-center gap-1 serif-font">
                  <span>✨</span>
                  {score >= 8 ? (
                    <span className="text-emerald-600 font-bold">Protecteur attentif</span>
                  ) : score >= 2 ? (
                    <span className="text-amber-600 font-bold">Témoin bienveillant</span>
                  ) : (
                    <span className="text-slate-500 font-bold">Simple spectateur</span>
                  )}
                  <span>✨</span>
                </div>
                <p className="text-[10px] text-slate-400">Ce score s'enrichit suivant tes choix.</p>
              </div>

              {/* History Timeline of Choices */}
              <HistoryTimeline history={history} />

              {/* Pedagogical Guidance Cards */}
              <InstructionCard />
            </div>
            
          </div>
        )}

        {/* Conclusion Game End Screen */}
        {screen === "end" && (
          <motion.div
            id="end-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200/85 p-6 md:p-10 max-w-[1024px] mx-auto w-full space-y-8 shadow-xl"
          >
            <div className="text-center space-y-3">
              <Award className="w-16 h-16 text-blue-500 mx-auto animate-bounce" />
              <span className="text-[10px] bg-blue-50 text-blue-600 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-blue-100">
                Fin de l'Aventure de CM2
              </span>
              <h2 className="serif-font font-bold italic text-2xl md:text-3xl text-slate-800 font-serif">
                L'ambiance finale de l'année scolaire
              </h2>
            </div>

            {/* Main Ending Narrative Container */}
            <div id="narrative-conclusion" className={`rounded-2xl p-6 md:p-8 border leading-relaxed space-y-4 shadow-sm relative overflow-hidden ${
              score >= 12
                ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                : score >= 5
                ? "bg-amber-50/50 border-amber-200 text-amber-950"
                : "bg-slate-50 border-slate-200 text-slate-950"
            }`}>
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-500" />
              
              <h3 className="font-bold serif-font text-lg flex items-center gap-2">
                {score >= 12 ? (
                  <>🎉 Une Grande Victoire pour Lucas</>
                ) : score >= 5 ? (
                  <>😔 Un Goût Inachevé</>
                ) : (
                  <>💔 Le Fardeau du Silence</>
                )}
              </h3>

              <p className="text-sm md:text-base whitespace-pre-line leading-relaxed serif-font italic text-balance">
                {currentStep?.scenario}
              </p>
            </div>

            {/* Analytical Citizenship Score Recap */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#F8F4F0] rounded-xl p-4 text-center border border-slate-200/50 shadow-sm">
                <span className="text-slate-500 text-xs block mb-1 font-serif italic font-bold">Actions constructives</span>
                <span className="text-2xl font-extrabold text-emerald-600 block">
                  {history.filter(h => h.scoreChange > 0).length}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Soutien fort à Lucas, alerte d'adultes protecteurs.</p>
              </div>

              <div className="bg-[#F8F4F0] rounded-xl p-4 text-center border border-slate-200/50 shadow-sm">
                <span className="text-slate-500 text-xs block mb-1 font-serif italic font-bold">Actions passives</span>
                <span className="text-2xl font-extrabold text-amber-600 block">
                  {history.filter(h => h.scoreChange === 0).length}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Incertitudes, observation timide, silence.</p>
              </div>

              <div className="bg-[#F8F4F0] rounded-xl p-4 text-center border border-slate-200/50 shadow-sm">
                <span className="text-slate-500 text-xs block mb-1 font-serif italic font-bold">Actions maladroites</span>
                <span className="text-2xl font-extrabold text-rose-600 block">
                  {history.filter(h => h.scoreChange < 0).length}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Soutien aux harceleurs par rire ou refus de coopérer.</p>
              </div>
            </div>

            {/* Action checklist lessons summaries */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 text-blue-950 space-y-3 font-sans">
              <h4 className="font-bold text-sm flex items-center gap-1.5 text-blue-900 font-serif italic">
                <Lightbulb className="w-4 h-4 text-blue-500" />
                Ce qu'il faut retenir pour la vraie vie
              </h4>
              <ul className="text-xs space-y-2 leading-relaxed list-disc list-inside">
                <li><strong>Ne reste jamais seul</strong> : Un témoin courageux avertit l'enseignant, le CPE, la directrice ou un surveillant.</li>
                <li><strong>Soutiens tes camarades</strong> : Lucas ou toute autre victime ne doit pas se sentir exclu de la récréation.</li>
                <li><strong>Défends le collectif</strong> : Un groupe uni contre le harcèlement est infiniement plus fort qu'un intimidateur.</li>
              </ul>
            </div>

            {/* Restart Button options */}
            <div className="flex justify-center flex-col sm:flex-row gap-4 pt-2">
              <button
                id="btn-restart"
                onClick={resetGame}
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold font-sans flex items-center justify-center gap-2 shadow-sm transition hover:-translate-y-0.5 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5" />
                Prendre un nouveau départ
              </button>
            </div>
          </motion.div>
        )}

      </main>

      {/* Footer */}
      <footer id="app-footer" className="bg-slate-800 text-slate-400 py-6 px-6 text-center text-xs mt-10">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-medium text-slate-300">
            Ensemble scolaire Notre Dame de la Tramontane
          </p>
          <p className="text-[11px] text-slate-500">
            Jeu conçu de manière interactive et sécurisée. Toutes les situations s'inspirent des recommandations d'experts pour éveiller l'empathie et le discernement des enfants (9-11 ans). Appelle le <strong className="text-slate-300">3018</strong> si toi ou un proche êtes en difficulté.
          </p>
        </div>
      </footer>

    </div>
  );
}
