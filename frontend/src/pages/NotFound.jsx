import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function NotFound() {
  const { t } = useApp();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl">⚽</div>
      <h1 className="mt-4 font-display text-4xl font-extrabold">404</h1>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-pitch-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-pitch-700"
      >
        {t("nav.home")}
      </Link>
    </div>
  );
}
