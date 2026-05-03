import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthProvider";
import { useVibesStore } from "../store/vibes";
import { useProfileStore } from "../store/profile";
import { LogOut, Trash2, ChevronLeft, User, Camera, Save, Edit2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const wipeData = useVibesStore(state => state.wipeData);
  const { profile, updateProfile, loading: profileLoading } = useProfileStore();
  
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatarUrl || "");
    }
  }, [profile]);

  const handleWipe = async () => {
    await wipeData();
    setShowWipeConfirm(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ bio, avatarUrl });
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative z-10 py-6">
      <div className="flex items-center space-x-4 mb-10">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-text-primary" />
        </button>
        <h1 className="text-3xl font-sans font-semibold tracking-tighter text-text-primary leading-none shadow-sm">
          Settings
        </h1>
      </div>

      <div className="space-y-8 pb-32">
        {/* Profile Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-tertiary">My Profile</h2>
            {!isEditingProfile && (
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>
          
          <div className="bg-white/60 backdrop-blur-md rounded-[24px] border border-black/5 p-5 flex flex-col space-y-4 shadow-[0_8px_32px_rgb(0,0,0,0.04)]">
            {profileLoading ? (
              <div className="w-full flex justify-center py-4">
                <div className="h-6 w-6 rounded-full border-2 border-black/10 border-t-black/60 animate-spin" />
              </div>
            ) : isEditingProfile ? (
              <div className="space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Avatar</label>
                  <div className="relative flex items-center space-x-4">
                    <div className="shrink-0 w-16 h-16 rounded-full bg-black/5 flex items-center justify-center overflow-hidden border border-black/10 relative group">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-text-tertiary" />
                      )}
                      <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-5 h-5 text-white" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const img = new Image();
                                img.onload = () => {
                                  // Resize to max 256x256 to fit in Firestore 200kb limit
                                  const canvas = document.createElement("canvas");
                                  let width = img.width;
                                  let height = img.height;
                                  const MAX_SIZE = 256;
                                  
                                  if (width > height) {
                                    if (width > MAX_SIZE) {
                                      height *= MAX_SIZE / width;
                                      width = MAX_SIZE;
                                    }
                                  } else {
                                    if (height > MAX_SIZE) {
                                      width *= MAX_SIZE / height;
                                      height = MAX_SIZE;
                                    }
                                  }
                                  
                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext("2d");
                                  ctx?.drawImage(img, 0, 0, width, height);
                                  const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                                  setAvatarUrl(dataUrl);
                                };
                                img.src = event.target?.result as string;
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    {avatarUrl && (
                      <button 
                        onClick={() => setAvatarUrl("")}
                        className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-text-tertiary">Bio</label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Wiser cousin, overthinker, chai enthusiast..."
                    className="w-full p-3 bg-black/5 border border-transparent rounded-xl text-sm text-text-primary focus:outline-none focus:bg-white focus:border-black/10 transition-all custom-scrollbar min-h-[80px] resize-none"
                    maxLength={150}
                  />
                  <div className="text-[10px] text-text-tertiary text-right text-mono font-medium">
                    {bio.length}/150
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button 
                    onClick={() => {
                      setIsEditingProfile(false);
                      setBio(profile?.bio || "");
                      setAvatarUrl(profile?.avatarUrl || "");
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 text-text-primary text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 py-2.5 rounded-xl bg-text-primary hover:bg-black text-white text-sm font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start space-x-4">
                <div className="shrink-0 w-16 h-16 rounded-full bg-black/5 flex items-center justify-center overflow-hidden border border-black/10">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-text-tertiary" />
                  )}
                </div>
                <div className="flex flex-col pt-1">
                  <h3 className="font-semibold text-text-primary tracking-tight">{user?.displayName || "Seeker"}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed mt-1">
                    {profile?.bio || <span className="italic opacity-60">No bio set. Add to your aesthetic.</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Account Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-text-tertiary px-1">Account</h2>
          <div className="bg-white/60 backdrop-blur-md rounded-[24px] border border-black/5 p-4 flex flex-col space-y-4 shadow-[0_8px_32px_rgb(0,0,0,0.04)]">
            <div className="px-2">
              <p className="text-sm font-medium text-text-primary">{user?.displayName || "Seeker"}</p>
              <p className="text-sm text-text-secondary">{user?.email}</p>
            </div>
            <div className="h-px w-full bg-black/5"></div>
            <button
              onClick={signOut}
              className="flex items-center space-x-3 px-2 py-2 w-full text-left text-text-secondary hover:text-text-primary transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-black/5 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                <LogOut className="w-4 h-4 ml-[2px]" />
              </div>
              <span className="text-sm font-medium tracking-wide">Sign Out</span>
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-red-500/80 px-1">Danger Zone</h2>
          <div className="bg-red-50/50 backdrop-blur-md rounded-[24px] border border-red-100 p-4 shadow-[0_8px_32px_rgb(255,0,0,0.03)]">
            <button
              onClick={() => setShowWipeConfirm(true)}
              className="flex items-center space-x-3 px-2 py-2 w-full text-left text-red-600 hover:text-red-700 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-wide">Wipe All My Data</span>
                <span className="text-xs text-red-500/80 mt-0.5">Permanently delete logs, audio, and images</span>
              </div>
            </button>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showWipeConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
            onClick={() => setShowWipeConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="w-full max-w-sm bg-white/90 backdrop-blur-2xl border border-white shadow-[0_32px_64px_rgb(0,0,0,0.15)] rounded-[24px] overflow-hidden relative flex flex-col p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-2">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-medium tracking-tight text-text-primary">Wipe All Data?</h3>
                <p className="text-sm text-text-secondary">
                  This will permanently delete all your emotional logs, audio transcripts, images, and dashboards. This action cannot be undone.
                </p>
                <div className="flex w-full space-x-3 mt-6 pt-2">
                  <button
                    onClick={() => setShowWipeConfirm(false)}
                    className="flex-1 py-3 px-4 rounded-full bg-black/5 hover:bg-black/10 text-text-primary text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWipe}
                    className="flex-1 py-3 px-4 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                  >
                    Yes, Wipe It
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
