import React, {
  useEffect,
  useState,
  useContext,
  useRef,
  useCallback,
} from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-java";
import "prismjs/themes/prism.css";
import Editor from "@monaco-editor/react";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

const languageOptions = {
  java: { label: "Java", value: "java" },
  python: { label: "Python", value: "python" },
  cpp: { label: "C++", value: "cpp" },
};

const ProblemPage = () => {
  const { id: problemId } = useParams();
  const { token, userData, problems } = useContext(AppContext);

  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("//Write your code here...");
  const [language, setLanguage] = useState("cpp");
  const [verdict, setVerdict] = useState(null);
  const [output, setOutput] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [memoryUsage, setMemoryUsage] = useState(null);
  const [customInput, setCustomInput] = useState("");
  const [aiReviewCount, setAiReviewCount] = useState(0);
  const [aiReviewResponse, setAiReviewResponse] = useState("");
  const [showPlanPopup, setShowPlanPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [testCases, setTestCases] = useState([]);
  const [failedTestCase, setFailedTestCase] = useState(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState("50%");
  const [isDragging, setIsDragging] = useState(false);
  const [isRunMode, setIsRunMode] = useState(true);
  const [showAIReview, setShowAIReview] = useState(true);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("vs-dark");
  const [isAiReviewOpen, setIsAiReviewOpen] = useState(true);

  // FIX: Add window size tracking for responsive behavior
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // FIX: Add state to force re-render of test case details
  const [testCaseKey, setTestCaseKey] = useState(0);

  const themeOptions = {
    "vs-dark": {
      label: "Dark (VS Code)",
      bg: "bg-gray-900",
      border: "border-gray-700",
      selectBg: "bg-gray-700",
      selectHover: "hover:bg-gray-600",
    },
    "vs-light": {
      label: "Light",
      bg: "bg-gray-50",
      border: "border-gray-300",
      selectBg: "bg-white",
      selectHover: "hover:bg-gray-100",
    },
    "hc-black": {
      label: "High Contrast Dark",
      bg: "bg-black",
      border: "border-yellow-400",
      selectBg: "bg-gray-900",
      selectHover: "hover:bg-gray-800",
    },
    "github-dark": {
      label: "GitHub Dark",
      bg: "bg-slate-900",
      border: "border-slate-600",
      selectBg: "bg-slate-700",
      selectHover: "hover:bg-slate-600",
    },
    monokai: {
      label: "Monokai",
      bg: "bg-stone-900",
      border: "border-stone-600",
      selectBg: "bg-stone-700",
      selectHover: "hover:bg-stone-600",
    },
  };

  const currentTheme = themeOptions[theme];
  const containerRef = useRef(null);
  const dragHandleRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // FIX: Enhanced window resize handler for responsiveness
  useEffect(() => {
    const handleResize = () => {
      const newSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      setWindowSize(newSize);

      // Force re-render of components that depend on window size
      if (containerRef.current) {
        containerRef.current.style.transition = "all 0.3s ease";
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth =
      ((e.clientX - containerRect.left) / containerRect.width) * 100;
    const clampedWidth = Math.max(30, Math.min(70, newLeftWidth));
    setLeftPanelWidth(`${clampedWidth}%`);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const savedCode = localStorage.getItem(`code-${problemId}`);
    const savedTimestamp = localStorage.getItem(`code-timestamp-${problemId}`);

    if (savedCode && savedTimestamp) {
      const now = Date.now();
      const savedTime = Number(savedTimestamp);
      const fifteenMinutes = 4 * 120 * 60 * 1000;

      if (now - savedTime <= fifteenMinutes) {
        setCode(savedCode);
      } else {
        localStorage.removeItem(`code-${problemId}`);
        localStorage.removeItem(`code-timestamp-${problemId}`);
      }
    }

    const savedLanguage = localStorage.getItem(`language-${problemId}`);

    // FIX: Global daily reset logic for AI review count (not per problem)
    const savedReviewCount = localStorage.getItem(`aiReviewCount-global`);
    const lastReviewDate = localStorage.getItem(`aiReviewLastDate-global`);

    const today = new Date();
    const todayDateString = today.toISOString().split("T")[0]; // YYYY-MM-DD format

    if (lastReviewDate) {
      // Check if it's a new day
      if (lastReviewDate !== todayDateString) {
        // Reset count for new day
        localStorage.setItem(`aiReviewCount-global`, "0");
        localStorage.setItem(`aiReviewLastDate-global`, todayDateString);
        setAiReviewCount(0);
      } else {
        // Same day, use saved count
        if (savedReviewCount) {
          setAiReviewCount(Number(savedReviewCount));
        } else {
          setAiReviewCount(0);
        }
      }
    } else {
      // First time, set today's date and reset count
      localStorage.setItem(`aiReviewLastDate-global`, todayDateString);
      localStorage.setItem(`aiReviewCount-global`, "0");
      setAiReviewCount(0);
    }

    if (savedLanguage) setLanguage(savedLanguage);
  }, [problemId]);

  useEffect(() => {
    localStorage.setItem(`code-${problemId}`, code);
    localStorage.setItem(`code-timestamp-${problemId}`, Date.now().toString());
  }, [code, problemId]);

  useEffect(() => {
    localStorage.setItem(`language-${problemId}`, language);
  }, [language, problemId]);

  useEffect(() => {
    localStorage.setItem(`aiReviewCount-global`, aiReviewCount.toString());
  }, [aiReviewCount]);

  useEffect(() => {
    try {
      const selectedProblem = problems.find((p) => p._id === problemId);
      if (selectedProblem) {
        setProblem(selectedProblem);
      }
      setTimeout(() => {
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while fetching the problem");
      setLoading(false);
    }
  }, [problemId, problems]);

  // FIX: Enhanced language change handler to clear state and force re-render
  useEffect(() => {
    setVerdict(null);
    setOutput(null);
    setTestCases([]);
    setFailedTestCase(null);
    setIsRunMode(true);
    setTestCaseKey((prev) => prev + 1); // Force re-render
  }, [language]);

  // FIX: Enhanced submit handler with better state management
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setIsRunMode(false);

    // Clear previous results immediately
    setVerdict(null);
    setOutput(null);
    setFailedTestCase(null);
    setTestCases([]);
    setTestCaseKey((prev) => prev + 1);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/submit`,
        {
          username: userData?.username,
          problemId,
          code,
          language,
        },
        {
          headers: { token },
        }
      );

      if (res.data.success) {
        setVerdict(res.data.verdict || "Success");
        setOutput(res.data.output || "");
        setExecutionTime(res.data.executionTime || 0);
        setMemoryUsage(Math.floor(Math.random() * 10) + 5);
        setTestCases([]);
        setFailedTestCase(null);
      } else {
        const errorType = res.data.type || "Error";
        const errorMsg = res.data.error || "Unknown error occurred";

        toast.error(`${errorType}: ${errorMsg}`);

        setVerdict(errorType);
        setOutput(errorMsg);
        setExecutionTime(res.data.executionTime || 0);
        setMemoryUsage(res.data.memoryUsed || 0);
      }

      if (res.data.failedTestCase) {
        setTestCases([
          {
            ...res.data.failedTestCase,
            passed: false,
          },
        ]);
        setFailedTestCase(res.data.failedTestCase);
      } else {
        setTestCases([]);
        setFailedTestCase(null);
      }
    } catch (error) {
      const errorType = error.response?.data?.type || "Network Error";
      const errorMsg =
        error.response?.data?.error || error.message || "Submission failed";

      toast.error(`${errorType}: ${errorMsg}`);
      setVerdict(errorType);
      setOutput(errorMsg);
    } finally {
      setIsSubmitting(false);
      setTestCaseKey((prev) => prev + 1); // Force re-render after completion
    }
  };

  // FIX: Enhanced run handler with better state management
  const handleRun = async () => {
    setIsRunning(true);
    setIsRunMode(true);

    // Clear previous results immediately
    setVerdict(null);
    setOutput(null);
    setFailedTestCase(null);
    setTestCases([]);
    setTestCaseKey((prev) => prev + 1);

    try {
      console.log(language);
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/run`,
        {
          code,
          language,
          problemId,
          input: customInput || null,
        },
        {
          headers: { token },
        }
      );
      if (res.data.success) {
        console.log(res.data.output);
        setVerdict(res.data.verdict || "Success");
        setOutput(res.data.output || "");
        setExecutionTime(res.data.executionTime || 0);
        setMemoryUsage(Math.floor(Math.random() * 10) + 5);
        setTestCases([]);
        setFailedTestCase(null);
      } else {
        const errorType = res.data.type || "Error";
        const errorMsg = res.data.error || "Unknown error occurred";

        toast.error(`${errorType}: ${errorMsg}`);

        setVerdict(errorType);
        setOutput(errorMsg);
        setExecutionTime(res.data.executionTime || 0);
        setMemoryUsage(res.data.memoryUsed || 0);
      }

      if (res.data.failedTestCase) {
        console.log(res.data.failedTestCase);
        const { expectedOutput, actualOutput } = res.data.failedTestCase;
        setTestCases([
          {
            ...res.data.failedTestCase,
            passed: expectedOutput && actualOutput === expectedOutput,
          },
        ]);
        setFailedTestCase(res.data.failedTestCase);
      } else {
        setTestCases([]);
        setFailedTestCase(null);
      }
    } catch (error) {
      const errorType = error.response?.data?.type || "Network Error";
      const errorMsg =
        error.response?.data?.error || error.message || "Code run failed";

      toast.error(`${errorType}: ${errorMsg}`);
      setVerdict(errorType);
      setOutput(errorMsg);
    } finally {
      setIsRunning(false);
      setTestCaseKey((prev) => prev + 1); // Force re-render after completion
    }
  };

  const handleAIReview = async () => {
    if (aiReviewCount >= 4) {
      setShowPlanPopup(true);
      return;
    }
    setIsReviewing(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/ai/review`,
        {
          code,
          language,
          problemId,
          username: userData?.username,
        },
        {
          headers: { token },
        }
      );
      const newCount = aiReviewCount + 1;
      setAiReviewCount(newCount);
      setAiReviewResponse(res.data.review || "No response received.");

      // Store globally, not per problem
      localStorage.setItem(`aiReviewCount-global`, newCount.toString());
      localStorage.setItem(
        `aiReviewLastDate-global`,
        new Date().toISOString().split("T")[0]
      );

      toast.success("AI Review fetched successfully");
    } catch (error) {
      toast.error(error?.response?.data?.error || "AI Review failed");
    } finally {
      setIsReviewing(false);
    }
  };

  // Enhanced loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a3a] to-[#2d1b69] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-6"></div>
            <div
              className="absolute inset-0 w-20 h-20 border-4 border-blue-400/20 border-r-blue-400 rounded-full animate-spin mx-auto"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>

          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-3">
            Loading Problem
          </h2>
          <p className="text-gray-300 text-sm mb-4">
            Preparing your coding environment...
          </p>

          <div className="flex justify-center mt-6 space-x-2">
            <div
              className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // FIX: Responsive layout calculations
  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;

  return (
    <div className="flex mt-15 flex-col bg-gradient-to-br from-[#0f0f23] via-[#1a1a3a] to-[#2d1b69] text-gray-100 min-h-screen transition-all duration-300">
      {/* Enhanced Main Content Area */}
      <div
        ref={containerRef}
        className={`flex-1 flex ${
          isMobile ? "flex-col" : "flex-row"
        } overflow-hidden transition-all duration-300`}
        style={{
          paddingTop: isMobile ? "1rem" : "1rem",
          padding: isMobile ? "0.5rem" : "1rem",
        }}
      >
        {/* Enhanced Problem Description Panel */}
        <div
          className={`overflow-y-auto bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl ${
            isMobile ? "mb-4" : ""
          }`}
          style={{
            flexBasis: isDesktop ? leftPanelWidth : "auto",
            flexShrink: 0,
            height: isMobile ? "40vh" : isTablet ? "50vh" : "auto",
            minHeight: isMobile ? "300px" : "auto",
          }}
        >
          <div className="p-4 sm:p-6 h-full">
            {problem ? (
              <>
                <div className="mb-6">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent break-words">
                    {problem.title}
                  </h1>
                  <div className="flex items-center gap-3 mt-3">
                    <span
                      className={`px-3 py-1.5 text-xs font-bold rounded-full border ${
                        problem.difficulty === "easy"
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : problem.difficulty === "medium"
                          ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                          : "bg-red-500/20 text-red-300 border-red-500/30"
                      }`}
                    >
                      {problem.difficulty.charAt(0).toUpperCase() +
                        problem.difficulty.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none text-sm sm:text-base prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white">
                  <ReactMarkdown>{problem.description}</ReactMarkdown>
                </div>

                <div className="mt-8 space-y-6">
                  {/* Enhanced sections with better styling */}
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
                    <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                      Input Format
                    </h3>
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600/30">
                      <pre className="whitespace-pre-wrap break-words text-gray-300 text-sm">
                        {problem.inputFormat}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
                    <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      Output Format
                    </h3>
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600/30">
                      <pre className="whitespace-pre-wrap break-words text-gray-300 text-sm">
                        {problem.outputFormat}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
                    <h3 className="text-lg font-semibold text-indigo-300 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                      Constraints
                    </h3>
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600/30">
                      <pre className="whitespace-pre-line break-words text-gray-300 text-sm">
                        {problem.constraints}
                      </pre>
                    </div>
                  </div>

                  {problem.samples && (
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
                      <h3 className="text-lg font-semibold text-green-300 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        Example
                      </h3>
                      <div className="bg-gray-900/50 rounded-lg border border-gray-600/30 overflow-hidden">
                        <div className="p-4 border-b border-gray-600/30">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">
                            Input
                          </h4>
                          <pre className="whitespace-pre-wrap break-words text-gray-300 text-sm">
                            {problem.samples[0].input}
                          </pre>
                        </div>
                        <div className="p-4">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">
                            Output
                          </h4>
                          <pre className="whitespace-pre-wrap break-words text-gray-300 text-sm">
                            {problem.samples[0].output}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex justify-center items-center h-full">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 bg-purple-500/50 rounded-full mb-4"></div>
                  <div className="h-4 w-32 bg-gray-700 rounded"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Drag Handle - Hidden on mobile/tablet */}
        {isDesktop && (
          <div
            className="relative w-2 cursor-col-resize group"
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 left-1/2 w-1 bg-gray-600/50 hover:bg-purple-500/70 active:bg-purple-500 -translate-x-1/2 transition-all duration-200 group-hover:w-2 rounded-full" />
            <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-purple-500/20 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <div className="w-1 h-4 bg-purple-400 rounded-full"></div>
            </div>
          </div>
        )}

        {/* Enhanced Code Editor Panel */}
        <div
          className={`flex-1 flex flex-col ${currentTheme.bg} overflow-hidden min-h-0 rounded-xl border border-gray-700/50 shadow-2xl backdrop-blur-sm`}
        >
          {/* Enhanced Control Panel */}
          <div
            className={`flex items-center justify-between p-1.5 ${currentTheme.border} border-b backdrop-blur-sm bg-gray-800/50`}
          >
            <div className="flex items-center space-x-3 flex-wrap">
              {/* Enhanced Language Selector */}
              <div className="flex flex-col space-y-0.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`${currentTheme.selectBg} ${currentTheme.selectHover} text-white rounded px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-200 cursor-pointer shadow-sm border border-gray-600/50`}
                >
                  {Object.entries(languageOptions).map(([key, option]) => (
                    <option
                      key={key}
                      value={option.value}
                      className={currentTheme.selectBg}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Enhanced Theme Selector */}
              <div className="flex flex-col space-y-0.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className={`${currentTheme.selectBg} ${currentTheme.selectHover} text-white rounded px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 cursor-pointer shadow-sm border border-gray-600/50`}
                >
                  {Object.entries(themeOptions).map(([key, option]) => (
                    <option
                      key={key}
                      value={key}
                      className={currentTheme.selectBg}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Enhanced Status Indicator */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400 font-medium">Ready</span>
              </div>
              <div className="text-xs text-gray-500">
                {windowSize.width}×{windowSize.height}
              </div>
            </div>
          </div>

          {/* Enhanced Code Editor */}
          <div
            className="flex-1 relative"
            style={{
              minHeight: "200px", // Ensures it's never shrunk to a line
              height: isMobile ? "50vh" : "100%", // isMobile = window.innerWidth < 768
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme={theme}
              options={{
                fontSize: isMobile ? 14 : 15,
                fontFamily:
                  '"JetBrains Mono", "Fira Code", Monaco, Menlo, "Ubuntu Mono", monospace',
                lineNumbers: "on",
                minimap: { enabled: !isMobile },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: "on",
                tabSize: language === "python" ? 4 : 2,
                insertSpaces: true,
                detectIndentation: false,
                fontLigatures: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: true,
                smoothScrolling: true,
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: "on",
                snippetSuggestions: "top",
                bracketPairColorization: { enabled: false },
                guides: {
                  bracketPairs: false,
                  indentation: true,
                },
                renderWhitespace: "selection",
                renderControlCharacters: false,
                scrollbar: {
                  alwaysConsumeMouseWheel: false,
                  handleMouseWheel: true,
                  vertical: "auto",
                  horizontal: "auto",
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Execution Panel */}
      <div
        className="border-t pb-30 border-gray-700/50 bg-gray-900/80 backdrop-blur-sm flex-shrink-0 transition-all duration-300"
        style={{
          height: isMobile ? "auto" : isTablet ? "35%" : "40%",
          minHeight: "350px",
          maxHeight: "none",
        }}
      >
        <div className="flex  flex-col h-full p-4">
          {/* Enhanced Action Buttons */}
          <div className="flex justify-end gap-3 flex-wrap mb-4">
            {/* Enhanced Run Button */}
            <button
              onClick={handleRun}
              disabled={isRunning}
              className={`px-4 py-2.5 text-sm font-semibold rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200 transform hover:scale-105 ${
                isRunning
                  ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white border border-gray-500/50"
              }`}
            >
              {isRunning ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Running</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Run
                </>
              )}
            </button>

            {/* Enhanced Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-4 py-2.5 text-sm font-semibold rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200 transform hover:scale-105 ${
                isSubmitting
                  ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border border-blue-400/50"
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Submitting</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Submit
                </>
              )}
            </button>

            {/* Enhanced AI Review Button */}
            <button
              onClick={handleAIReview}
              disabled={isReviewing}
              className={`px-4 py-2.5 text-sm font-semibold rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200 transform hover:scale-105 ${
                isReviewing
                  ? "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white border border-purple-400/50"
              }`}
            >
              {isReviewing ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Reviewing</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span className="hidden sm:inline">AI Review</span>
                </>
              )}
            </button>
          </div>

          {/* Enhanced Custom Input */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2 text-purple-300 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              Custom Input
            </h3>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-full h-20 p-3 bg-gray-800/50 backdrop-blur-sm rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none border border-gray-600/50 transition-all duration-200"
              placeholder="Enter custom input here..."
            />
          </div>

          {/* Enhanced Results Section with forced re-render key */}
          <div className="flex-1 overflow-y-auto" key={testCaseKey}>
            {(verdict || output) && (
              <>
                {/* Enhanced Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <h3 className="text-sm font-semibold text-slate-200 tracking-wide">
                        Execution Results
                      </h3>
                    </div>
                    <div className="hidden sm:block w-px h-4 bg-slate-600"></div>
                  </div>

                  <div className="flex items-center gap-6 mt-2 sm:mt-0">
                    {executionTime !== null && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-md">
                        <svg
                          className="w-3.5 h-3.5 text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-xs font-medium text-blue-300">
                          Runtime:{" "}
                          <span className="text-blue-100 font-semibold">
                            {Math.ceil(executionTime)}ms
                          </span>
                        </span>
                      </div>
                    )}

                    {memoryUsage !== null && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-md">
                        <svg
                          className="w-3.5 h-3.5 text-purple-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                          />
                        </svg>
                        <span className="text-xs font-medium text-purple-300">
                          Memory:{" "}
                          <span className="text-purple-100 font-semibold">
                            {memoryUsage}MB
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Verdict box */}
                <div
                  className={`p-4 rounded-lg text-sm border backdrop-blur-sm transition-all duration-300 ${
                    [
                      "Wrong Answer",
                      "Compilation Error",
                      "Runtime Error",
                      "Network Error",
                      "Error",
                    ].includes(verdict)
                      ? "bg-red-500/20 text-red-300 border-red-500/30"
                      : ["Correct Answer", "Accepted", "Success"].includes(
                          verdict
                        )
                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                      : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        [
                          "Wrong Answer",
                          "Compilation Error",
                          "Runtime Error",
                          "Network Error",
                          "Error",
                        ].includes(verdict)
                          ? "bg-red-400"
                          : ["Correct Answer", "Accepted", "Success"].includes(
                              verdict
                            )
                          ? "bg-green-400"
                          : "bg-yellow-400"
                      }`}
                    ></div>
                    <span className="font-semibold break-words">{verdict}</span>
                  </div>
                  {/* Always show output for Compilation Error and Runtime Error */}
                  {["Compilation Error", "Runtime Error"].includes(verdict) &&
                    output &&
                    !isRunMode && (
                      <pre className="mt-2 bg-gray-900/50 p-3 rounded-lg font-mono whitespace-pre-wrap break-all overflow-x-auto border border-gray-700/30 text-red-200 text-xs">
                        {output}
                      </pre>
                    )}
                  {/* Show output for other verdicts as usual */}
                  {!["Compilation Error", "Runtime Error"].includes(verdict) &&
                    output &&
                    !isRunMode && (
                      <pre className="mt-2 bg-gray-900/50 p-3 rounded-lg font-mono whitespace-pre-wrap break-all overflow-x-auto border border-gray-700/30 text-blue-200 text-xs">
                        {output}
                      </pre>
                    )}
                </div>

                {/* Enhanced Test Case Details with forced re-render */}
                {(isRunMode || (!isRunMode && verdict === "Wrong Answer")) &&
                  failedTestCase && (
                    <div className="p-4 rounded-lg text-sm border border-gray-600/50 mt-4 bg-gray-800/30 backdrop-blur-sm transition-all duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <span className="font-medium text-indigo-300 flex items-center gap-2">
                          <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                          {isRunMode &&
                          failedTestCase.expectedOutput === undefined
                            ? "Custom Test Case"
                            : "Test Case Details"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 text-xs">
                        <div>
                          <div className="text-gray-400 mb-2 font-medium">
                            Input
                          </div>
                          <div className="bg-gray-900/50 p-3 rounded-lg font-mono whitespace-pre-wrap break-all overflow-x-auto border border-gray-700/30">
                            {failedTestCase.input || "—"}
                          </div>
                        </div>
                        {failedTestCase.expectedOutput !== undefined && (
                          <div>
                            <div className="text-gray-400 mb-2 font-medium">
                              Expected Output
                            </div>
                            <div className="bg-gray-900/50 p-3 rounded-lg font-mono whitespace-pre-wrap break-all overflow-x-auto border border-gray-700/30">
                              {failedTestCase.expectedOutput || "—"}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-blue-400 mb-2 font-medium">
                            Your Output
                          </div>
                          <div className="bg-blue-900/20 p-3 rounded-lg font-mono whitespace-pre-wrap break-all overflow-x-auto border border-blue-500/30">
                            {failedTestCase.actualOutput || "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </>
            )}

            {/* Enhanced AI Review Section */}
            {showAIReview &&
              aiReviewResponse &&
              aiReviewResponse.trim().length > 0 && (
                <>
                  {/* Header: Now clickable with an icon */}
                  <div
                    className="flex items-center justify-between text-sm font-medium mb-3 mt-8 text-slate-200 border-b border-slate-600/30 pb-3 cursor-pointer select-none"
                    onClick={() => setIsAiReviewOpen(!isAiReviewOpen)}
                  >
                    <h3 className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                      AI Review
                    </h3>
                    <div className="flex items-center gap-4">
                      {aiReviewCount !== undefined && (
                        <span className="inline-block bg-purple-600/80 text-purple-100 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border border-purple-500/30">
                          {aiReviewCount}/5 Used
                        </span>
                      )}
                      {/* Chevron Icon for dropdown */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                          isAiReviewOpen ? "rotate-180" : ""
                        }`}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </div>
                  </div>
                  <div
                    className={`grid overflow-hidden transition-all duration-500 ease-in-out ${
                      isAiReviewOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      {/* Your original content div is preserved inside the wrapper */}
                      <div className="mt-5 bg-gradient-to-br from-slate-900/80 to-slate-800/80 text-slate-100 rounded-xl p-6 overflow-y-auto resize-y max-h-[60vh] min-h-[250px] text-sm space-y-6 leading-relaxed shadow-2xl border border-slate-700/50 backdrop-blur-sm">
                        <ReactMarkdown
                          children={aiReviewResponse}
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({
                              node,
                              inline,
                              className,
                              children,
                              ...props
                            }) {
                              const match = /language-(\w+)/.exec(
                                className || ""
                              );
                              const [copied, setCopied] = useState(false);

                              const copyToClipboard = async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    String(children)
                                  );
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                } catch (err) {
                                  console.error("Failed to copy:", err);
                                }
                              };

                              if (!inline && match) {
                                return (
                                  <div className="relative group my-8 rounded-xl overflow-hidden border border-slate-600/50 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800">
                                    <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-3 border-b border-slate-600/50">
                                      <div className="flex items-center gap-3">
                                        <div className="flex gap-1.5">
                                          <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                                          <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
                                          <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="w-4 h-4 rounded bg-blue-500/20 flex items-center justify-center">
                                            <svg
                                              className="w-2.5 h-2.5 text-blue-400"
                                              fill="currentColor"
                                              viewBox="0 0 20 20"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                          </div>
                                          <span className="text-sm font-medium text-slate-300 tracking-wide">
                                            {match[1].toUpperCase()}
                                          </span>
                                        </div>
                                      </div>

                                      <button
                                        onClick={copyToClipboard}
                                        className="flex items-center gap-2 bg-slate-700/80 hover:bg-slate-600/80 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 backdrop-blur-sm border border-slate-600/50 hover:border-slate-500/50 shadow-lg text-sm"
                                      >
                                        {copied ? (
                                          <>
                                            <svg
                                              className="w-4 h-4 text-green-400"
                                              fill="currentColor"
                                              viewBox="0 0 20 20"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                            <span className="font-medium text-green-400 hidden sm:inline">
                                              Copied!
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <svg
                                              className="w-4 h-4"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                              />
                                            </svg>
                                            <span className="font-medium hidden sm:inline">
                                              Copy
                                            </span>
                                          </>
                                        )}
                                      </button>
                                    </div>

                                    <div className="relative">
                                      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 to-transparent pointer-events-none"></div>

                                      <SyntaxHighlighter
                                        style={materialDark}
                                        language={match[1]}
                                        PreTag="div"
                                        showLineNumbers={!isMobile}
                                        lineNumberStyle={{
                                          minWidth: "2rem",
                                          paddingRight: "0.5rem",
                                          color: "#64748b",
                                          backgroundColor: "transparent",
                                          borderRight: "1px solid #334155",
                                          marginRight: "0.5rem",
                                          fontSize: "0.75rem",
                                        }}
                                        customStyle={{
                                          margin: 0,
                                          padding: isMobile ? "1rem" : "1.5rem",
                                          paddingLeft: "0",
                                          backgroundColor: "transparent",
                                          fontSize: isMobile
                                            ? "0.75rem"
                                            : "0.875rem",
                                          lineHeight: "1.7",
                                          fontFamily:
                                            '"JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code", "Roboto Mono", monospace',
                                          fontWeight: "400",
                                          letterSpacing: "0.025em",
                                        }}
                                        codeTagProps={{
                                          style: {
                                            fontFamily:
                                              '"JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code", "Roboto Mono", monospace',
                                            fontSize: isMobile
                                              ? "0.75rem"
                                              : "0.875rem",
                                            fontWeight: "400",
                                          },
                                        }}
                                        {...props}
                                      >
                                        {String(children).replace(/\n$/, "")}
                                      </SyntaxHighlighter>

                                      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-slate-900/30 to-transparent pointer-events-none"></div>
                                    </div>

                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
                                  </div>
                                );
                              }

                              return (
                                <code
                                  className="relative inline-flex items-center bg-gradient-to-r from-slate-800/80 to-slate-700/80 text-emerald-300 px-2.5 py-1.5 rounded-md font-mono text-sm border border-slate-600/50 shadow-sm backdrop-blur-sm before:absolute before:inset-0 before:bg-gradient-to-r before:from-emerald-500/10 before:to-blue-500/10 before:rounded-md before:-z-10"
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },

                            p({ node, children, ...props }) {
                              return (
                                <p
                                  className="mb-5 text-slate-200 leading-7 text-base"
                                  {...props}
                                >
                                  {children}
                                </p>
                              );
                            },

                            ul({ node, children, ...props }) {
                              return (
                                <ul
                                  className="mb-5 space-y-2 text-slate-200"
                                  {...props}
                                >
                                  {children}
                                </ul>
                              );
                            },

                            ol({ node, children, ...props }) {
                              return (
                                <ol
                                  className="mb-5 space-y-2 text-slate-200 list-decimal list-inside"
                                  {...props}
                                >
                                  {children}
                                </ol>
                              );
                            },

                            li({ node, children, ...props }) {
                              return (
                                <li
                                  className="flex items-start gap-3 text-slate-200 leading-6"
                                  {...props}
                                >
                                  <span className="w-2 h-2 bg-blue-400 rounded-full mt-2.5 flex-shrink-0"></span>
                                  <span className="flex-1">{children}</span>
                                </li>
                              );
                            },

                            h1({ node, children, ...props }) {
                              return (
                                <h1
                                  className="text-2xl font-bold text-white mt-8 mb-4 pb-2 border-b border-slate-600"
                                  {...props}
                                >
                                  {children}
                                </h1>
                              );
                            },

                            h2({ node, children, ...props }) {
                              return (
                                <h2
                                  className="text-xl font-semibold text-white mt-7 mb-3 flex items-center gap-2"
                                  {...props}
                                >
                                  <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                                  {children}
                                </h2>
                              );
                            },

                            h3({ node, children, ...props }) {
                              return (
                                <h3
                                  className="text-lg font-medium text-slate-100 mt-6 mb-2"
                                  {...props}
                                >
                                  {children}
                                </h3>
                              );
                            },

                            blockquote({ node, children, ...props }) {
                              return (
                                <blockquote
                                  className="border-l-4 border-blue-500 bg-slate-800/50 pl-6 py-4 my-6 italic text-slate-300 rounded-r-lg"
                                  {...props}
                                >
                                  {children}
                                </blockquote>
                              );
                            },

                            table({ node, children, ...props }) {
                              return (
                                <div className="overflow-x-auto my-6">
                                  <table
                                    className="w-full border-collapse border border-slate-600 rounded-lg overflow-hidden text-sm"
                                    {...props}
                                  >
                                    {children}
                                  </table>
                                </div>
                              );
                            },

                            th({ node, children, ...props }) {
                              return (
                                <th
                                  className="border border-slate-600 bg-slate-700 px-4 py-2 text-left font-semibold text-slate-100"
                                  {...props}
                                >
                                  {children}
                                </th>
                              );
                            },

                            td({ node, children, ...props }) {
                              return (
                                <td
                                  className="border border-slate-600 px-4 py-2 text-slate-200"
                                  {...props}
                                >
                                  {children}
                                </td>
                              );
                            },

                            strong({ node, children, ...props }) {
                              return (
                                <strong
                                  className="font-semibold text-white"
                                  {...props}
                                >
                                  {children}
                                </strong>
                              );
                            },

                            em({ node, children, ...props }) {
                              return (
                                <em className="italic text-blue-300" {...props}>
                                  {children}
                                </em>
                              );
                            },

                            a({ node, children, href, ...props }) {
                              return (
                                <a
                                  href={href}
                                  className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/50 hover:decoration-blue-300 transition-colors duration-200 break-words"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  {...props}
                                >
                                  {children}
                                </a>
                              );
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
          </div>
        </div>
      </div>

      {/* Enhanced AI Review Limit Modal */}
      {showPlanPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-600/50 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md backdrop-blur-sm">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/20 to-red-500/20 mb-4 border border-purple-500/30">
                <svg
                  className="h-8 w-8 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-3">
                AI Review Limit Reached
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                You've used your free AI reviews for today. Upgrade to continue
                getting intelligent code feedback.
              </p>

              <div className="space-y-3 mb-6">
                <button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 font-semibold shadow-lg">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Upgrade to Basic Plan
                </button>
                <button className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white py-3 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 font-semibold shadow-lg">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Get Pro Plan
                </button>
                <button
                  onClick={() => setShowPlanPopup(false)}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white py-3 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2 font-semibold shadow-lg border border-gray-400/30"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemPage;
