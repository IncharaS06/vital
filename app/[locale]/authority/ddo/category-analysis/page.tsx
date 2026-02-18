// app/[locale]/authority/ddo/category-analysis/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../../../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import Screen from "../../../../../components/Screen";
import { motion, AnimatePresence } from "framer-motion";

// Translation dictionary
const translations = {
  en: {
    back: "← Back",
    title: "Category Analysis",
    loading: "Loading...",
    totalIssues: "Total Issues:",
    resolved: "Resolved:",
    pending: "Pending:",
    escalated: "Escalated:",
    gpsAffected: "GPs Affected:",
    resolutionRate: "Resolution Rate:",
    avgTime: "Avg Time:",
    days: "days",
    noData: "No category data available",
    stats: "Statistics",
    viewDetails: "View Details",
    tapForMore: "Tap for more details",
    pullToRefresh: "Pull to refresh",
    lastUpdated: "Last updated",
    categories: "Categories"
  },
  hi: {
    back: "← वापस",
    title: "श्रेणी विश्लेषण",
    loading: "लोड हो रहा है...",
    totalIssues: "कुल समस्याएं:",
    resolved: "हल की गईं:",
    pending: "लंबित:",
    escalated: "एस्केलेटेड:",
    gpsAffected: "प्रभावित जीपी:",
    resolutionRate: "समाधान दर:",
    avgTime: "औसत समय:",
    days: "दिन",
    noData: "कोई श्रेणी डेटा उपलब्ध नहीं है",
    stats: "आंकड़े",
    viewDetails: "विवरण देखें",
    tapForMore: "अधिक जानकारी के लिए टैप करें",
    pullToRefresh: "रिफ्रेश के लिए खींचें",
    lastUpdated: "अंतिम अपडेट",
    categories: "श्रेणियाँ"
  },
  gu: {
    back: "← પાછા",
    title: "શ્રેણી વિશ્લેષણ",
    loading: "લોડ થઈ રહ્યું છે...",
    totalIssues: "કુલ સમસ્યાઓ:",
    resolved: "હલ થયેલ:",
    pending: "બાકી:",
    escalated: "એસ્કેલેટેડ:",
    gpsAffected: "અસરગ્રસ્ત GP:",
    resolutionRate: "સમાધાન દર:",
    avgTime: "સરેરાશ સમય:",
    days: "દિવસ",
    noData: "કોઈ શ્રેણી ડેટા ઉપલબ્ધ નથી",
    stats: "આંકડા",
    viewDetails: "વિગતો જુઓ",
    tapForMore: "વધુ વિગતો માટે ટેપ કરો",
    pullToRefresh: "રિફ્રેશ માટે ખેંચો",
    lastUpdated: "છેલ્લું અપડેટ",
    categories: "શ્રેણીઓ"
  }
};

export default function CategoryAnalysisPage() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "en";
  const t = translations[locale as keyof typeof translations] || translations.en;
  
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCategoryData();
  }, []);

  const loadCategoryData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push(`/${locale}/authority/login`);
        return;
      }

      const authorityDoc = await getDoc(doc(db, "authorities", user.uid));
      const district = authorityDoc.data()?.district;

      if (!district) return;

      const issuesQuery = query(
        collection(db, "issues"),
        where("district", "==", district)
      );
      const issuesSnap = await getDocs(issuesQuery);

      const categoryStats: Record<string, any> = {};

      issuesSnap.forEach(doc => {
        const data = doc.data();
        const category = data.category || "Other";

        if (!categoryStats[category]) {
          categoryStats[category] = {
            name: category,
            total: 0,
            resolved: 0,
            pending: 0,
            escalated: 0,
            gps: new Set(),
            totalTime: 0
          };
        }

        categoryStats[category].total++;
        categoryStats[category].gps.add(data.panchayatName);

        if (data.status === "resolved") {
          categoryStats[category].resolved++;
          const created = data.createdAt?.toDate?.() || new Date(data.createdAt);
          const resolved = data.resolvedAt?.toDate?.() || new Date(data.resolvedAt);
          const days = Math.ceil((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          categoryStats[category].totalTime += days;
        } else if (["pending", "in_progress"].includes(data.status)) {
          categoryStats[category].pending++;
        }

        if (data.escalated) {
          categoryStats[category].escalated++;
        }
      });

      const categoryArray = Object.values(categoryStats).map((cat: any) => ({
        ...cat,
        gps: cat.gps.size,
        resolutionRate: cat.total > 0 ? Math.round((cat.resolved / cat.total) * 100) : 0,
        avgResolutionTime: cat.resolved > 0 ? Math.round(cat.totalTime / cat.resolved) : 0
      }));

      setCategories(categoryArray.sort((a, b) => b.total - a.total));
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading category data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCategoryData();
  };

  const handleCategoryClick = (category: any) => {
    setSelectedCategory(category);
    setShowDetails(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  const progressBarVariants = {
    hidden: { width: 0 },
    visible: (width: number) => ({
      width: `${width}%`,
      transition: {
        duration: 1,
        ease: "easeOut"
      }
    })
  };

  return (
    <Screen>
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        {/* Header with pull-to-refresh indicator */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-green-100">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <motion.button
                onClick={() => router.back()}
                className="text-green-700 hover:text-green-900 flex items-center gap-2 text-sm md:text-base"
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-lg">←</span>
                <span className="hidden sm:inline">{t.back}</span>
              </motion.button>
              
              <motion.h1 
                className="text-lg md:text-2xl font-bold text-green-900"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {t.title}
              </motion.h1>

              <motion.button
                onClick={handleRefresh}
                className="p-2 rounded-full bg-green-100 text-green-700"
                whileTap={{ rotate: 180 }}
                animate={{ rotate: refreshing ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </motion.button>
            </div>

            {/* Last updated - mobile friendly */}
            <motion.p 
              className="text-xs text-green-600 mt-2 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {t.lastUpdated}: {lastUpdated.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
            </motion.p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full"
              />
              <p className="mt-4 text-green-700">{t.loading}</p>
            </div>
          ) : categories.length === 0 ? (
            <motion.div 
              className="text-center py-12 bg-white rounded-2xl border border-green-100"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-green-700">{t.noData}</p>
            </motion.div>
          ) : (
            <>
              {/* Category Cards - Mobile optimized grid */}
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {categories.map((category, index) => (
                  <motion.div
                    key={category.name}
                    variants={itemVariants}
                    whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategoryClick(category)}
                    className="bg-white border border-green-100 rounded-xl md:rounded-2xl p-4 md:p-6 cursor-pointer touch-manipulation"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base md:text-lg font-bold text-green-900 truncate pr-2">
                        {category.name}
                      </h3>
                      <span className="text-xs md:text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        {category.total}
                      </span>
                    </div>

                    {/* Mobile-optimized stats grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-green-50 rounded-lg p-2">
                        <p className="text-xs text-green-700">{t.resolved}</p>
                        <p className="text-sm font-bold text-green-600">{category.resolved}</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-2">
                        <p className="text-xs text-yellow-700">{t.pending}</p>
                        <p className="text-sm font-bold text-yellow-600">{category.pending}</p>
                      </div>
                    </div>

                    {/* Progress bar - mobile friendly */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-700">{t.resolutionRate}</span>
                        <motion.span 
                          className={`font-bold ${
                            category.resolutionRate >= 80 ? 'text-green-600' :
                            category.resolutionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        >
                          {category.resolutionRate}%
                        </motion.span>
                      </div>
                      <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-green-500"
                          custom={category.resolutionRate}
                          variants={progressBarVariants}
                          initial="hidden"
                          animate="visible"
                        />
                      </div>
                    </div>

                    {/* Mobile tap hint */}
                    <motion.p 
                      className="text-xs text-green-400 mt-3 text-center md:hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      {t.tapForMore}
                    </motion.p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Category Details Modal - Mobile optimized */}
              <AnimatePresence>
                {showDetails && selectedCategory && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
                    onClick={() => setShowDetails(false)}
                  >
                    {/* Backdrop */}
                    <motion.div 
                      className="absolute inset-0 bg-black/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />

                    {/* Modal Content - Mobile friendly from bottom */}
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className="relative bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg p-6 md:m-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg md:text-xl font-bold text-green-900">
                          {selectedCategory.name} - {t.details}
                        </h3>
                        <motion.button
                          onClick={() => setShowDetails(false)}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 hover:bg-green-50 rounded-full"
                        >
                          <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </motion.button>
                      </div>

                      <div className="space-y-4">
                        <motion.div 
                          className="grid grid-cols-2 gap-3"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="bg-green-50 rounded-xl p-4">
                            <p className="text-xs text-green-700 mb-1">{t.totalIssues}</p>
                            <p className="text-2xl font-bold text-green-900">{selectedCategory.total}</p>
                          </div>
                          <div className="bg-green-50 rounded-xl p-4">
                            <p className="text-xs text-green-700 mb-1">{t.gpsAffected}</p>
                            <p className="text-2xl font-bold text-green-900">{selectedCategory.gps}</p>
                          </div>
                        </motion.div>

                        <motion.div 
                          className="space-y-3"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-green-700">{t.resolved}</span>
                            <span className="font-bold text-green-600">{selectedCategory.resolved}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-green-700">{t.pending}</span>
                            <span className="font-bold text-yellow-600">{selectedCategory.pending}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-green-700">{t.escalated}</span>
                            <span className="font-bold text-red-600">{selectedCategory.escalated}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-green-700">{t.resolutionRate}</span>
                            <span className={`font-bold ${
                              selectedCategory.resolutionRate >= 80 ? 'text-green-600' :
                              selectedCategory.resolutionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {selectedCategory.resolutionRate}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-green-700">{t.avgTime}</span>
                            <span className="font-bold">{selectedCategory.avgResolutionTime} {t.days}</span>
                          </div>
                        </motion.div>

                        <motion.button
                          onClick={() => setShowDetails(false)}
                          className="w-full mt-4 bg-green-600 text-white py-3 rounded-xl font-medium"
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          Close
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      {/* Mobile swipe indicator */}
      <motion.div 
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 md:hidden bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        <p className="text-xs text-green-700">↓ {t.pullToRefresh}</p>
      </motion.div>
    </Screen>
  );
}
