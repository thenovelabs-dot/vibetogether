import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import HomeScreen from "./screens/HomeScreen";
import FeedScreen from "./screens/FeedScreen";
import MeetupDetailScreen from "./screens/MeetupDetailScreen";
import MeetupNewScreen from "./screens/MeetupNewScreen";
import MeetupEditScreen from "./screens/MeetupEditScreen";
import MyPageScreen from "./screens/MyPageScreen";
import OnboardingNicknameScreen from "./screens/OnboardingNicknameScreen";
import OnboardingAIToolsScreen from "./screens/OnboardingAIToolsScreen";
import OnboardingJobScreen from "./screens/OnboardingJobScreen";
import LoginScreen from "./screens/LoginScreen";
import AuthCallbackScreen from "./screens/AuthCallbackScreen";
import BoardScreen from "./screens/BoardScreen";
import BoardPostDetailScreen from "./screens/BoardPostDetailScreen";
import BoardPostNewScreen from "./screens/BoardPostNewScreen";
import BoardPostEditScreen from "./screens/BoardPostEditScreen";
import ApplicationsScreen from "./screens/ApplicationsScreen";
import ProductScreen from "./screens/ProductScreen";
import ProductNewScreen from "./screens/ProductNewScreen";
import ProductDetailScreen from "./screens/ProductDetailScreen";
import ProductEditScreen from "./screens/ProductEditScreen";
import UserProfileScreen from "./screens/UserProfileScreen";
import AboutScreen from "./screens/AboutScreen";
import SearchScreen from "./screens/SearchScreen";
import NoticeScreen from "./screens/NoticeScreen";
import NoticeDetailScreen from "./screens/NoticeDetailScreen";
import NoticeNewScreen from "./screens/NoticeNewScreen";
import ToastPreviewScreen from "./screens/ToastPreviewScreen";
import TermsScreen from "./screens/TermsScreen";
import PrivacyScreen from "./screens/PrivacyScreen";
import Layout from "./components/Layout";
import { UserProvider } from "./contexts/UserContext";
import { useUser } from "./contexts/userContextValue";
import { ToastProvider } from "./components/Toast";
import { NavigationGuardProvider } from "./contexts/NavigationGuardContext";
import { features } from "./config/features";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (!session) {
    localStorage.setItem("loginRedirect", location.pathname);
    return <Navigate to="/login" replace />;
  }
  if (!profile) return <Navigate to="/onboarding/nickname" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/auth/callback" element={<AuthCallbackScreen />} />
      <Route path="/onboarding/nickname" element={<OnboardingNicknameScreen />} />
      <Route path="/onboarding/aitools" element={<OnboardingAIToolsScreen />} />
      <Route path="/onboarding/job" element={<OnboardingJobScreen />} />

      {/* 공개 라우트 — 로그인 없이 탐색 가능 */}
      <Route element={<Layout />}>
        <Route path="/home" element={<FeedScreen />} />
        {features.meetups && <Route path="/meetup" element={<HomeScreen />} />}
        {features.meetups && <Route path="/meetup/:id" element={<MeetupDetailScreen />} />}
        <Route path="/board" element={<BoardScreen />} />
        <Route path="/board/:id" element={<BoardPostDetailScreen />} />
        <Route path="/product" element={<ProductScreen />} />
        <Route path="/product/:id" element={<ProductDetailScreen />} />
        <Route path="/user/:nickname" element={<UserProfileScreen />} />
        <Route path="/about" element={<AboutScreen />} />
        <Route path="/terms" element={<TermsScreen />} />
        <Route path="/privacy" element={<PrivacyScreen />} />
        <Route path="/search" element={<SearchScreen />} />
        <Route path="/notice" element={<NoticeScreen />} />
        <Route path="/notice/new" element={<NoticeNewScreen />} />
        <Route path="/notice/:id" element={<NoticeDetailScreen />} />
      </Route>

      {/* 로그인 필요 라우트 */}
      <Route element={<AuthGuard><Layout /></AuthGuard>}>
        {features.meetups && <Route path="/meetup/new" element={<MeetupNewScreen />} />}
        {features.meetups && <Route path="/meetup/:id/edit" element={<MeetupEditScreen />} />}
        {features.meetups && <Route path="/meetup/:id/applications" element={<ApplicationsScreen />} />}
        <Route path="/board/new" element={<BoardPostNewScreen />} />
        <Route path="/board/:id/edit" element={<BoardPostEditScreen />} />
        <Route path="/product/new" element={<ProductNewScreen />} />
        <Route path="/product/:id/edit" element={<ProductEditScreen />} />
        <Route path="/mypage" element={<MyPageScreen />} />
      </Route>

      <Route path="/toast-preview" element={<ToastPreviewScreen />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <UserProvider>
      <ToastProvider>
        <BrowserRouter>
          <NavigationGuardProvider>
            <AppRoutes />
          </NavigationGuardProvider>
        </BrowserRouter>
      </ToastProvider>
    </UserProvider>
  );
}
