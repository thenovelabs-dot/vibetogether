import { useUser } from "../contexts/UserContext";
import { useNavigate, useLocation } from "react-router-dom";

export function useRequireAuth() {
  const { session } = useUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return function requireAuth(action: () => void) {
    if (!session) {
      localStorage.setItem("loginRedirect", pathname);
      navigate("/login");
      return;
    }
    action();
  };
}
