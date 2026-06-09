import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/game/next-step", async (req, res) => {
  const { playerName, currentTurn, score, history } = req.body;

  try {
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not configured, using fallback game content");
      // Seamless educational fallback if API key is not configured yet
      return res.json(getFallbackStep(currentTurn, score));
    }

    let prompt = "";
    let systemInstruction = "";

    if (currentTurn <= 20) {
      systemInstruction = `Tu es le maître du jeu bienveillant d'une aventure interactive textuelle (type "Livre dont vous êtes le héros") destinée à des élèves de CM2 (9-11 ans) en France.
Le thème est la lutte contre le harcèlement scolaire, spécifiquement le harcèlement physique.
Le joueur incarne un témoin direct, un élève nommé ${playerName || "un élève de la classe"}.
La victime s'appelle Lucas. Lucas est un élève timide, gentil, qui aime dessiner.
Le harceleur principal s'appelle Thomas, parfois suivi par d'autres élèves de la classe qui rient ou restent passifs.
Le but est de faire comprendre que le témoin a un pouvoir d'agir capital ("Alerter n'est pas cafarder", "L'union fait la force", s'adresser aux adultes).

RÈGLES DU STAGE ACTUEL (Tour ${currentTurn} / 20) :
- Décris la situation brièvement en français (maximum 4-5 phrases).
- Ne décris JAMAIS de violences physiques extrêmes ou graphiques. Reste sur des bousculades, croche-pattes, moqueries, intimidations, ou affaires abîmées/confisquées de façon réaliste et adaptée à l'école primaire.
- ProposeSTRICTEMENT 3 choix d'actions numérotés 1, 2, 3 qui reflètent :
  * Un choix courageux, actif et constructif (soutenir Lucas, chercher de l'aide d'un adulte comme la maîtresse, la directrice, informer la classe de manière collective) -> \`scoreChange\` = 1.
  * Un choix passif ou hésitant (regarder sans agir, espérer que quelqu'un d'autre agira, ou s'éloigner par malaise) -> \`scoreChange\` = 0.
  * Un choix négatif, maladroit, complice ou peureux (rejeter la faute sur Lucas, rire avec Thomas pour ne pas avoir d'ennuis, garder le silence total même si la maîtresse pose des questions) -> \`scoreChange\` = -1.

Progresse dans l'histoire jour après jour, récréation après récréation, pour simuler un harcèlement répété dans le temps. C'est l'accumulation qui crée le harcèlement scolaire.
Le tour ou étape actuelle est le Tour ${currentTurn}/20.`;

      prompt = `Voici l'historique des événements de notre aventure jusqu'à présent :
${history && history.length > 0 
  ? history.map((item: any) => `Tour ${item.turn}:
Situation: ${item.scenario}
L'élève a choisi: "${item.chosenOptionText}"`).join("\n\n")
  : "Début de l'aventure."}

Génère la nouvelle scène du Tour ${currentTurn} avec ses 3 choix d'actions. L'historique montre la progression chronologique, s'il te plaît continue d'écrire la suite directe logique. Si on approche du Tour 20, fais monter la tension (Lucas est de plus en plus isolé et triste, Thomas l'intimide davantage) pour préparer le choix final. Actuellement, le joueur a accumulé un score d'action de ${score}.`;
    } else {
      // Turn 21 - The Endings
      systemInstruction = `Tu es le maître du jeu bienveillant d'une aventure interactive textuelle sur le harcèlement scolaire (CM2).
C'est le moment d'afficher l'une des 3 fins uniques selon le score d'action positive accumulé par le joueur :
- Le joueur s'appelle ${playerName || "un élève"}.
- La victime s'appelle Lucas. Le harceleur est Thomas.
- Le score actuel est de ${score}.

DÉCIDE DE LA FIN UNIQUE :
1. SI LE SCORE EST ÉLEVÉ (score >= 12) -> LA BONNE FIN : Grâce aux actions répétées du joueur, les adultes de l'école (maîtresse, directrice, CPE) ont été alertés, le groupe s'est ligué pour soutenir Lucas. Thomas a été convoqué et sanctionné, mais surtout Lucas sourit à nouveau, le harcèlement est terminé et la classe de CM2 retrouve sa sérénité et son amitié collective.
2. SI LE SCORE EST NEUTRE (score entre 5 et 11) -> LA FIN MOYENNE : Le joueur a réagi trop tardivement ou seulement à moitié. Lucas a trop souffert de l'isolement originel et la situation était devenue trop lourde au quotidien. Ses parents ont pris la décision de le changer d'école pour l'année prochaine pour qu'il puisse se reconstruire ailleurs. Thomas a été puni, mais la classe reste marquée par un sentiment de gâchis et de regret collectif.
3. SI LE SCORE EST BAS (score < 5) -> LA MAUVAISE FIN : Le silence a régné, personne n'a osé parler ou soutenir Lucas. L'année de CM2 se termine dans la douleur de Lucas qui se replie sur lui-même. L'histoire se projette au collège l'année suivante, où le harcèlement continue de plus belle sur Lucas qui subit cela, tandis que le joueur réalise maintenant - avec de profonds regrets - toute l'importance d'agir et de ne pas être un simple spectateur passif.

Rédige ce dénouement marquant et profond en français (6-8 phrases max). Montre clairement les conséquences directes mais adaptées de son investissement ou de son inaction.
Comme c'est la fin du jeu, propose une liste de choix vide ou un seul choix de conclusion "Relancer l'aventure" (avec scoreChange = 0).`;

      prompt = `Génère le dénouement final (Tour 21) pour un score accumulé de ${score}.
Historique complet du jeu :
${history && history.length > 0 ? history.map((item: any) => `- Tour ${item.turn}: ${item.chosenOptionText}`).join("\n") : "Pas d'historique."}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenario: {
              type: Type.STRING,
              description: "Le texte de la situation ou de la conclusion."
            },
            choices: {
              type: Type.ARRAY,
              description: "Les 3 choix possibles (vide ou reset pour le dénouement final)",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  text: { type: Type.STRING },
                  scoreChange: { type: Type.INTEGER },
                  feedbackExplanation: { type: Type.STRING }
                },
                required: ["id", "text", "scoreChange", "feedbackExplanation"]
              }
            }
          },
          required: ["scenario", "choices"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json(parsedData);

  } catch (error: any) {
    console.error("Gemini GenAI Error:", error);
    // Graceful error recovery with educational fallback
    return res.json(getFallbackStep(currentTurn, score));
  }
});

// Fallback steps generator if Offline or API errors or Key missing
function getFallbackStep(turn: number, score: number) {
  // Let's create a curated list of steps so that the game is fully playable under any network condition
  // As requested, must go up to turn 20, let's generate appropriate scenarios programmatically
  if (turn === 21) {
    if (score >= 12) {
      return {
        scenario: "LA BONNE FIN : Grâce à ton courage et à tes actions répétées, la parole s'est libérée de façon spectaculaire. Tu as osé avertir la maîtresse, rassurer Lucas et mobiliser le groupe dans la cour. Thomas a été sévèrement rappelé à l'ordre par la directrice avec des sanctions constructives. Lucas n'est plus seul : il sourit à nouveau, a repris confiance en lui, et partage ses jolis dessins avec la classe. Ensemble, vous avez prouvé que l'alerte n'est pas du cafardage, mais de l'entraide collective.",
        choices: [
          { id: 1, text: "Recommencer l'aventure pour découvrir d'autres choix", scoreChange: 0, feedbackExplanation: "Félicitations pour tes gestes héroïques de citoyen !" }
        ]
      };
    } else if (score >= 5) {
      return {
        scenario: "LA FIN MOYENNE : Tu as fait des efforts pour aider Lucas, mais par moments, l'hésitation ou la peur de passer pour un 'cafard' a freiné tes actions. Après une nouvelle bousculade le dernier mois, la maîtresse a enfin été alertée. Thomas a reçu un avertissement officiel. Cependant, pour Lucas, la blessure était trop grande et l'angoisse quotidienne trop lourde. Ses parents ont décidé de l'inscrire dans un autre établissement pour son entrée au collège afin qu'il prenne un nouveau départ. La classe garde un souvenir teinté de regret d'avoir réagi si tard.",
        choices: [
          { id: 1, text: "Recommencer l'aventure pour mieux agir", scoreChange: 0, feedbackExplanation: "Chaque geste compte, et agir plus tôt change tout !" }
        ]
      };
    } else {
      return {
        scenario: "LA MAUVAISE FIN : Le silence a régné durant toute cette année scolaire. Thomas a continué ses agressions physiques (croche-pattes, affaires piétinées) et ses brimades sous les yeux fermés de la classe. Lucas s'est complètement renfermé, ses résultats scolaires ont chuté, et sa tristesse est devenue permanente. La projection de son entrée au collège s'annonce douloureuse car les brimades de Thomas se poursuivent hors de l'école. Tu ressens un profond regret de ne pas avoir parlé à un adulte ou d'avoir ri avec les autres par peur. Ta passivité a indirectement nourri le harcèlement.",
        choices: [
          { id: 1, text: "Prendre un nouveau départ et recommencer", scoreChange: 0, feedbackExplanation: "Ne reste jamais spectateur passif. La parole libère !" }
        ]
      };
    }
  }

  // Pre-seed static scenarios to represent a complete 20-step arc
  const scenarios: Record<number, { scenario: string; choices: any[] }> = {
    1: {
      scenario: "Aujourd'hui, c'est la récréation du matin. Dans la cour de l'école, tu aperçois Lucas, un élève discret de ta classe de CM2. Thomas, un garçon plus grand et intimidant, s'approche de lui et le bouscule brusquement de l'épaule. Les affaires de Lucas (son cahier de dessin et ses feutres) tombent par terre et se dispersent sur le goudron. Lucas baisse la tête, visiblement humilié, sans oser réagir.",
      choices: [
        { id: 1, text: "S'approcher de Lucas pour l'aider à ramasser ses feutres et lui demander s'il va bien.", scoreChange: 1, feedbackExplanation: "Bravo ! En faisant cela, tu montres à Lucas qu'il a du soutien et tu brises l'effet de spectateur." },
        { id: 2, text: "Observer de loin sans bouger, en espérant que le surveillant de la cour verra ce qui se passe.", scoreChange: 0, feedbackExplanation: "C'est une réaction compréhensible par peur d'avoir des ennuis, mais Lucas reste seul face à sa détresse." },
        { id: 3, text: "Ricaner avec les copains de Thomas pour éviter d'être la prochaine cible.", scoreChange: -1, feedbackExplanation: "Attention ! Rire ou cautionner, c'est encourager le harceleur et lui donner de la puissance." }
      ]
    },
    2: {
      scenario: "C'est l'heure du repas à la cantine. Thomas s'installe à la table de Lucas et tire violemment son plateau repas vers lui en rigolant. 'T'as pas besoin de manger toi, donne-moi tes frites !', lui lance-t-il. Plusieurs élèves de CM2 observent la scène en silence. Lucas regarde son plateau vide en serrant les poings.",
      choices: [
        { id: 1, text: "Dire calmement à haute voix : 'Arrête Thomas, rends-lui ses frites, c'est pas drôle du tout.'", scoreChange: 1, feedbackExplanation: "Super ! Ton courage encourage les autres à réprouver le comportement de Thomas." },
        { id: 2, text: "Continuer à manger sans faire de bruit pour préserver ton propre calme.", scoreChange: 0, feedbackExplanation: "Ton silence permet à Thomas d'agir en toute impunité." },
        { id: 3, text: "Dire à Lucas : 'Allez, laisse-lui, de toute façon elles ont l'air froides.'", scoreChange: -1, feedbackExplanation: "Mauvaise idée. Tu minimises l'agression et tu demandes à la victime de se soumettre." }
      ]
    },
    3: {
      scenario: "En retournant en classe, tu croises Lucas en larmes dans le couloir. Ses crayons de couleur fétiches sont cassés et éparpillés par terre. Thomas passe à côté en sifflotant avec un air de défi. Personne d'autre n'est là pour assister à la scène.",
      choices: [
        { id: 1, text: "Consoler Lucas et l'accompagner pour en parler immédiatement à la maîtresse.", scoreChange: 1, feedbackExplanation: "Excellent ! Prévenir la maîtresse n'est pas du cafardage, c'est assister un camarade en détresse." },
        { id: 2, text: "Aider Lucas à ramasser ses débris de crayons mais lui conseiller de ne rien dire pour éviter les représailles.", scoreChange: 0, feedbackExplanation: "L'aider est gentil, mais encourager le silence permet au harcèlement de durer." },
        { id: 3, text: "Lui dire : 'Tu es trop fragile, Lucas, tu devrais garder tes crayons dans ton cartable.'", scoreChange: -1, feedbackExplanation: "Aïe. Blâmer la victime accentue sa culpabilité et disculpe le harceleur." }
      ]
    },
    4: {
      scenario: "Pendant le cours d'EPS (sport), la classe doit former deux équipes de football. Thomas est nommé capitaine de l'équipe des Blancs. Au moment où Lucas est le dernier sur le banc, Thomas le désigne du doigt en criant : 'Je ne veux pas de ce boulet dans mon équipe ! Il sait même pas courir !'",
      choices: [
        { id: 1, text: "Lever la main et dire à l'enseignant de sport : 'Monsieur, on peut intégrer Lucas avec nous ? On a besoin d'un bon joueur.'", scoreChange: 1, feedbackExplanation: "Formidable ! Inclure Lucas brise sa solitude et montre qu'il a toute sa place dans le sport." },
        { id: 2, text: "Ne rien dire et attendre que l'enseignant de EPS règle le placement d'autorité.", scoreChange: 0, feedbackExplanation: "Hésiter laisse Lucas blessé et humilié sur le banc sous le regard de tous." },
        { id: 3, text: "Murmurer à ton voisin : 'C'est vrai qu'il est super lent au foot...'", scoreChange: -1, feedbackExplanation: "C'est blessant. Tu renforces le préjugé de rejet alimenté par Thomas." }
      ]
    },
    5: {
      scenario: "Le lendemain matin avant la sonnerie, dans la cour, Thomas et ses copains coincent Lucas contre le grillage de l'école. Thomas lui fait un croche-pattes répétitif tandis que ses comparses lui confisquent sa casquette favorite. Lucas tente de se dégager, mais ils bloquent ses mouvements.",
      choices: [
        { id: 1, text: "Courir directement chercher le surveillant de récréation pour qu'il intervienne.", scoreChange: 1, feedbackExplanation: "Parfait ! Face à de l'intimidation physique de groupe, alerter un adulte s'impose pour la sécurité." },
        { id: 2, text: "Crier de loin 'Eh laissez-le !' puis partir d'un autre côté par peur de te faire coincer aussi.", scoreChange: 0, feedbackExplanation: "Tu as essayé brièvement, mais abandonner Lucas le laisse désemparé face au groupe." },
        { id: 3, text: "Rire de la casquette rigolote de Lucas que Thomas fait tourner dans les airs.", scoreChange: -1, feedbackExplanation: "Très négatif. Tu prends le parti des persécuteurs physiques, blessant profondément Lucas." }
      ]
    }
  };

  // Generate generic dynamic steps if turn > 5 to guarantee up to 20 steps
  if (scenarios[turn]) {
    return scenarios[turn];
  } else {
    // Generate a contextually coherent scenario based on turn to meet the "at least 20 items" rule
    const places = [
      "lors de la sortie des classes devant le portail",
      "près du préau pendant une grosse averse",
      "dans les vestiaires après le sport",
      "lors d'un travail de groupe en classe de géographie",
      "dans le couloir de la bibliothèque",
      "sur le chemin du retour à la maison près du parc",
      "pendant la récréation près des toilettes"
    ];
    const place = places[turn % places.length];

    const actions = [
      "Thomas bouscule à nouveau Lucas et essaie de lui arracher son sac à dos de force.",
      "Thomas bloque le passage de Lucas en tenant un bâton avec agressivité et en se moquant de lui.",
      "Thomas confisque le cahier de poésie de Lucas et menace de le déchirer s'il n'obéit pas à ses ordres.",
      "Thomas fait un croc-en-jambe à Lucas qui tombe lourdement dans l'escalier, heureusement sans se blesser gravement."
    ];
    const action = actions[turn % actions.length];

    return {
      scenario: `[Jour ${Math.ceil(turn / 3)}, Étape ${turn}/20] Alors que vous vous trouvez ${place}, une nouvelle confrontation a lieu. ${action} Lucas est terrifié et supplie du regard de l'aide around de lui.`,
      choices: [
        { id: 1, text: "S'interposer fermement avec d'autres camarades de classe pour défendre Lucas de façon collective.", scoreChange: 1, feedbackExplanation: "Génial ! Le collectif est l'arme la plus puissante contre les agresseurs." },
        { id: 2, text: "Éviter de t'en mêler en te disant que Lucas finira par se défendre de manière autonome.", scoreChange: 0, feedbackExplanation: "Attendre passivement n'aide pas une victime de harcèlement répétitif." },
        { id: 3, text: "Dire à Thomas : 'Continue, de toute façon Lucas est un pleurnicheur.' par soumission.", scoreChange: -1, feedbackExplanation: "C'est dramatique. Tu deviens un harceleur actif à ton tour." }
      ]
    };
  }
}

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
