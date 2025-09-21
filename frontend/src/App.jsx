import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Home
import Home from "./pages/Home/Home.jsx";

// Training - Menús
import Training from "./pages/Training/Training.jsx";
import TrainingAlgorithms from "./pages/Training/Algorithms/TrainingAlgorithms.jsx";
import TrainingAlgorithmsBasic from "./pages/Training/Algorithms/opbasic/TrainingAlgorithmsBasic.jsx";
import TrainingAlgorithmsNumbers from "./pages/Training/Algorithms/numbers/TrainingAlgorithmsNumbers.jsx";

import TrainingWords from "./pages/Training/Words/TrainingWords.jsx";
import TrainingWordsVowels from "./pages/Training/Words/Vowels/TrainingWordsVowels.jsx";
import TrainingWordsThings from "./pages/Training/Words/TrainingWordsThings.jsx";

// Training - Numeros individuales
import TrainingAlgorithmsNumber1 from "./pages/Training/Algorithms/numbers/TrainingAlgorithmsNumber1.jsx";
import TrainingAlgorithmsNumber2 from "./pages/Training/Algorithms/numbers/TrainingAlgorithmsNumber2.jsx";
import TrainingAlgorithmsNumber3 from "./pages/Training/Algorithms/numbers/TrainingAlgorithmsNumber3.jsx";
import TrainingAlgorithmsNumber4 from "./pages/Training/Algorithms/numbers/TrainingAlgorithmsNumber4.jsx";
import TrainingAlgorithmsNumber5 from "./pages/Training/Algorithms/numbers/TrainingAlgorithmsNumber5.jsx";
import TrainingAlgorithmsNumber6 from "./pages/Training/Algorithms/numbers/TrainingAlgorithmsNumber6.jsx";
import TrainingAlgorithmsNumber7 from "./pages/Training/Algorithms/numbers/TrainingAlgorithmsNumber7.jsx";
import TrainingAlgorithmsNumber8 from "./pages/Training/Algorithms/numbers/TrainingAlgorithmsNumber8.jsx";
import TrainingAlgorithmsNumber9 from "./pages/Training/Algorithms/numbers/TrainingAlgorithmsNumber9.jsx";
import TrainingAlgorithmsNumber0 from "./pages/Training/Algorithms/numbers/TrainingAlgorithmsNumber0.jsx";

// Training - operaciones individuales
import TrainingAlgorithmsBasicMas from "./pages/Training/Algorithms/opbasic/TrainingAlgorithmsBasicMas.jsx";
import TrainingAlgorithmsBasicMenos from "./pages/Training/Algorithms/opbasic/TrainingAlgorithmsBasicMenos.jsx";
import TrainingAlgorithmsBasicMultipl from "./pages/Training/Algorithms/opbasic/TrainingAlgorithmsBasicMultipl.jsx";
import TrainingAlgorithmsBasicDivision from "./pages/Training/Algorithms/opbasic/TrainingAlgorithmsBasicDivision.jsx";

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
        <Route path="/training/algorithms/opbasic" element={<TrainingAlgorithmsBasic />} />
        <Route path="/training/algorithms/numbers" element={<TrainingAlgorithmsNumbers />} />

        {/* Training → Algorithms → numbers */}
        <Route path="/training/algorithms/numbers/1" element={<TrainingAlgorithmsNumber1 />} />
        <Route path="/training/algorithms/numbers/2" element={<TrainingAlgorithmsNumber2 />} />
        <Route path="/training/algorithms/numbers/3" element={<TrainingAlgorithmsNumber3 />} />
        <Route path="/training/algorithms/numbers/4" element={<TrainingAlgorithmsNumber4 />} />
        <Route path="/training/algorithms/numbers/5" element={<TrainingAlgorithmsNumber5 />} />
        <Route path="/training/algorithms/numbers/6" element={<TrainingAlgorithmsNumber6 />} />
        <Route path="/training/algorithms/numbers/7" element={<TrainingAlgorithmsNumber7 />} />
        <Route path="/training/algorithms/numbers/8" element={<TrainingAlgorithmsNumber8 />} />
        <Route path="/training/algorithms/numbers/9" element={<TrainingAlgorithmsNumber9 />} />
        <Route path="/training/algorithms/numbers/0" element={<TrainingAlgorithmsNumber0 />} />

        {/* Training → Algorithms → opbasic */}
        <Route path="/training/algorithms/opbasic/mas" element={<TrainingAlgorithmsBasicmas />} />
        <Route path="/training/algorithms/opbasic/menos" element={<TrainingAlgorithmsBasicmenos />} />
        <Route path="/training/algorithms/opbasic/multipl" element={<TrainingAlgorithmsBasicmultipl />} />
        <Route path="/training/algorithms/opbasic/division" element={<TrainingAlgorithmsBasicdivision />} />

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
