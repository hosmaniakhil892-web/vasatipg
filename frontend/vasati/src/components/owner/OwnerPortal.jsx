import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import OwnerLayout from "./OwnerLayout";
import OwnerDashboard from "./OwnerDashboard";
import CustomerManagement from "./CustomerManagement";
import BookingManagement from "./BookingManagement";
import RoomManagement from "./RoomManagement";
import RentManagement from "./RentManagement";
import VisitManagement from "./VisitManagement";
import ComplaintManagement from "./ComplaintManagement";
import OwnerAnalytics from "./OwnerAnalytics";
import OwnerChat from "./OwnerChat";

function OwnerPortal() {
  return (
    <OwnerLayout>
      <Routes>
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="bookings" element={<BookingManagement />} />
        <Route path="rooms" element={<RoomManagement />} />
        <Route path="payments" element={<RentManagement />} />
        <Route path="visits" element={<VisitManagement />} />
        <Route path="complaints" element={<ComplaintManagement />} />
        <Route path="analytics" element={<OwnerAnalytics />} />
        <Route path="chat" element={<OwnerChat />} />
        <Route path="*" element={<Navigate to="/owner/dashboard" replace />} />
      </Routes>
    </OwnerLayout>
  );
}

export default OwnerPortal;

