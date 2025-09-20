import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Home
import Home from "./pages/Home/Home.jsx";

// Training - Menús
import Training from "./pages/Training/Training.jsx";
import TrainingAlgorithms from "./pages/Training/Algorithms/TrainingAlgorithms.jsx";
import TrainingAlgorithmsBasic from "./pages/Training/Algorithms/TrainingAlgorithmsBasic.jsx";
import TrainingAlgorithmsNumbers from "./pages/Training/Algorithms/TrainingAlgorithmsNumbers.jsx";

import TrainingWords from "./pages/Training/Words/TrainingWords.jsx";
import TrainingWordsVowels from "./pages/Training/Words/Vowels/TrainingWordsVowels.jsx";
import TrainingWordsThings from "./pages/Training/Words/TrainingWordsThings.jsx";

// Training - Vocales individuales
import TrainingWordVowelA from "./pages/Training/Words/Vowels/TrainingWordVowelA.jsx";
import TrainingWordVowelE from "./pages/Training/Words/Vowels/TrainingWordVowelE.jsx";
import TrainingWordVowelI from "./pages/Training/Words/Vowels/TrainingWordVowelI.jsx";
import TrainingWordVowelO from "./pages/Training/Words/Vowels/TrainingWordVowelO.jsx";
import TrainingWordVowelU from "./pages/Training/Words/Vowels/TrainingWordVowelU.jsx";

// Predictions
import Predictions from "./pages/Predictions/Predictions.jsx";
import PredictionsWords from "./pages/Predictions/PredictionsWords.jsx";
import PredictionsAlgorithms from "./pages/Predictions/PredictionsAlgorithms.jsx";

function App() {
  return (
    <Router>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Training */}
        <Route path="/training" element={<Training />} />

        {/* Training → Algorithms */}
        <Route path="/training/algorithms" element={<TrainingAlgorithms />} />
        <Route path="/training/algorithms/basic" element={<TrainingAlgorithmsBasic />} />
        <Route path="/training/algorithms/numbers" element={<TrainingAlgorithmsNumbers />} />

        {/* Training → Words */}
        <Route path="/training/words" element={<TrainingWords />} />
        <Route path="/training/words/vowels" element={<TrainingWordsVowels />} />
        <Route path="/training/words/things" element={<TrainingWordsThings />} />

        {/* Training → Words → Vowels */}
        <Route path="/training/words/vowels/a" element={<TrainingWordVowelA />} />
        <Route path="/training/words/vowels/e" element={<TrainingWordVowelE />} />
        <Route path="/training/words/vowels/i" element={<TrainingWordVowelI />} />
        <Route path="/training/words/vowels/o" element={<TrainingWordVowelO />} />
        <Route path="/training/words/vowels/u" element={<TrainingWordVowelU />} />

        {/* Predictions */}
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/predictions/words" element={<PredictionsWords />} />
        <Route path="/predictions/algorithms" element={<PredictionsAlgorithms />} />
      </Routes>
    </Router>
  );
}

export default App;
