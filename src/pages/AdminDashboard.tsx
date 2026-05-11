import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, addDoc, deleteDoc, doc, serverTimestamp, orderBy, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Users, UserPlus, Trash2, ShieldCheck, Mail, Calendar, ArrowLeft, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Client {
  id: string;
  email: string;
  addedBy: string;
  createdAt: any;
}

interface TeamMember {
  id: string;
  email: string;
  role: string;
  addedBy: string;
  createdAt: any;
}

type Tab = 'clients' | 'team' | 'seeding';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [bulkJson, setBulkJson] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab !== 'seeding') {
      fetchData();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'clients') {
        const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const clientsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Client[];
        setClients(clientsData);
      } else if (activeTab === 'team') {
        const q = query(collection(db, 'team'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const teamData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TeamMember[];
        setTeam(teamData);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkJson.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const data = JSON.parse(bulkJson);
      if (!Array.isArray(data)) throw new Error("Input must be a JSON array");

      for (const item of data) {
        await addDoc(collection(db, 'campaigns'), {
          ...item,
          userId: user.uid, // Default to admin's UID for sample data
          createdAt: serverTimestamp(),
          status: 'active'
        });
      }
      
      alert(`Successfully uploaded ${data.length} campaigns.`);
      setBulkJson('');
    } catch (error) {
      console.error("Bulk upload failed:", error);
      alert("Invalid JSON format or upload error. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const email = newEmail.trim().toLowerCase();
      if (activeTab === 'clients') {
        await addDoc(collection(db, 'clients'), {
          email,
          addedBy: user.uid,
          createdAt: serverTimestamp()
        });
      } else {
        // For team, we use email as ID for easier lookup in rules
        await setDoc(doc(db, 'team', email), {
          email,
          role: 'admin',
          addedBy: user.uid,
          createdAt: serverTimestamp()
        });
      }
      setNewEmail('');
      await fetchData();
    } catch (error) {
      console.error(`Error adding ${activeTab}:`, error);
      alert(`Failed to add ${activeTab === 'team' ? 'team member' : 'client'}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${email}?`)) return;

    try {
      const collectionName = activeTab;
      await deleteDoc(doc(db, collectionName, id));
      await fetchData();
    } catch (error) {
      console.error(`Error deleting from ${activeTab}:`, error);
      alert("Failed to delete.");
    }
  };

  return (
    <div className="min-h-screen bg-black-1 text-white-primary font-sans selection:bg-crimson/30">
      {/* Top Nav */}
      <nav className="border-b border-white/5 bg-black-2/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white-tertiary hover:text-white-primary"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-crimson" />
              <span className="font-bold tracking-tight">Kinema Admin Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-mono text-white-tertiary">Logged in as</p>
              <p className="text-[12px] font-medium text-white-secondary">{user?.email}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-crimson/20 border border-crimson/30 flex items-center justify-center text-crimson font-bold text-xs">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-[32px] md:text-[40px] font-bold tracking-tighter leading-none">
            Access Management
          </h1>
          <div className="flex border-b border-white/5 gap-8 mt-8">
            <button 
              onClick={() => setActiveTab('clients')}
              className={`pb-4 text-sm font-bold tracking-widest uppercase transition-all relative ${activeTab === 'clients' ? 'text-white-primary' : 'text-white-tertiary hover:text-white-secondary'}`}
            >
              Clients
              {activeTab === 'clients' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-crimson" />}
            </button>
            <button 
              onClick={() => setActiveTab('team')}
              className={`pb-4 text-sm font-bold tracking-widest uppercase transition-all relative ${activeTab === 'team' ? 'text-white-primary' : 'text-white-tertiary hover:text-white-secondary'}`}
            >
              Internal Team
              {activeTab === 'team' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-crimson" />}
            </button>
            <button 
              onClick={() => setActiveTab('seeding')}
              className={`pb-4 text-sm font-bold tracking-widest uppercase transition-all relative ${activeTab === 'seeding' ? 'text-white-primary' : 'text-white-tertiary hover:text-white-secondary'}`}
            >
              Seeding
              {activeTab === 'seeding' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-crimson" />}
            </button>
          </div>
        </div>

        {activeTab === 'seeding' ? (
          <section className="bg-black-2 border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 text-white-secondary">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="font-semibold">Bulk Upload Sample Campaigns</h2>
            </div>
            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-mono uppercase tracking-widest text-white-tertiary">JSON Array of Campaigns</label>
                <textarea 
                  value={bulkJson}
                  onChange={(e) => setBulkJson(e.target.value)}
                  placeholder='[{"title": "Epic Space Odyssey", "genre": "Sci-Fi", "budgetTier": "High"}, ...]'
                  className="w-full h-64 bg-black-3 border border-white/10 rounded-xl p-4 text-[13px] font-mono focus:outline-none focus:border-crimson/50 focus:ring-1 focus:ring-crimson/50 transition-all placeholder:text-white/10"
                />
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-crimson hover:bg-crimson-rich disabled:opacity-50 text-white py-4 rounded-xl font-bold transition-all active:scale-95"
              >
                {isSubmitting ? "Uploading..." : "Start Bulk Import"}
              </button>
              <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                <p className="text-[12px] text-white-tertiary leading-relaxed">
                  <span className="text-white-secondary font-bold">Schema Note:</span><br />
                  Each object should have: <code className="text-crimson">title</code> (required), <code className="text-crimson">genre</code>, <code className="text-crimson">budgetTier</code>, <code className="text-crimson">releaseWindow</code>, <code className="text-crimson">ipType</code>, <code className="text-crimson">logline</code>, <code className="text-crimson">leadCast</code>, <code className="text-crimson">director</code>.
                </p>
              </div>
            </form>
          </section>
        ) : (
          <>
            {/* Add Section */}
            <section className="bg-black-2 border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 text-white-secondary">
            {activeTab === 'clients' ? <UserPlus className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
            <h2 className="font-semibold">{activeTab === 'clients' ? 'Authorize New Client' : 'Add Team Member'}</h2>
          </div>
          <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white-tertiary" />
              <input 
                type="email"
                placeholder={activeTab === 'clients' ? 'client@company.com' : 'name@kinema.studio'}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full bg-black-3 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-[15px] focus:outline-none focus:border-crimson/50 focus:ring-1 focus:ring-crimson/50 transition-all placeholder:text-white/20"
              />
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-crimson hover:bg-crimson-rich disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Grant Access
                </>
              )}
            </button>
          </form>
        </section>

        {/* List Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white-secondary">
              {activeTab === 'clients' ? <Users className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
              <h2 className="font-semibold uppercase text-[12px] tracking-[0.2em]">{activeTab} ({activeTab === 'clients' ? clients.length : team.length})</h2>
            </div>
          </div>

          <div className="grid gap-3">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-black-2/50 border border-white/5 rounded-xl animate-pulse" />
              ))
            ) : (activeTab === 'clients' ? clients : team).length === 0 ? (
              <div className="bg-black-2/30 border border-dashed border-white/10 rounded-2xl py-20 text-center space-y-4">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6 text-white-tertiary" />
                </div>
                <p className="text-white-tertiary italic">No {activeTab} authorized yet.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {(activeTab === 'clients' ? clients : team).map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-black-2 hover:bg-black-3 border border-white/5 hover:border-white/10 rounded-xl p-4 md:p-6 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white-tertiary border border-white/5">
                        {activeTab === 'clients' ? <Users className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-[16px]">{item.email}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1.5 text-[11px] text-white-tertiary">
                            <Calendar className="w-3 h-3" />
                            {item.createdAt?.toDate().toLocaleDateString()}
                          </span>
                          {activeTab === 'team' && (
                            <span className="bg-crimson/10 text-crimson text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-crimson/20">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteItem(item.id, item.email)}
                      className="p-3 text-white-tertiary hover:text-crimson hover:bg-crimson/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Revoke Access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </section>
      </>
    )}
  </main>
</div>
  );
}
