// app/[locale]/authority/ddo/reports/custom/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "../../../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Screen from "../../../../../components/Screen";
import * as XLSX from "xlsx";

export default function CustomReportPage() {
  const router = useRouter();
  const params = useParams() as { locale?: string };
  const locale = params?.locale || "en";
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedGPs, setSelectedGPs] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableGPs, setAvailableGPs] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [reportType, setReportType] = useState("summary");
  const [format, setFormat] = useState("excel");

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const authorityDoc = await getDoc(doc(db, "authorities", user.uid));
      const district = authorityDoc.data()?.district;

      if (!district) return;

      const issuesQuery = query(
        collection(db, "issues"),
        where("district", "==", district)
      );
      const issuesSnap = await getDocs(issuesQuery);

      const gps = new Set<string>();
      const categories = new Set<string>();

      issuesSnap.forEach(doc => {
        const data = doc.data();
        if (data.panchayatName) gps.add(data.panchayatName);
        if (data.category) categories.add(data.category);
      });

      setAvailableGPs(Array.from(gps));
      setAvailableCategories(Array.from(categories));
    } catch (error) {
      console.error("Error loading filters:", error);
    }
  };

  const generateCustomReport = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const authorityDoc = await getDoc(doc(db, "authorities", user.uid));
      const district = authorityDoc.data()?.district;

      if (!district) return;

      // Build query with filters
      let q = query(
        collection(db, "issues"),
        where("district", "==", district)
      );

      const issuesSnap = await getDocs(q);
      let issues = issuesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply date filter
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59);

      issues = issues.filter(issue => {
        const issueDate = issue.createdAt?.toDate?.() || new Date(issue.createdAt);
        return issueDate >= start && issueDate <= end;
      });

      // Apply GP filter
      if (selectedGPs.length > 0) {
        issues = issues.filter(issue => selectedGPs.includes(issue.panchayatName));
      }

      // Apply category filter
      if (selectedCategories.length > 0) {
        issues = issues.filter(issue => selectedCategories.includes(issue.category));
      }

      // Generate report based on type
      let reportData;
      switch (reportType) {
        case "summary":
          reportData = generateSummaryReport(issues, district);
          break;
        case "detailed":
          reportData = generateDetailedReport(issues, district);
          break;
        case "performance":
          reportData = generatePerformanceReport(issues, district);
          break;
        default:
          reportData = issues;
      }

      // Download based on format
      if (format === "excel") {
        downloadExcel(reportData, district);
      } else if (format === "csv") {
        downloadCSV(reportData, district);
      } else {
        downloadJSON(reportData, district);
      }

    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSummaryReport = (issues: any[], district: string) => {
    const total = issues.length;
    const resolved = issues.filter(i => i.status === "resolved").length;
    const pending = issues.filter(i => ["pending", "in_progress"].includes(i.status)).length;
    const escalated = issues.filter(i => i.escalated).length;

    return {
      reportType: "Summary Report",
      generatedAt: new Date().toISOString(),
      district,
      dateRange,
      statistics: {
        total,
        resolved,
        pending,
        escalated,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
        escalationRate: total > 0 ? Math.round((escalated / total) * 100) : 0
      },
      issues
    };
  };

  const generateDetailedReport = (issues: any[], district: string) => {
    return {
      reportType: "Detailed Report",
      generatedAt: new Date().toISOString(),
      district,
      dateRange,
      issues: issues.map(i => ({
        id: i.id,
        title: i.title,
        category: i.category,
        status: i.status,
        panchayat: i.panchayatName,
        createdAt: i.createdAt?.toDate?.()?.toISOString() || i.createdAt,
        resolvedAt: i.resolvedAt?.toDate?.()?.toISOString() || i.resolvedAt,
        escalated: i.escalated
      }))
    };
  };

  const generatePerformanceReport = (issues: any[], district: string) => {
    // Group by GP
    const gpStats: Record<string, any> = {};
    issues.forEach(issue => {
      const gp = issue.panchayatName || "Unknown";
      if (!gpStats[gp]) {
        gpStats[gp] = { total: 0, resolved: 0, escalated: 0, totalTime: 0 };
      }
      gpStats[gp].total++;
      if (issue.status === "resolved") {
        gpStats[gp].resolved++;
        const created = issue.createdAt?.toDate?.() || new Date(issue.createdAt);
        const resolved = issue.resolvedAt?.toDate?.() || new Date(issue.resolvedAt);
        const days = Math.ceil((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        gpStats[gp].totalTime += days;
      }
      if (issue.escalated) gpStats[gp].escalated++;
    });

    const performance = Object.entries(gpStats).map(([name, stats]) => ({
      gramPanchayat: name,
      totalIssues: stats.total,
      resolved: stats.resolved,
      escalated: stats.escalated,
      resolutionRate: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0,
      avgResolutionTime: stats.resolved > 0 ? Math.round(stats.totalTime / stats.resolved) : 0
    }));

    return {
      reportType: "Performance Report",
      generatedAt: new Date().toISOString(),
      district,
      dateRange,
      performance
    };
  };

  const downloadExcel = (data: any, district: string) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [data]);
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `custom_report_${district}_${dateRange.startDate}.xlsx`);
  };

  const downloadCSV = (data: any, district: string) => {
    const ws = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [data]);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `custom_report_${district}_${dateRange.startDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = (data: any, district: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `custom_report_${district}_${dateRange.startDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Screen padded>
      <div className="max-w-4xl mx-auto p-4">
        <button
          onClick={() => router.back()}
          className="mb-6 text-green-700 hover:text-green-900 flex items-center gap-2"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-green-900 mb-6">Custom Report Generator</h1>

        <div className="bg-white border border-green-100 rounded-2xl p-6 space-y-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-bold text-green-900 mb-2">Date Range</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full p-3 border border-green-200 rounded-xl"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full p-3 border border-green-200 rounded-xl"
              />
            </div>
          </div>

          {/* Gram Panchayat Filter */}
          <div>
            <label className="block text-sm font-bold text-green-900 mb-2">
              Gram Panchayats ({selectedGPs.length} selected)
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 border border-green-100 rounded-xl">
              {availableGPs.map(gp => (
                <label key={gp} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedGPs.includes(gp)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGPs([...selectedGPs, gp]);
                      } else {
                        setSelectedGPs(selectedGPs.filter(g => g !== gp));
                      }
                    }}
                    className="rounded text-green-600"
                  />
                  {gp}
                </label>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-bold text-green-900 mb-2">
              Categories ({selectedCategories.length} selected)
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 border border-green-100 rounded-xl">
              {availableCategories.map(cat => (
                <label key={cat} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, cat]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(c => c !== cat));
                      }
                    }}
                    className="rounded text-green-600"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-bold text-green-900 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full p-3 border border-green-200 rounded-xl"
            >
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Report</option>
              <option value="performance">Performance Report</option>
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-bold text-green-900 mb-2">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full p-3 border border-green-200 rounded-xl"
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="json">JSON (.json)</option>
            </select>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateCustomReport}
            disabled={loading}
            className="w-full py-4 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Custom Report"}
          </button>
        </div>
      </div>
    </Screen>
  );
}
