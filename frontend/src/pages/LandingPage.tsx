import { motion } from "framer-motion";
import { Shield, FileSearch, CheckCircle, Scale, Lock, EyeOff, FileKey } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatedButton } from "../components/ui/AnimatedButton";
import { AnimatedCard } from "../components/ui/AnimatedCard";

export function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      title: "Explain",
      description: "Understand exactly why information was hidden and why other information remained visible.",
      icon: <FileSearch className="w-6 h-6 text-conseal-primary" />
    },
    {
      title: "Verify",
      description: "Mechanically verify that sensitive data is actually removed from the exported document.",
      icon: <CheckCircle className="w-6 h-6 text-conseal-success" />
    },
    {
      title: "Challenge",
      description: "Review edge cases and near misses where context dictates redaction rules.",
      icon: <Scale className="w-6 h-6 text-conseal-warning" />
    }
  ];

  return (
    <div className="h-full w-full overflow-y-auto relative bg-[#0B0D17]">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 100, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-conseal-primary/20 blur-[120px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-conseal-nearmiss/20 blur-[120px] rounded-full"
        />
      </div>

      {/* Floating Privacy Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[15%] left-[20%] text-conseal-primary/20"><Lock className="w-12 h-12" /></motion.div>
        <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[30%] right-[15%] text-conseal-warning/20"><EyeOff className="w-16 h-16" /></motion.div>
        <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[20%] left-[10%] text-conseal-success/20"><FileKey className="w-10 h-10" /></motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center relative z-10">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl space-y-6 mb-20"
        >
          <div className="inline-flex items-center justify-center p-2 bg-conseal-card border border-conseal-border rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-conseal-primary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 leading-tight pb-2">
            Trust Every Redaction.
          </h1>
          <p className="text-lg md:text-xl text-conseal-text-secondary font-medium">
            Understand every privacy decision before sharing your documents.
          </p>
          <div className="flex items-center justify-center gap-4 pt-8">
            <AnimatedButton onClick={() => navigate("/upload")} className="px-8 py-4 text-lg font-bold shadow-lg shadow-conseal-primary/20">
              Upload Document
            </AnimatedButton>
          </div>
        </motion.div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 + 0.3 }}
            >
              <AnimatedCard className="h-full flex flex-col items-start text-left hover:border-conseal-primary/50 transition-colors group bg-white/[0.02] backdrop-blur-xl border-white/10">
                <motion.div 
                  className="p-3 bg-black/40 rounded-xl mb-6 shadow-inner border border-white/5 group-hover:scale-110 transition-transform"
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-conseal-text-secondary leading-relaxed font-medium">
                  {feature.description}
                </p>
              </AnimatedCard>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
