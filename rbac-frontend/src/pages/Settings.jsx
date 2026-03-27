import React, { useState, useEffect } from "react";
import { 
  User, 
  Settings as SettingsIcon, 
  Lock, 
  Palette, 
  Bell, 
  ShieldCheck, 
  Camera, 
  Trash2, 
  Download,
  X,
  Save,
  Loader2 // Icon for the spinner
} from "lucide-react";
import "./settings.css";

const Settings = () => {
  const defaultImage = "https://via.placeholder.com";
  const STORAGE_KEY = "user_app_settings";

  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false); // State for the loading spinner

  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirmNew: ""
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      username: "DevUser",
      email: "dev@example.com",
      bio: "",
      location: "",
      theme: "light",
      fontSize: "medium",
      profileVisibility: "public",
      dataSharing: true,
      emailAlerts: true,
      desktopPush: false,
      profileImage: defaultImage
    };
  });

  const [isSystemDark, setIsSystemDark] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsSystemDark(mediaQuery.matches);
    const handler = (e) => setIsSystemDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const themeClass = 
    settings.theme === "dark" || (settings.theme === "system" && isSystemDark) 
    ? "dark-mode" 
    : "";

  useEffect(() => {
    if (themeClass === "dark-mode") {
      document.body.classList.add("dark-mode-body");
    } else {
      document.body.classList.remove("dark-mode-body");
    }
  }, [themeClass]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({ ...settings, [name]: type === "checkbox" ? checked : value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords({ ...passwords, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setSettings({ ...settings, profileImage: defaultImage });
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate a network delay
    setTimeout(() => {
      setIsSaving(false);
      alert("Settings saved successfully!");
    }, 1000);
  };

  const handleUpdatePassword = () => {
    if (passwords.newPassword !== passwords.confirmNew) {
      alert("New passwords do not match!");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Password updated successfully!");
      setPasswords({ current: "", newPassword: "", confirmNew: "" });
    }, 1000);
  };

  const handleDeleteAccount = () => {
    if (confirmPassword === "123456") {
      localStorage.removeItem(STORAGE_KEY);
      alert("Account data cleared.");
      window.location.reload();
    } else {
      alert("Incorrect password.");
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "my_settings_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const passwordsMatch = passwords.newPassword && passwords.confirmNew ? passwords.newPassword === passwords.confirmNew : true;

  const renderSection = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="settings-section">
            <h2>Profile</h2>
            <div className="profile-picture-container">
              <div className="image-wrapper">
                <img src={settings.profileImage} alt="Profile" />
                <label htmlFor="file-upload" className="camera-icon-label">
                  <Camera size={18} />
                </label>
                <input id="file-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </div>
              <div style={{ marginTop: "15px" }}>
                <button 
                  className="cancel-btn" 
                  onClick={handleRemovePhoto}
                  style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}
                  disabled={settings.profileImage === defaultImage || isSaving}
                >
                  <Trash2 size={14} /> Remove Photo
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input name="username" value={settings.username} onChange={handleChange} placeholder="Enter your name" disabled={isSaving} />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea name="bio" value={settings.bio} onChange={handleChange} placeholder="Tell us about yourself" disabled={isSaving} />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input name="location" value={settings.location} onChange={handleChange} placeholder="Your city/country" disabled={isSaving} />
            </div>
            <button className="save-btn" onClick={handleSave} disabled={isSaving} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isSaving ? <Loader2 size={18} className="spinner" /> : <Save size={18} />}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        );
      case "account":
        return (
          <div className="settings-section">
            <h2>Account</h2>
            <div className="form-group"><label>Email Address</label><input name="email" value={settings.email} onChange={handleChange} disabled={isSaving} /></div>
            <button className="save-btn" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Updating..." : "Update Account"}
            </button>
            <div className="danger-zone">
              <div className="danger-content">
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}><Trash2 size={20} /> Danger Zone</h3>
                <p>Once you delete your account, there is no going back.</p>
              </div>
              <button className="delete-btn" onClick={() => setShowDeleteModal(true)}>Delete Account</button>
            </div>
            {showDeleteModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px", color: "#d93025" }}>
                    <ShieldCheck size={48} />
                  </div>
                  <h3>Verify Identity</h3>
                  <div className="form-group" style={{ textAlign: "left" }}><label>Password (Enter 123456)</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={() => { setShowDeleteModal(false); setConfirmPassword(""); }}>Cancel</button>
                    <button className="delete-confirm-btn" onClick={handleDeleteAccount} disabled={!confirmPassword}>Verify & Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case "security":
        return (
          <div className="settings-section">
            <h2>Security</h2>
            <div className="form-group"><label>Current Password</label><input type="password" name="current" value={passwords.current} onChange={handlePasswordChange} disabled={isSaving} /></div>
            <div className="form-group"><label>New Password</label><input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} disabled={isSaving} /></div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" name="confirmNew" value={passwords.confirmNew} onChange={handlePasswordChange} style={{ borderColor: passwordsMatch ? "" : "#d93025" }} disabled={isSaving} />
              {!passwordsMatch && <small style={{ color: "#d93025", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}><X size={12} /> Passwords do not match</small>}
            </div>
            <button className="save-btn" onClick={handleUpdatePassword} disabled={!passwords.newPassword || !passwordsMatch || isSaving}>
              {isSaving ? "Updating..." : "Update Password"}
            </button>
          </div>
        );
      case "appearance":
        return (
          <div className="settings-section">
            <h2>Appearance</h2>
            <div className="form-group">
              <label>Theme</label>
              <select name="theme" value={settings.theme} onChange={handleChange} disabled={isSaving}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="form-group">
              <label>Font Size</label>
              <select name="fontSize" value={settings.fontSize} onChange={handleChange} disabled={isSaving}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <button className="save-btn" onClick={handleSave} disabled={isSaving}>
               {isSaving ? "Applying..." : "Save Appearance"}
            </button>
          </div>
        );
      case "notifications":
        return (
          <div className="settings-section">
            <h2>Notifications</h2>
            <div className="checkbox-group"><input type="checkbox" name="emailAlerts" checked={settings.emailAlerts} onChange={handleChange} disabled={isSaving} /><label>Email Alerts</label></div>
            <div className="checkbox-group"><input type="checkbox" name="desktopPush" checked={settings.desktopPush} onChange={handleChange} disabled={isSaving} /><label>Desktop Push Notifications</label></div>
            <button className="save-btn" onClick={handleSave} disabled={isSaving}>Save Notifications</button>
          </div>
        );
      case "privacy":
        return (
          <div className="settings-section">
            <h2>Privacy</h2>
            <div className="form-group">
              <label>Profile Visibility</label>
              <select name="profileVisibility" value={settings.profileVisibility} onChange={handleChange} disabled={isSaving}>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="checkbox-group"><input type="checkbox" name="dataSharing" checked={settings.dataSharing} onChange={handleChange} disabled={isSaving} /><label>Allow Data Sharing</label></div>
            <hr style={{ margin: "25px 0", border: "0", borderTop: "1px solid var(--border-color)" }} />
            <h3>Data Management</h3>
            <button className="save-btn" onClick={handleExportData} style={{ background: "#6c757d", display: "flex", alignItems: "center", gap: "8px" }}>
              <Download size={16} /> Export My Data
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <User size={18} /> },
    { id: "account", label: "Account", icon: <SettingsIcon size={18} /> },
    { id: "security", label: "Security", icon: <Lock size={18} /> },
    { id: "appearance", label: "Appearance", icon: <Palette size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "privacy", label: "Privacy", icon: <ShieldCheck size={18} /> },
  ];

  return (
    <div className={`settings-layout ${themeClass}`}>
      <div className="settings-sidebar">
        <h3>Settings</h3>
        {tabs.map((tab) => (
          <button 
            key={tab.id} 
            className={activeTab === tab.id ? "active" : ""} 
            onClick={() => setActiveTab(tab.id)}
            style={{ display: "flex", alignItems: "center", gap: "12px" }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
      <div className="settings-content">{renderSection()}</div>
    </div>
  );
};

export default Settings;
