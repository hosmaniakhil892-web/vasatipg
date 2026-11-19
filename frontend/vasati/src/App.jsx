import { React } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Advertise from "./components/Advertise";
import AdDetails from "./components/AdDetails";
import SearchedPage from "./components/SearchedPage";
import AllAddetails from "./components/AllAddetails";
import Myads from "./components/Myads";
import Profile from "./components/Profile";
import Wishlist from "./components/Wishlist";
import Onmap from "./components/Onmap";
import Edit from "./components/Edit";
import ChatList from "./components/ChatList";
import ResetPasswordPage from "./components/ResetPasswordPage";
import OwnerAuth from "./components/owner/OwnerAuth";
import OwnerPortal from "./components/owner/OwnerPortal";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Existing Customer Portal Routes (Strictly Preserved) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/advertise" element={<Advertise />} />
        <Route path="/AllAddetails" element={<AllAddetails />} />
        <Route path="/addetails/:adId" element={<AdDetails />} />
        <Route path="/searched/:search" element={<SearchedPage />} />
        <Route path="/myads" element={<Myads />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/onmap" element={<Onmap />} />
        <Route path="/edit-ad/:adId" element={<Edit />} />
        <Route path="/chatList" element={<ChatList />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Dedicated PG Owner Management Portal Routes */}
        <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="/owner/login" element={<OwnerAuth initialMode="login" />} />
        <Route path="/owner/register" element={<OwnerAuth initialMode="register" />} />
        <Route path="/owner/*" element={<OwnerPortal />} />
      </Routes>
    </Router>
  );
}

export default App;
