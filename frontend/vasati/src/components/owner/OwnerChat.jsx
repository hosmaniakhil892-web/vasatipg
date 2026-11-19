import React, { useState, useEffect } from "react";
import axios from "axios";
import { useOwner } from "./OwnerLayout";
import socket from "../socket";
import "./OwnerTheme.css";
import {
  FiMessageSquare,
  FiSend,
  FiUser,
  FiSearch,
  FiShield,
  FiClock,
} from "react-icons/fi";

function OwnerChat() {
  const { owner } = useOwner();
  const [conversations, setConversations] = useState([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const ownerEmail = owner?.email || localStorage.getItem("userEmail") || "owner@vasatipg.com";

  useEffect(() => {
    loadConversations();
  }, [ownerEmail]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/chat/conversations/${ownerEmail}`);
      setConversations(res.data || []);
      if (res.data && res.data.length > 0 && !selectedUserEmail) {
        const first = res.data[0];
        const other = first.senderEmail === ownerEmail ? first.receiverEmail : first.senderEmail;
        setSelectedUserEmail(other);
      }
    } catch (err) {
      console.error("Conversations load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedUserEmail) return;

    const roomId = [ownerEmail, selectedUserEmail].sort().join("_");
    socket.emit("joinRoom", { roomId });

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/chat/${roomId}`);
        setMessages(res.data || []);
      } catch (err) {
        console.error("Fetch messages error:", err);
      }
    };

    fetchMessages();

    const handleReceive = (msg) => {
      if (msg.roomId === roomId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receiveMessage", handleReceive);

    return () => {
      socket.off("receiveMessage", handleReceive);
    };
  }, [selectedUserEmail, ownerEmail]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserEmail) return;

    const roomId = [ownerEmail, selectedUserEmail].sort().join("_");
    const payload = {
      roomId,
      senderEmail: ownerEmail,
      receiverEmail: selectedUserEmail,
      message: newMessage.trim(),
    };

    try {
      // Send via socket and save via API
      socket.emit("sendMessage", payload);
      await axios.post("http://localhost:5000/api/chat/send", payload);
      setNewMessage("");
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  return (
    <div>
      <div className="owner-page-header">
        <div className="owner-page-title-group">
          <h2>Masked In-App Customer Communications</h2>
          <p>
            Secure, end-to-end masked messaging with prospective customers and active residents without exposing private phone numbers
          </p>
        </div>
      </div>

      <div
        className="owner-card"
        style={{
          display: "flex",
          height: "calc(100vh - 220px)",
          minHeight: "500px",
          padding: 0,
          overflow: "hidden",
        }}
      >
        {/* Left: Conversations Sidebar */}
        <div
          style={{
            width: "300px",
            borderRight: "1px solid var(--vasati-lavender-border)",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--vasati-lavender-card)",
          }}
        >
          <div style={{ padding: "16px", borderBottom: "1px solid var(--vasati-lavender-border)" }}>
            <span style={{ fontWeight: "700", color: "var(--vasati-royal)", fontSize: "0.95rem" }}>
              Active Conversations
            </span>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {conversations.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--vasati-text-muted)", fontSize: "0.85rem" }}>
                <FiMessageSquare style={{ fontSize: "1.8rem", marginBottom: "8px" }} />
                <p style={{ margin: 0 }}>No active chats yet.</p>
              </div>
            ) : (
              conversations.map((c) => {
                const other = c.senderEmail === ownerEmail ? c.receiverEmail : c.senderEmail;
                const isSelected = other === selectedUserEmail;
                return (
                  <div
                    key={c._id || other}
                    onClick={() => setSelectedUserEmail(other)}
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid var(--vasati-lavender-border)",
                      backgroundColor: isSelected ? "white" : "transparent",
                      cursor: "pointer",
                      borderLeft: isSelected ? "4px solid var(--vasati-rich)" : "4px solid transparent",
                    }}
                  >
                    <div style={{ fontWeight: "600", fontSize: "0.88rem", color: "var(--vasati-royal)", marginBottom: "3px" }}>
                      {other}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--vasati-text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.message || "Click to view message thread"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Thread */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "white" }}>
          {selectedUserEmail ? (
            <>
              {/* Thread Header */}
              <div
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--vasati-lavender-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "var(--vasati-lavender-card)",
                }}
              >
                <div>
                  <div style={{ fontWeight: "700", color: "var(--vasati-royal)", fontSize: "0.95rem" }}>
                    Chat with {selectedUserEmail}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--vasati-success)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <FiShield /> Masked Vasati Communication Relay
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--vasati-text-muted)", margin: "auto" }}>
                    <p style={{ margin: 0, fontSize: "0.88rem" }}>No messages yet in this conversation.</p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMine = m.senderEmail === ownerEmail;
                    return (
                      <div
                        key={idx}
                        style={{
                          alignSelf: isMine ? "flex-end" : "flex-start",
                          maxWidth: "70%",
                          padding: "10px 14px",
                          borderRadius: isMine ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                          backgroundColor: isMine ? "var(--vasati-rich)" : "var(--vasati-lavender-card)",
                          color: isMine ? "white" : "var(--vasati-text-primary)",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                          fontSize: "0.88rem",
                        }}
                      >
                        <div>{m.message}</div>
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: isMine ? "rgba(255,255,255,0.7)" : "var(--vasati-text-muted)",
                            textAlign: "right",
                            marginTop: "4px",
                          }}
                        >
                          {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} style={{ padding: "14px 18px", borderTop: "1px solid var(--vasati-lavender-border)", display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Type a secure message to the customer..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="owner-search-input"
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn-vasati-primary" style={{ padding: "10px 18px" }}>
                  <FiSend /> Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: "auto", textAlign: "center", color: "var(--vasati-text-muted)" }}>
              <FiMessageSquare style={{ fontSize: "2.5rem", marginBottom: "8px" }} />
              <p>Select a customer conversation from the left to start messaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerChat;

