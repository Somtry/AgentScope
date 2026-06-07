import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import TracerPage from "./pages/TracerPage";
import EvaluatorPage from "./pages/EvaluatorPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tracer" element={<TracerPage />} />
          <Route path="/evaluator" element={<EvaluatorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
