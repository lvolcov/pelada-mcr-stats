import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";
import WinRate from "./pages/WinRate";
import ScoringRate from "./pages/ScoringRate";
import GaRate from "./pages/GaRate";
import Form from "./pages/Form";
import SeasonTrend from "./pages/SeasonTrend";
import Matches from "./pages/Matches";
import Mvp from "./pages/Mvp";
import Attendance from "./pages/Attendance";
import Players from "./pages/Players";
import PlayerProfile from "./pages/PlayerProfile";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/winrate" element={<WinRate />} />
        <Route path="/scoring" element={<ScoringRate />} />
        <Route path="/ga" element={<GaRate />} />
        <Route path="/form" element={<Form />} />
        <Route path="/trend" element={<SeasonTrend />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/mvp" element={<Mvp />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/players" element={<Players />} />
        <Route path="/player/:name" element={<PlayerProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
