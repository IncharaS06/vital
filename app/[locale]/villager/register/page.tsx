"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Screen from "../../../components/Screen";
import { auth, db } from "../../../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where,
    limit,
} from "firebase/firestore";
import { FiEye, FiEyeOff, FiCheckCircle, FiXCircle, FiAlertCircle, FiMail, FiLock, FiUser, FiPhone, FiMapPin, FiHome, FiShield, FiArrowLeft } from "react-icons/fi";

type Locale = "en" | "kn" | "hi";

type District = { 
    id: string; 
    name: string; 
    code?: string; 
    state?: string;
    isActive?: boolean;
};

type Taluk = { 
    id: string; 
    name: string; 
    districtId: string;
    districtName: string;
    isActive?: boolean;
};

type Village = {
    id: string;
    name: string;
    districtId: string;
    districtName: string;
    talukId: string;
    talukName: string;
    isActive?: boolean;
};

type Panchayat = {
    id: string;
    name: string;
    code?: string;
    districtId: string;
    talukId: string;
    villageId?: string;
    villageName?: string;
    isActive?: boolean;
};

const animationStyles = `
  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyfloat {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05);
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  @keyframes shake {
    0%, 100% {
      transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: translateX(-5px);
    }
    20%, 40%, 60%, 80% {
      transform: translateX(5px);
    }
  }

  @keyframes checkBounce {
    0% {
      transform: scale(0.8);
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes glow {
    0%, 100% {
      box-shadow: 0 0 5px rgba(34, 197, 94, 0.3);
    }
    50% {
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
    }
  }

  @keyframes borderGlow {
    0%, 100% {
      border-color: rgba(34, 197, 94, 0.3);
    }
    50% {
      border-color: rgba(34, 197, 94, 0.8);
    }
  }

  .animate-slide-in-down {
    animation: slideInDown 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-slide-in-up {
    animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-slide-in-left {
    animation: slideInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-slide-in-right {
    animation: slideInRight 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-fade-in {
    animation: fadeIn 0.6s ease-out forwards;
  }

  .animate-scale-in {
    animation: scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-pulse-slow {
    animation: pulse 2s ease-in-out infinite;
  }

  .animate-shake {
    animation: shake 0.5s cubic-bezier(0.36, 0, 0.66, 1) forwards;
  }

  .animate-check-bounce {
    animation: checkBounce 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .animate-glow {
    animation: glow 2s ease-in-out infinite;
  }

  .animate-border-glow {
    animation: borderGlow 1.5s ease-in-out infinite;
  }

  .stagger-1 { animation-delay: 0.1s; }
  .stagger-2 { animation-delay: 0.2s; }
  .stagger-3 { animation-delay: 0.3s; }
  .stagger-4 { animation-delay: 0.4s; }
  .stagger-5 { animation-delay: 0.5s; }
  .stagger-6 { animation-delay: 0.6s; }
  .stagger-7 { animation-delay: 0.7s; }
  .stagger-8 { animation-delay: 0.8s; }
  .stagger-9 { animation-delay: 0.9s; }
  .stagger-10 { animation-delay: 1s; }

  /* Form inputs with enhanced effects */
  input, select, textarea {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
  }

  input:hover:not(:disabled), 
  select:hover:not(:disabled), 
  textarea:hover:not(:disabled) {
    border-color: rgb(34, 197, 94);
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
    transform: translateY(-2px);
  }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: rgb(34, 197, 94);
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1), 0 4px 12px rgba(34, 197, 94, 0.2);
    transform: translateY(-2px);
  }

  /* Button animations */
  button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  button::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  button:hover::after {
    width: 300px;
    height: 300px;
  }

  button:active {
    transform: scale(0.95);
  }

  /* Card styles */
  .glass-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(34, 197, 94, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  /* Password strength indicator */
  .strength-bar {
    height: 4px;
    border-radius: 2px;
    transition: all 0.3s ease;
  }

  .strength-bar.weak {
    background: linear-gradient(90deg, #ef4444, #f87171);
  }

  .strength-bar.medium {
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
  }

  .strength-bar.strong {
    background: linear-gradient(90deg, #10b981, #34d399);
  }

  /* Validation check marks */
  .check-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    transition: all 0.3s ease;
  }

  .check-item.valid {
    color: #10b981;
  }

  .check-item.invalid {
    color: #6b7280;
  }

  /* Mobile optimizations */
  @media (max-width: 640px) {
    .glass-card {
      padding: 1rem;
    }
    
    input, select, textarea {
      font-size: 16px !important; /* Prevents zoom on iOS */
      padding: 0.75rem !important;
    }
    
    button {
      padding: 1rem !important;
    }
    
    h1 {
      font-size: 1.5rem !important;
    }
  }

  /* Loading shimmer effect */
  .shimmer {
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }

  /* Success checkmark animation */
  .success-check {
    animation: checkBounce 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  /* Error shake animation */
  .error-shake {
    animation: shake 0.5s cubic-bezier(0.36, 0, 0.66, 1) forwards;
  }

  /* Disabled state */
  input:disabled, select:disabled, button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(34, 197, 94, 0.1);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(34, 197, 94, 0.3);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(34, 197, 94, 0.5);
  }

  /* Floating labels */
  .floating-label-group {
    position: relative;
  }

  .floating-label {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    transition: all 0.3s ease;
    pointer-events: none;
    color: #9ca3af;
    background: white;
    padding: 0 4px;
  }

  .floating-label.active {
    top: 0;
    transform: translateY(-50%);
    font-size: 0.75rem;
    color: rgb(34, 197, 94);
  }

  /* Progress steps */
  .progress-step {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    transition: all 0.3s ease;
  }

  .progress-step.active {
    background: rgba(34, 197, 94, 0.1);
  }

  .progress-step.completed {
    color: #10b981;
  }

  /* Tooltip */
  .tooltip {
    position: relative;
    display: inline-block;
  }

  .tooltip:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    background: #1f2937;
    color: white;
    font-size: 0.75rem;
    border-radius: 4px;
    white-space: nowrap;
    z-index: 10;
  }
`;

export default function VillagerRegisterPage() {
    const router = useRouter();
    const params = useParams() as { locale?: string };
    const locale = ((params?.locale as Locale) || "en") as Locale;

    const t = useMemo(() => {
        const L: Record<Locale, any> = {
            en: {
                title: "Villager Registration",
                subtitle: "Register and wait for Village In-charge verification",
                back: "Back",
                name: "Full Name",
                email: "Email",
                emailPlaceholder: "your.email@example.com",
                emailRestriction: "Only Gmail, Outlook, Yahoo, and government emails are allowed",
                password: "Password",
                passwordPlaceholder: "Enter a strong password",
                mobile: "Mobile Number",
                mobilePlaceholder: "Enter 10-digit mobile number",
                mobileHint: "Indian mobile number starting with 6,7,8, or 9",
                aadhaar: "Aadhaar Number",
                aadhaarPlaceholder: "Enter 12-digit Aadhaar",
                aadhaarHint: "Stored as full 12 digits (only last 4 visible to authorities)",
                district: "District",
                taluk: "Taluk",
                village: "Village",
                panchayat: "Panchayat",
                select: "Select",
                loading: "Loading...",
                register: "Register",
                registering: "Registering...",
                success: "Registration Successful!",
                successDesc: "Redirecting to status page...",
                passwordRequirements: "Password must contain:",
                uppercase: "At least one uppercase letter (A-Z)",
                lowercase: "At least one lowercase letter (a-z)",
                number: "At least one number (0-9)",
                specialChar: "At least one special character (!@#$%^&*)",
                minLength: "At least 8 characters long",
                allFieldsRequired: "All fields marked with * are required",
                alreadyHaveAccount: "Already have an account?",
                login: "Login",
                errors: {
                    fill: "Please fill all fields correctly.",
                    loadLoc: "Failed to load location data.",
                    password: "Please enter a valid password meeting all requirements",
                    aadhaar: "Aadhaar must be exactly 12 digits",
                    mobile: "Please enter a valid 10-digit Indian mobile number",
                    email: "Please enter a valid email address",
                    emailDomain: "Only Gmail, Outlook, Yahoo, and government emails are allowed",
                    mobileInvalid: "Mobile number must start with 6, 7, 8, or 9",
                    name: "Name is required",
                    selectLocation: "Please select all location fields",
                    emailExists: "This email is already registered",
                    networkError: "Network error. Please check your connection.",
                },
            },
            kn: {
                title: "ಗ್ರಾಮಸ್ಥ ನೋಂದಣಿ",
                subtitle: "ನೋಂದಣಿ ಮಾಡಿ ಮತ್ತು ಗ್ರಾಮ ಇಂಚಾರ್ಜ್ ಪರಿಶೀಲನೆಗಾಗಿ ಕಾಯಿರಿ",
                back: "ಹಿಂದೆ",
                name: "ಪೂರ್ಣ ಹೆಸರು",
                email: "ಇಮೇಲ್",
                emailPlaceholder: "ನಿಮ್ಮ ಇಮೇಲ್@ಉದಾಹರಣೆ.ಕಾಂ",
                emailRestriction: "Gmail, Outlook, Yahoo ಮತ್ತು ಸರ್ಕಾರಿ ಇಮೇಲ್‌ಗಳನ್ನು ಮಾತ್ರ ಅನುಮತಿಸಲಾಗಿದೆ",
                password: "ಪಾಸ್‌ವರ್ಡ್",
                passwordPlaceholder: "ಬಲವಾದ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ",
                mobile: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
                mobilePlaceholder: "10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ",
                mobileHint: "6,7,8, ಅಥವಾ 9 ರಿಂದ ಪ್ರಾರಂಭವಾಗುವ ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
                aadhaar: "ಆಧಾರ್ ಸಂಖ್ಯೆ",
                aadhaarPlaceholder: "12-ಅಂಕಿಯ ಆಧಾರ್ ನಮೂದಿಸಿ",
                aadhaarHint: "ಪೂರ್ಣ 12 ಅಂಕೆಗಳಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ (ಕೊನೆಯ 4 ಮಾತ್ರ ಅಧಿಕಾರಿಗಳಿಗೆ ಗೋಚರಿಸುತ್ತದೆ)",
                district: "ಜಿಲ್ಲೆ",
                taluk: "ತಾಲೂಕು",
                village: "ಗ್ರಾಮ",
                panchayat: "ಪಂಚಾಯತ್",
                select: "ಆಯ್ಕೆ ಮಾಡಿ",
                loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
                register: "ನೋಂದಣಿ",
                registering: "ನೋಂದಣಿ ಆಗುತ್ತಿದೆ...",
                success: "ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ!",
                successDesc: "ಸ್ಥಿತಿ ಪುಟಕ್ಕೆ ಮರುನಿರ್ದೇಶಿಸಲಾಗುತ್ತಿದೆ...",
                passwordRequirements: "ಪಾಸ್‌ವರ್ಡ್ ಹೊಂದಿರಬೇಕು:",
                uppercase: "ಕನಿಷ್ಠ ಒಂದು ದೊಡ್ಡ ಅಕ್ಷರ (A-Z)",
                lowercase: "ಕನಿಷ್ಠ ಒಂದು ಸಣ್ಣ ಅಕ್ಷರ (a-z)",
                number: "ಕನಿಷ್ಠ ಒಂದು ಸಂಖ್ಯೆ (0-9)",
                specialChar: "ಕನಿಷ್ಠ ಒಂದು ವಿಶೇಷ ಅಕ್ಷರ (!@#$%^&*)",
                minLength: "ಕನಿಷ್ಠ 8 ಅಕ್ಷರಗಳು",
                allFieldsRequired: "* ಗುರುತಿಸಲಾದ ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳು ಅಗತ್ಯವಿದೆ",
                alreadyHaveAccount: "ಈಗಾಗಲೇ ಖಾತೆ ಹೊಂದಿದ್ದೀರಾ?",
                login: "ಲಾಗಿನ್",
                errors: {
                    fill: "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳನ್ನು ಸರಿಯಾಗಿ ಭರ್ತಿ ಮಾಡಿ.",
                    loadLoc: "ಸ್ಥಳ ಡೇಟಾವನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲವಾಗಿದೆ.",
                    password: "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಅವಶ್ಯಕತೆಗಳನ್ನು ಪೂರೈಸುವ ಮಾನ್ಯ ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ",
                    aadhaar: "ಆಧಾರ್ ನಿಖರವಾಗಿ 12 ಅಂಕೆಗಳಾಗಿರಬೇಕು",
                    mobile: "ದಯವಿಟ್ಟು ಮಾನ್ಯ 10-ಅಂಕಿಯ ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ",
                    email: "ದಯವಿಟ್ಟು ಮಾನ್ಯ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ",
                    emailDomain: "Gmail, Outlook, Yahoo ಮತ್ತು ಸರ್ಕಾರಿ ಇಮೇಲ್‌ಗಳನ್ನು ಮಾತ್ರ ಅನುಮತಿಸಲಾಗಿದೆ",
                    mobileInvalid: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ 6, 7, 8 ಅಥವಾ 9 ರಿಂದ ಪ್ರಾರಂಭವಾಗಬೇಕು",
                    name: "ಹೆಸರು ಅಗತ್ಯವಿದೆ",
                    selectLocation: "ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಸ್ಥಳ ಕ್ಷೇತ್ರಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ",
                    emailExists: "ಈ ಇಮೇಲ್ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ",
                    networkError: "ನೆಟ್‌ವರ್ಕ್ ದೋಷ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.",
                },
            },
            hi: {
                title: "ग्रामीण पंजीकरण",
                subtitle: "रजिस्टर करें और ग्राम इंचार्ज सत्यापन की प्रतीक्षा करें",
                back: "वापस",
                name: "पूरा नाम",
                email: "ईमेल",
                emailPlaceholder: "आपका.ईमेल@उदाहरण.कॉम",
                emailRestriction: "केवल Gmail, Outlook, Yahoo और सरकारी ईमेल की अनुमति है",
                password: "पासवर्ड",
                passwordPlaceholder: "मजबूत पासवर्ड दर्ज करें",
                mobile: "मोबाइल नंबर",
                mobilePlaceholder: "10-अंकीय मोबाइल नंबर दर्ज करें",
                mobileHint: "6,7,8, या 9 से शुरू होने वाला भारतीय मोबाइल नंबर",
                aadhaar: "आधार नंबर",
                aadhaarPlaceholder: "12-अंकीय आधार दर्ज करें",
                aadhaarHint: "पूर्ण 12 अंकों के रूप में संग्रहीत (केवल अंतिम 4 अधिकारियों को दिखाई देते हैं)",
                district: "जिला",
                taluk: "तालुक",
                village: "गांव",
                panchayat: "पंचायत",
                select: "चुनें",
                loading: "लोड हो रहा है...",
                register: "रजिस्टर",
                registering: "रजिस्टर हो रहा है...",
                success: "पंजीकरण सफल!",
                successDesc: "स्थिति पृष्ठ पर पुनर्निर्देशित किया जा रहा है...",
                passwordRequirements: "पासवर्ड में शामिल होना चाहिए:",
                uppercase: "कम से कम एक बड़ा अक्षर (A-Z)",
                lowercase: "कम से कम एक छोटा अक्षर (a-z)",
                number: "कम से कम एक संख्या (0-9)",
                specialChar: "कम से कम एक विशेष वर्ण (!@#$%^&*)",
                minLength: "कम से कम 8 अक्षर लंबा",
                allFieldsRequired: "* चिह्नित सभी फ़ील्ड आवश्यक हैं",
                alreadyHaveAccount: "पहले से ही खाता है?",
                login: "लॉगिन",
                errors: {
                    fill: "कृपया सभी फ़ील्ड सही से भरें।",
                    loadLoc: "स्थान डेटा लोड करने में विफल।",
                    password: "कृपया सभी आवश्यकताओं को पूरा करने वाला मान्य पासवर्ड दर्ज करें",
                    aadhaar: "आधार ठीक 12 अंकों का होना चाहिए",
                    mobile: "कृपया मान्य 10-अंकीय भारतीय मोबाइल नंबर दर्ज करें",
                    email: "कृपया मान्य ईमेल पता दर्ज करें",
                    emailDomain: "केवल Gmail, Outlook, Yahoo और सरकारी ईमेल की अनुमति है",
                    mobileInvalid: "मोबाइल नंबर 6, 7, 8 या 9 से शुरू होना चाहिए",
                    name: "नाम आवश्यक है",
                    selectLocation: "कृपया सभी स्थान फ़ील्ड चुनें",
                    emailExists: "यह ईमेल पहले से पंजीकृत है",
                    networkError: "नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।",
                },
            },
        };
        return L[locale] || L.en;
    }, [locale]);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [mobile, setMobile] = useState("");
    const [aadhaar, setAadhaar] = useState("");

    // Location state
    const [districtId, setDistrictId] = useState("");
    const [talukId, setTalukId] = useState("");
    const [villageId, setVillageId] = useState("");
    const [panchayatId, setPanchayatId] = useState("");

    // Lists
    const [districts, setDistricts] = useState<District[]>([]);
    const [taluks, setTaluks] = useState<Taluk[]>([]);
    const [villages, setVillages] = useState<Village[]>([]);
    const [panchayats, setPanchayats] = useState<Panchayat[]>([]);

    // UI state
    const [loadingLoc, setLoadingLoc] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState(false);
    const [errShake, setErrShake] = useState(false);
    const [touched, setTouched] = useState({
        name: false,
        email: false,
        password: false,
        mobile: false,
        aadhaar: false,
    });

    // Validation states
    const [emailValid, setEmailValid] = useState<boolean | null>(null);
    const [mobileValid, setMobileValid] = useState<boolean | null>(null);
    const [emailChecking, setEmailChecking] = useState(false);

    // Password strength
    const [passwordStrength, setPasswordStrength] = useState({
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinLength: false
    });

    // Allowed email domains
    const allowedDomains = [
        'gmail.com', 
        'outlook.com', 
        'hotmail.com', 
        'yahoo.com', 
        'yahoo.co.in',
        'gov.in',
        'nic.in',
        'karnataka.gov.in'
    ];

    // Validate email with domain restriction
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return false;
        
        const domain = email.split('@')[1].toLowerCase();
        return allowedDomains.some(allowed => domain === allowed || domain.endsWith('.' + allowed));
    };

    // Validate Indian mobile number
    const validateIndianMobile = (mobile: string): boolean => {
        const cleanMobile = mobile.replace(/\D/g, '');
        if (cleanMobile.length !== 10) return false;
        
        // Indian mobile numbers start with 6,7,8,9
        const firstDigit = cleanMobile.charAt(0);
        return ['6', '7', '8', '9'].includes(firstDigit);
    };

    // Check email availability
    const checkEmailAvailability = async (email: string) => {
        if (!validateEmail(email)) return;
        
        setEmailChecking(true);
        try {
            // Check if email exists in Firestore
            const usersQuery = query(
                collection(db, "users"),
                where("email", "==", email),
                limit(1)
            );
            const usersSnapshot = await getDocs(usersQuery);
            
            const villagersQuery = query(
                collection(db, "villagers"),
                where("email", "==", email),
                limit(1)
            );
            const villagersSnapshot = await getDocs(villagersQuery);
            
            const authoritiesQuery = query(
                collection(db, "authorities"),
                where("email", "==", email),
                limit(1)
            );
            const authoritiesSnapshot = await getDocs(authoritiesQuery);
            
            setEmailValid(
                usersSnapshot.empty && 
                villagersSnapshot.empty && 
                authoritiesSnapshot.empty
            );
        } catch (error) {
            console.error("Error checking email:", error);
            setEmailValid(null);
        } finally {
            setEmailChecking(false);
        }
    };

    // Debounced email check
    useEffect(() => {
        const timer = setTimeout(() => {
            if (email && touched.email) {
                checkEmailAvailability(email);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [email, touched.email]);

    // Validate password strength
    const validatePasswordStrength = (pwd: string) => {
        setPasswordStrength({
            hasUppercase: /[A-Z]/.test(pwd),
            hasLowercase: /[a-z]/.test(pwd),
            hasNumber: /\d/.test(pwd),
            hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
            hasMinLength: pwd.length >= 8
        });
    };

    // Handle password change
    const handlePasswordChange = (value: string) => {
        setPassword(value);
        validatePasswordStrength(value);
        if (touched.password) {
            setTouched(prev => ({ ...prev, password: true }));
        }
    };

    // Check if password is valid
    const isPasswordValid = () => {
        return Object.values(passwordStrength).every(Boolean);
    };

    // Validate Aadhaar
    const validateAadhaar = (aadhaar: string): boolean => {
        const cleanAadhaar = aadhaar.replace(/\D/g, '');
        return cleanAadhaar.length === 12 && /^\d+$/.test(cleanAadhaar);
    };

    // Handle Aadhaar change
    const handleAadhaarChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 12);
        setAadhaar(cleaned);
        if (touched.aadhaar) {
            setTouched(prev => ({ ...prev, aadhaar: true }));
        }
    };

    // Handle mobile change
    const handleMobileChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 10);
        setMobile(cleaned);
        setMobileValid(validateIndianMobile(cleaned));
        if (touched.mobile) {
            setTouched(prev => ({ ...prev, mobile: true }));
        }
    };

    // Load districts
    useEffect(() => {
        const loadDistricts = async () => {
            setErr("");
            setLoadingLoc(true);
            try {
                const q = query(
                    collection(db, "districts"),
                    orderBy("name", "asc")
                );
                const snap = await getDocs(q);
                const districtsData = snap.docs.map((d) => ({ 
                    id: d.id, 
                    ...(d.data() as any) 
                }));
                setDistricts(districtsData);
            } catch (e: any) {
                console.error("Error loading districts:", e);
                setErr(e?.message || t.errors.loadLoc);
                triggerErrShake();
            } finally {
                setLoadingLoc(false);
            }
        };
        loadDistricts();
    }, [t.errors.loadLoc]);

    // Load taluks when district changes
    useEffect(() => {
        const loadTaluks = async () => {
            if (!districtId) {
                setTaluks([]);
                setVillages([]);
                setPanchayats([]);
                setTalukId("");
                setVillageId("");
                setPanchayatId("");
                return;
            }

            setErr("");
            setLoadingLoc(true);
            try {
                const q = query(
                    collection(db, "taluks"),
                    where("districtId", "==", districtId),
                    orderBy("name", "asc")
                );
                const snap = await getDocs(q);
                const taluksData = snap.docs.map((d) => ({ 
                    id: d.id, 
                    ...(d.data() as any) 
                }));
                setTaluks(taluksData);

                // Reset downstream selections
                setVillages([]);
                setPanchayats([]);
                setTalukId("");
                setVillageId("");
                setPanchayatId("");
            } catch (e: any) {
                console.error("Error loading taluks:", e);
                setErr(e?.message || t.errors.loadLoc);
                triggerErrShake();
            } finally {
                setLoadingLoc(false);
            }
        };

        loadTaluks();
    }, [districtId, t.errors.loadLoc]);

    // Load villages when taluk changes
    useEffect(() => {
        const loadVillages = async () => {
            if (!districtId || !talukId) {
                setVillages([]);
                setPanchayats([]);
                setVillageId("");
                setPanchayatId("");
                return;
            }

            setErr("");
            setLoadingLoc(true);
            try {
                const q = query(
                    collection(db, "villages"),
                    where("talukId", "==", talukId),
                    where("districtId", "==", districtId),
                    orderBy("name", "asc")
                );
                const snap = await getDocs(q);
                const villagesData = snap.docs.map((d) => ({ 
                    id: d.id, 
                    ...(d.data() as any) 
                }));
                setVillages(villagesData);

                // Reset downstream selections
                setPanchayats([]);
                setVillageId("");
                setPanchayatId("");
            } catch (e: any) {
                console.error("Error loading villages:", e);
                setErr(e?.message || t.errors.loadLoc);
                triggerErrShake();
            } finally {
                setLoadingLoc(false);
            }
        };

        loadVillages();
    }, [talukId, districtId, t.errors.loadLoc]);

    // Load panchayats when village changes
    useEffect(() => {
        const loadPanchayats = async () => {
            if (!districtId || !talukId || !villageId) {
                setPanchayats([]);
                setPanchayatId("");
                return;
            }

            setErr("");
            setLoadingLoc(true);
            try {
                const q = query(
                    collection(db, "panchayats"),
                    where("talukId", "==", talukId),
                    where("districtId", "==", districtId),
                    where("villageId", "==", villageId),
                    orderBy("name", "asc")
                );
                const snap = await getDocs(q);
                const panchayatsData = snap.docs.map((d) => ({ 
                    id: d.id, 
                    ...(d.data() as any) 
                }));
                setPanchayats(panchayatsData);
                setPanchayatId("");
            } catch (e: any) {
                console.error("Error loading panchayats:", e);
                // Don't show error if no panchayats found
            } finally {
                setLoadingLoc(false);
            }
        };

        loadPanchayats();
    }, [villageId, talukId, districtId]);

    const triggerErrShake = () => {
        setErrShake(true);
        setTimeout(() => setErrShake(false), 500);
    };

    const submit = async () => {
        setErr("");

        // Validate all fields
        if (!name.trim()) {
            setErr(t.errors.name);
            setTouched(prev => ({ ...prev, name: true }));
            triggerErrShake();
            return;
        }

        if (!validateEmail(email)) {
            setErr(t.errors.emailDomain);
            setTouched(prev => ({ ...prev, email: true }));
            triggerErrShake();
            return;
        }

        if (!emailValid) {
            setErr(t.errors.emailExists);
            triggerErrShake();
            return;
        }

        if (!isPasswordValid()) {
            setErr(t.errors.password);
            setTouched(prev => ({ ...prev, password: true }));
            triggerErrShake();
            return;
        }

        if (!validateIndianMobile(mobile)) {
            setErr(t.errors.mobile);
            setTouched(prev => ({ ...prev, mobile: true }));
            triggerErrShake();
            return;
        }

        if (!validateAadhaar(aadhaar)) {
            setErr(t.errors.aadhaar);
            setTouched(prev => ({ ...prev, aadhaar: true }));
            triggerErrShake();
            return;
        }

        if (!districtId || !talukId || !villageId || !panchayatId) {
            setErr(t.errors.selectLocation);
            triggerErrShake();
            return;
        }

        try {
            setLoading(true);

            // Create auth user
            const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

            // Resolve readable names
            const districtName = districts.find((d) => d.id === districtId)?.name || "";
            const talukName = taluks.find((x) => x.id === talukId)?.name || "";
            const villageName = villages.find((v) => v.id === villageId)?.name || "";
            const panchayat = panchayats.find((p) => p.id === panchayatId);
            const panchayatName = panchayat?.name || "";
            const panchayatCode = panchayat?.code || "";

            // Create villager profile
            const villagerData = {
                uid: cred.user.uid,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                mobile: mobile,
                aadhaar: aadhaar,
                aadhaarLast4: aadhaar.slice(-4),
                districtId,
                talukId,
                villageId,
                panchayatId,
                district: districtName,
                taluk: talukName,
                village: villageName,
                panchayatName,
                panchayatCode,
                status: "pending",
                verified: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(doc(db, "villagers", cred.user.uid), villagerData);

            // Create user document
            await setDoc(doc(db, "users", cred.user.uid), {
                uid: cred.user.uid,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                role: "villager",
                panchayatId: panchayatId,
                districtId: districtId,
                talukId: talukId,
                villageId: villageId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Show success and redirect
            setSuccess(true);
            setTimeout(() => {
                router.replace(`/${locale}/villager/status`);
            }, 2000);

        } catch (e: any) {
            console.error("VILLAGER REGISTER ERROR:", e);
            
            if (e.code === "auth/email-already-in-use") {
                setErr(t.errors.emailExists);
            } else if (e.code === "auth/invalid-email") {
                setErr(t.errors.email);
            } else if (e.code === "auth/weak-password") {
                setErr(t.errors.password);
            } else if (e.code === "auth/network-request-failed") {
                setErr(t.errors.networkError);
            } else if (e.message) {
                setErr(e.message);
            } else {
                setErr(t.errors.fill);
            }
            triggerErrShake();
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{animationStyles}</style>
            <Screen padded>
                <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-4 sm:py-8">
                    <div className="max-w-2xl mx-auto px-3 sm:px-4">
                        {/* Back Button */}
                        <button
                            onClick={() => router.back()}
                            className="mb-4 flex items-center gap-2 text-green-700 hover:text-green-800 transition-all hover:-translate-x-1"
                            aria-label={t.back}
                        >
                            <FiArrowLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">{t.back}</span>
                        </button>

                        {/* Header */}
                        <div className="text-center mb-6 sm:mb-8 animate-slide-in-down">
                            <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-green-100 rounded-full mb-3 sm:mb-4 animate-float">
                                <FiShield className="w-6 h-6 sm:w-8 sm:h-8 text-green-700" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-green-900 mb-2">{t.title}</h1>
                            <p className="text-sm sm:text-base text-green-700/80">{t.subtitle}</p>
                            <p className="text-xs text-green-600/70 mt-2">{t.allFieldsRequired}</p>
                        </div>

                        {/* Success Message */}
                        {success && (
                            <div className="mb-6 p-4 sm:p-6 rounded-2xl bg-green-100 border-2 border-green-300 animate-scale-in">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500 rounded-full success-check">
                                        <FiCheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-green-800">{t.success}</h3>
                                        <p className="text-sm text-green-700">{t.successDesc}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {err && !success && (
                            <div className={`mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 animate-slide-in-up ${errShake ? 'error-shake' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                    <p className="text-sm text-red-700 font-medium">{err}</p>
                                </div>
                            </div>
                        )}

                        {/* Registration Form */}
                        {!success && (
                            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6 animate-slide-in-up">
                                {/* Name */}
                                <div className="form-field stagger-1">
                                    <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 sm:mb-2">
                                        <FiUser className="inline mr-1" /> {t.name} *
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                                        className={`w-full rounded-xl sm:rounded-2xl border-2 px-4 py-3 sm:py-3.5 text-sm sm:text-base transition-all ${
                                            touched.name && !name.trim() 
                                                ? 'border-red-300 bg-red-50' 
                                                : 'border-green-200 hover:border-green-400 focus:border-green-500'
                                        }`}
                                        placeholder={t.name}
                                        disabled={loading}
                                    />
                                    {touched.name && !name.trim() && (
                                        <p className="text-xs text-red-600 mt-1">{t.errors.name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="form-field stagger-2">
                                    <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 sm:mb-2">
                                        <FiMail className="inline mr-1" /> {t.email} *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setEmailValid(null);
                                            }}
                                            onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                                            className={`w-full rounded-xl sm:rounded-2xl border-2 px-4 py-3 sm:py-3.5 text-sm sm:text-base pr-10 transition-all ${
                                                touched.email && email && !validateEmail(email)
                                                    ? 'border-red-300 bg-red-50'
                                                    : emailValid === true
                                                    ? 'border-green-500 bg-green-50'
                                                    : emailValid === false
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-green-200 hover:border-green-400 focus:border-green-500'
                                            }`}
                                            placeholder={t.emailPlaceholder}
                                            disabled={loading}
                                        />
                                        {emailChecking && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                        {!emailChecking && emailValid === true && (
                                            <FiCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-4 h-4 animate-check-bounce" />
                                        )}
                                        {!emailChecking && emailValid === false && (
                                            <FiXCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 w-4 h-4" />
                                        )}
                                    </div>
                                    <p className="text-xs text-green-700/70 mt-1">{t.emailRestriction}</p>
                                    {touched.email && email && !validateEmail(email) && (
                                        <p className="text-xs text-red-600 mt-1">{t.errors.emailDomain}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="form-field stagger-3">
                                    <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 sm:mb-2">
                                        <FiLock className="inline mr-1" /> {t.password} *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => handlePasswordChange(e.target.value)}
                                            onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                                            className={`w-full rounded-xl sm:rounded-2xl border-2 px-4 py-3 sm:py-3.5 text-sm sm:text-base pr-12 transition-all ${
                                                touched.password && !isPasswordValid()
                                                    ? 'border-red-300 bg-red-50'
                                                    : password && isPasswordValid()
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-green-200 hover:border-green-400 focus:border-green-500'
                                            }`}
                                            placeholder={t.passwordPlaceholder}
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-green-700 hover:text-green-800 transition-all"
                                            disabled={loading}
                                        >
                                            {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {/* Password strength indicator */}
                                    {password && (
                                        <div className="mt-3 space-y-2 animate-slide-in-up">
                                            <p className="text-xs font-semibold text-green-800">{t.passwordRequirements}</p>
                                            <div className="strength-bar w-full h-1 mb-2">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-300 ${
                                                        Object.values(passwordStrength).filter(Boolean).length <= 2 ? 'weak' :
                                                        Object.values(passwordStrength).filter(Boolean).length <= 4 ? 'medium' : 'strong'
                                                    }`}
                                                    style={{ width: `${(Object.values(passwordStrength).filter(Boolean).length / 5) * 100}%` }}
                                                ></div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {[
                                                    { key: 'hasUppercase', text: t.uppercase },
                                                    { key: 'hasLowercase', text: t.lowercase },
                                                    { key: 'hasNumber', text: t.number },
                                                    { key: 'hasSpecialChar', text: t.specialChar },
                                                    { key: 'hasMinLength', text: t.minLength },
                                                ].map((item, index) => (
                                                    <div key={index} className="check-item">
                                                        {passwordStrength[item.key as keyof typeof passwordStrength] ? (
                                                            <FiCheckCircle className="text-green-500 w-3 h-3 flex-shrink-0 animate-check-bounce" />
                                                        ) : (
                                                            <FiXCircle className="text-gray-300 w-3 h-3 flex-shrink-0" />
                                                        )}
                                                        <span className={`text-xs ${passwordStrength[item.key as keyof typeof passwordStrength] ? 'text-green-700' : 'text-gray-500'}`}>
                                                            {item.text}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Mobile */}
                                <div className="form-field stagger-4">
                                    <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 sm:mb-2">
                                        <FiPhone className="inline mr-1" /> {t.mobile} *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            value={mobile}
                                            onChange={(e) => handleMobileChange(e.target.value)}
                                            onBlur={() => setTouched(prev => ({ ...prev, mobile: true }))}
                                            className={`w-full rounded-xl sm:rounded-2xl border-2 px-4 py-3 sm:py-3.5 text-sm sm:text-base pr-10 transition-all ${
                                                touched.mobile && mobile && !validateIndianMobile(mobile)
                                                    ? 'border-red-300 bg-red-50'
                                                    : mobileValid === true
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-green-200 hover:border-green-400 focus:border-green-500'
                                            }`}
                                            placeholder={t.mobilePlaceholder}
                                            maxLength={10}
                                            disabled={loading}
                                        />
                                        {mobileValid === true && (
                                            <FiCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-4 h-4 animate-check-bounce" />
                                        )}
                                    </div>
                                    <p className="text-xs text-green-700/70 mt-1">{t.mobileHint}</p>
                                    {touched.mobile && mobile && !validateIndianMobile(mobile) && (
                                        <p className="text-xs text-red-600 mt-1">{t.errors.mobileInvalid}</p>
                                    )}
                                </div>

                                {/* Aadhaar */}
                                <div className="form-field stagger-5">
                                    <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 sm:mb-2">
                                        {t.aadhaar} *
                                    </label>
                                    <input
                                        type="text"
                                        value={aadhaar}
                                        onChange={(e) => handleAadhaarChange(e.target.value)}
                                        onBlur={() => setTouched(prev => ({ ...prev, aadhaar: true }))}
                                        className={`w-full rounded-xl sm:rounded-2xl border-2 px-4 py-3 sm:py-3.5 text-sm sm:text-base transition-all ${
                                            touched.aadhaar && aadhaar && !validateAadhaar(aadhaar)
                                                ? 'border-red-300 bg-red-50'
                                                : aadhaar && validateAadhaar(aadhaar)
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-green-200 hover:border-green-400 focus:border-green-500'
                                        }`}
                                        placeholder={t.aadhaarPlaceholder}
                                        maxLength={12}
                                        disabled={loading}
                                    />
                                    <p className="text-xs text-green-700/70 mt-1">{t.aadhaarHint}</p>
                                </div>

                                {/* District */}
                                <div className="form-field stagger-6">
                                    <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 sm:mb-2">
                                        <FiMapPin className="inline mr-1" /> {t.district} *
                                    </label>
                                    <select
                                        value={districtId}
                                        onChange={(e) => setDistrictId(e.target.value)}
                                        className="w-full rounded-xl sm:rounded-2xl border-2 border-green-200 px-4 py-3 sm:py-3.5 text-sm sm:text-base bg-white hover:border-green-400 focus:border-green-500 transition-all"
                                        disabled={loadingLoc || loading}
                                    >
                                        <option value="">{loadingLoc ? t.loading : t.select}</option>
                                        {districts.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Taluk */}
                                <div className="form-field stagger-7">
                                    <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 sm:mb-2">
                                        <FiMapPin className="inline mr-1" /> {t.taluk} *
                                    </label>
                                    <select
                                        value={talukId}
                                        onChange={(e) => setTalukId(e.target.value)}
                                        className="w-full rounded-xl sm:rounded-2xl border-2 border-green-200 px-4 py-3 sm:py-3.5 text-sm sm:text-base bg-white hover:border-green-400 focus:border-green-500 transition-all disabled:opacity-60"
                                        disabled={!districtId || loadingLoc || loading}
                                    >
                                        <option value="">{loadingLoc ? t.loading : t.select}</option>
                                        {taluks.map((x) => (
                                            <option key={x.id} value={x.id}>
                                                {x.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Village */}
                                <div className="form-field stagger-8">
                                    <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 sm:mb-2">
                                        <FiHome className="inline mr-1" /> {t.village} *
                                    </label>
                                    <select
                                        value={villageId}
                                        onChange={(e) => setVillageId(e.target.value)}
                                        className="w-full rounded-xl sm:rounded-2xl border-2 border-green-200 px-4 py-3 sm:py-3.5 text-sm sm:text-base bg-white hover:border-green-400 focus:border-green-500 transition-all disabled:opacity-60"
                                        disabled={!talukId || loadingLoc || loading}
                                    >
                                        <option value="">{loadingLoc ? t.loading : t.select}</option>
                                        {villages.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Panchayat */}
                                <div className="form-field stagger-9">
                                    <label className="block text-xs sm:text-sm font-bold text-green-900 mb-1 sm:mb-2">
                                        <FiHome className="inline mr-1" /> {t.panchayat} *
                                    </label>
                                    <select
                                        value={panchayatId}
                                        onChange={(e) => setPanchayatId(e.target.value)}
                                        className="w-full rounded-xl sm:rounded-2xl border-2 border-green-200 px-4 py-3 sm:py-3.5 text-sm sm:text-base bg-white hover:border-green-400 focus:border-green-500 transition-all disabled:opacity-60"
                                        disabled={!villageId || loadingLoc || loading || panchayats.length === 0}
                                    >
                                        <option value="">{loadingLoc ? t.loading : t.select}</option>
                                        {panchayats.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} {p.code ? `(${p.code})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {panchayats.length === 0 && villageId && !loadingLoc && (
                                        <p className="text-xs text-amber-600 mt-1 animate-pulse">
                                            No panchayats found for this village. Please contact your village authority.
                                        </p>
                                    )}
                                </div>

                                {/* Register Button */}
                                <button
                                    onClick={submit}
                                    disabled={
                                        loading || 
                                        !isPasswordValid() || 
                                        !validateIndianMobile(mobile) ||
                                        !validateAadhaar(aadhaar) ||
                                        !validateEmail(email) ||
                                        !emailValid ||
                                        !districtId || 
                                        !talukId || 
                                        !villageId || 
                                        !panchayatId ||
                                        !name.trim()
                                    }
                                    className={`form-field stagger-10 w-full rounded-xl sm:rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 sm:py-5 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden ${
                                        loading ? 'loading-pulse' : ''
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            {t.registering}
                                        </span>
                                    ) : (
                                        t.register
                                    )}
                                </button>

                                {/* Login Link */}
                                <div className="text-center pt-2 border-t border-green-100">
                                    <p className="text-sm text-green-700">
                                        {t.alreadyHaveAccount}{" "}
                                        <button
                                            onClick={() => router.push(`/${locale}/villager/login`)}
                                            className="font-bold text-green-700 hover:text-green-800 underline transition-all hover:scale-105"
                                            disabled={loading}
                                        >
                                            {t.login}
                                        </button>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Screen>
        </>
    );
}
