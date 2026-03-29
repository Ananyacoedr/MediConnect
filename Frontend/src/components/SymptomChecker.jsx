import { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2, Stethoscope, ChevronRight, Check } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function SymptomChecker({ setDashboardFilter }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null); // { diagnosis, precautions, specialist }
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [error, setError] = useState(null);
  
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const handleSubmit = async (userText) => {
    if (!userText.trim()) return;
    
    setLoading(true);
    setError(null);

    const newHistory = [...history, { role: 'user', text: userText }];
    setHistory(newHistory);
    
    try {
      const data = await apiFetch('/ai/symptom-check', null, {
        method: 'POST',
        body: JSON.stringify({
          history: history,
          message: userText
        })
      });


      // Add AI's response to history
      const nextHistory = [...newHistory, { role: 'model', text: JSON.stringify(data) }];
      setHistory(nextHistory);

      if (data.specialist && data.precautions) {
        // We reached a conclusion
        setResult(data);
        setCurrentQuestion(null);
      } else if (data.clarifyingQuestion) {
        // Needs more info
        setCurrentQuestion(data.clarifyingQuestion);
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (!isOpen) { setIsOpen(true); return; }
    handleSubmit(input);
  };

  const handleAnswer = (ans) => {
    handleSubmit(ans);
  };

  const reset = () => {
    setIsOpen(false);
    setInput('');
    setHistory([]);
    setResult(null);
    setCurrentQuestion(null);
    setError(null);
  };

  return (
    <div className={`transition-all duration-300 relative ${isOpen ? 'bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-blue-200 dark:border-blue-900/50 p-6 z-20' : ''}`}>
      {!isOpen ? (
        <form onSubmit={handleStart} className="relative group cursor-text transform transition-all hover:scale-[1.01]">
          {/* Animated gradient border effect behind */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full blur/20 opacity-30 group-hover:opacity-70 group-hover:blur-md transition-all duration-500 animate-pulse"></div>
          
          <div className="relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full flex items-center p-2 shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100/50 dark:focus-within:ring-blue-900/50 transition-all">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center shrink-0 ml-1">
               <Sparkles className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <input
              type="text"
              placeholder="Symptom Checker: 'I have a bad headache since morning...'"
              className="flex-1 bg-transparent border-none outline-none px-5 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 text-lg sm:text-base font-medium"
              onClick={() => setIsOpen(true)}
              readOnly
            />
            <button type="button" onClick={() => setIsOpen(true)} className="px-6 py-3 ml-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold flex items-center gap-2 rounded-full shadow-md transition-transform hover:-translate-y-0.5 active:translate-y-0">
              Check Symptoms <ArrowRight size={18} />
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 rounded-xl shadow-inner">
                 <Sparkles className="text-white" size={22} />
              </div>
              <div>
                 <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-xl tracking-tight">AI Symptom Checker</h3>
                 {history.length === 0 ? (
                   <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Describe your symptoms to begin.</p>
                 ) : (
                   <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">I will ask a few questions to find the right doctor for you.</p>
                 )}
              </div>
            </div>
            <button onClick={reset} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors">Close</button>
          </div>

          {/* Initial Input */}
          {history.length === 0 && (
             <form onSubmit={(e) => { e.preventDefault(); handleSubmit(input); }} className="space-y-4">
               <div>
                 <textarea
                   ref={inputRef}
                   value={input}
                   onChange={e => setInput(e.target.value)}
                   onKeyDown={e => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       if (input.trim() && !loading) handleSubmit(input);
                     }
                   }}
                   placeholder="e.g. 'I've had a sharp pain in my lower back for 3 days and I feel slightly nauseous...'"
                   className="w-full min-h-[140px] p-5 text-lg border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner"
                 />
               </div>
               <div className="flex justify-end pt-2">
                 <button disabled={!input.trim() || loading} type="submit" className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
                   {loading ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : 'Analyze Symptoms'}
                 </button>
               </div>
             </form>
          )}

          {/* Chat Flow */}
          {history.length > 0 && !result && currentQuestion && (
            <div className="space-y-6 pt-2">
               <div className="flex gap-4 items-start">
                 <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 flex flex-shrink-0 items-center justify-center shadow-sm">
                    <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                 </div>
                 <div className="bg-white dark:bg-gray-800 shadow-md p-5 rounded-3xl rounded-tl-sm border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-base leading-relaxed">
                   {currentQuestion}
                 </div>
               </div>
               
               {loading ? (
                  <div className="flex items-center justify-center py-6 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                       <Loader2 size={28} className="animate-spin text-blue-500" />
                       <span className="text-sm font-medium">Thinking...</span>
                    </div>
                  </div>
               ) : (
                  <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={() => handleAnswer("No")} className="px-8 py-2.5 border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-xl transition-colors focus:ring-4 focus:ring-red-100">No</button>
                    <button onClick={() => handleAnswer("I'm not sure")} className="px-8 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">Not Sure</button>
                    <button onClick={() => handleAnswer("Yes")} className="px-8 py-2.5 bg-green-600 hover:bg-green-700 shadow-md shadow-green-500/20 text-white font-bold rounded-xl transition-colors focus:ring-4 focus:ring-green-100">Yes</button>
                  </div>
               )}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6 pt-2">
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800/50 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><Stethoscope size={100} /></div>
                 
                 <h4 className="flex items-center gap-2 font-extrabold text-green-800 dark:text-green-400 mb-4 text-lg">
                   <Stethoscope size={22} className="text-green-600 dark:text-green-500" /> Recommended Action
                 </h4>
                 
                 <p className="text-base text-green-950 dark:text-green-100 leading-relaxed font-medium">
                    Based on your symptoms, we strongly recommend you consult a <strong className="text-xl bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100 px-3 py-1 rounded-lg mx-1 inline-block shadow-sm">{result.specialist}</strong>.
                 </p>
                 
                 {result.diagnosis && (
                   <p className="mt-4 text-sm text-green-800 dark:text-green-300 bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-green-200/50 dark:border-green-700/50 italic">
                      💡 Possible insight: {result.diagnosis} <br/><span className="text-xs opacity-70 mt-1 block">(Disclaimer: This is not a medical diagnosis. Please consult a doctor immediately.)</span>
                   </p>
                 )}
                 
                 <div className="mt-6">
                    <button 
                       onClick={() => {
                          if (setDashboardFilter) setDashboardFilter(result.specialist);
                          reset();
                       }} 
                       className="px-6 py-3 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/30 text-white rounded-xl font-bold flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                       Find {result.specialist}s Near Me <ChevronRight size={18} />
                    </button>
                 </div>
              </div>

              {result.precautions && result.precautions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                   <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-4 text-base flex items-center gap-2">
                     <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg"><Check size={16} className="text-blue-600 dark:text-blue-400" /></div> 
                     General Precautions to take right now:
                   </h4>
                   <ul className="space-y-3">
                     {result.precautions.map((p, i) => (
                       <li key={i} className="flex items-center gap-3 bg-gray-50/80 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                          <span className="flex-shrink-0 w-7 h-7 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-bold shadow-inner">{i+1}</span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{p}</span>
                       </li>
                     ))}
                   </ul>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-sm font-medium flex items-start gap-3">
               <span className="text-xl">⚠️</span> {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
