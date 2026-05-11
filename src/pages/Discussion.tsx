import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Send, CheckCircle, ChevronLeft, Film, Users, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Discussion() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    filmTitle: '',
    stage: 'Development',
    challenge: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // In a real app, we would send this to a backend/CRM
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-black-2 border border-border-subtle p-10 rounded-card-lg text-center space-y-6"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-[24px] font-bold text-white tracking-tight">Message Received</h2>
            <p className="text-white-secondary text-[15px]">
              We've received your request. One of our strategists will review your project and reach out within 24 hours.
            </p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-white text-black font-bold rounded-full transition-transform active:scale-95"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black-1 text-white selection:bg-crimson">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-crimson/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-crimson/5 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 px-6 py-10 max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-white-tertiary hover:text-white transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest">Back</span>
        </Link>
        <img 
          src="https://storage.googleapis.com/bluestark_explorer/kinema-logo.png" 
          alt="Kinema Logo" 
          className="h-8 w-auto opacity-80" 
        />
        <div className="w-10" /> {/* Spacer */}
      </nav>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-20">
        <div className="space-y-12">
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson/10 border border-crimson/20 text-crimson font-mono text-[10px] font-bold tracking-widest uppercase">
              <Shield className="w-3 h-3" />
              100% Secure & Confidential
            </div>
            <h1 className="text-[clamp(40px,5vw,56px)] font-bold leading-tight tracking-tighter">
              Let's explore your film's potential.
            </h1>
            <p className="text-white-secondary text-[18px]">
              Complete this brief form to help us understand your vision. No commitment required.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-[11px] font-mono font-bold text-white-tertiary uppercase tracking-widest">Full Name</label>
                      <input 
                        required
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="w-full bg-black-3 border border-border-default rounded-2xl px-5 py-4 text-[15px] focus:border-crimson outline-none transition-all placeholder:text-white-tertiary/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[11px] font-mono font-bold text-white-tertiary uppercase tracking-widest">Work Email</label>
                      <input 
                        required
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@studio.com"
                        className="w-full bg-black-3 border border-border-default rounded-2xl px-5 py-4 text-[15px] focus:border-crimson outline-none transition-all placeholder:text-white-tertiary/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono font-bold text-white-tertiary uppercase tracking-widest">Company / Studio</label>
                    <input 
                      required
                      type="text" 
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="e.g., Star Pictures"
                      className="w-full bg-black-3 border border-border-default rounded-2xl px-5 py-4 text-[15px] focus:border-crimson outline-none transition-all placeholder:text-white-tertiary/30"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={nextStep}
                    disabled={!formData.name || !formData.email || !formData.company}
                    className="w-full py-5 bg-crimson hover:bg-crimson-rich text-white font-bold rounded-full transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Step
                    <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono font-bold text-white-tertiary uppercase tracking-widest">Film Title (or Project Code)</label>
                    <input 
                      type="text" 
                      name="filmTitle"
                      value={formData.filmTitle}
                      onChange={handleInputChange}
                      placeholder="e.g., The Last Horizon"
                      className="w-full bg-black-3 border border-border-default rounded-2xl px-5 py-4 text-[15px] focus:border-crimson outline-none transition-all placeholder:text-white-tertiary/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono font-bold text-white-tertiary uppercase tracking-widest">Production Stage</label>
                    <select 
                      name="stage"
                      value={formData.stage}
                      onChange={handleInputChange}
                      className="w-full bg-black-3 border border-border-default rounded-2xl px-5 py-4 text-[15px] focus:border-crimson outline-none transition-all appearance-none"
                    >
                      <option>Development</option>
                      <option>Pre-Production</option>
                      <option>Production (On-set)</option>
                      <option>Post-Production</option>
                      <option>Ready for Release</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono font-bold text-white-tertiary uppercase tracking-widest">Main Marketing Challenge</label>
                    <textarea 
                      required
                      name="challenge"
                      value={formData.challenge}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="What is your primary goal or hurdle?"
                      className="w-full bg-black-3 border border-border-default rounded-2xl px-5 py-4 text-[15px] focus:border-crimson outline-none transition-all placeholder:text-white-tertiary/30 resize-none"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button 
                      type="button" 
                      onClick={prevStep}
                      className="flex-1 py-5 bg-black-3 border border-border-default hover:bg-black-4 text-white font-bold rounded-full transition-all"
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={!formData.challenge}
                      className="flex-[2] py-5 bg-crimson hover:bg-crimson-rich text-white font-bold rounded-full transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Request Consultation
                      <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <footer className="pt-12 border-t border-border-subtle flex flex-wrap gap-8">
            <div className="flex items-center gap-3 text-white-tertiary">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-[12px] font-medium">Trusted by major<br/>studios</div>
            </div>
            <div className="flex items-center gap-3 text-white-tertiary">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-[12px] font-medium">100% NDA<br/>compliant</div>
            </div>
            <div className="flex items-center gap-3 text-white-tertiary">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-[12px] font-medium">24h response<br/>guarantee</div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
