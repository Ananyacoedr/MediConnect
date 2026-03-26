import { useNavigate } from 'react-router-dom'
import { useSymptomChecker } from '@/hooks/useSymptomChecker'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Stethoscope, AlertTriangle, Search, RotateCcw,
  Lightbulb, ShieldCheck, ChevronRight, Clock, X
} from 'lucide-react'

const confidenceConfig = {
  High:   { color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
  Medium: { color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  Low:    { color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400'   },
}

const SymptomChecker = () => {
  const navigate = useNavigate()
  const { input, setInput, result, analyze, reset, lastSearch, clearMemory } = useSymptomChecker()

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') analyze()
  }

  const handleFindDoctors = () => {
    navigate(`/find-doctors?specialty=${encodeURIComponent(result.primary)}`)
  }

  const conf = result ? confidenceConfig[result.confidence] : null

  return (
    <Card className="border-blue-100 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Stethoscope size={16} strokeWidth={2} />
            </div>
            Symptom Checker
          </CardTitle>
          {result && (
            <button onClick={reset} className="text-gray-400 hover:text-gray-600 transition-colors">
              <RotateCcw size={15} />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">Describe how you're feeling and get a doctor recommendation instantly.</p>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Last search memory */}
        {lastSearch && !result && (
          <div className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
            <span className="text-xs text-blue-600 flex items-center gap-1.5">
              <Clock size={12} /> Last searched: <span className="font-medium">{lastSearch}</span>
            </span>
            <button onClick={clearMemory} className="text-blue-400 hover:text-blue-600">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Input */}
        {!result && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. fever, headache, skin rash..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
            <Button onClick={analyze} disabled={!input.trim()} size="sm" className="px-4 shrink-0">
              Analyze
            </Button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">

            {/* Urgency Warning */}
            {result.urgent && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Urgent — Seek Immediate Attention</p>
                  <p className="text-xs mt-0.5 text-red-600">This may require immediate medical attention. Please visit an emergency room or call emergency services.</p>
                </div>
              </div>
            )}

            {/* Primary Recommendation */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Recommended Specialist</p>
                {/* Confidence Badge */}
                <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${conf.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                  {result.confidence} Confidence
                </span>
              </div>
              <p className="text-lg font-bold text-blue-700 flex items-center gap-2">
                <ShieldCheck size={18} />
                {result.primary}
              </p>
            </div>

            {/* Secondary Suggestion */}
            {result.secondary && (
              <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                <div>
                  <p className="text-xs text-gray-400">Also consider</p>
                  <p className="text-sm font-semibold text-gray-700">{result.secondary}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            )}

            {/* Health Tips */}
            {result.tips?.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-2">
                  <Lightbulb size={13} /> Quick Health Tips
                </p>
                <ul className="space-y-1">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <Button onClick={handleFindDoctors} size="sm" className="flex-1 flex items-center gap-1.5">
                <Search size={13} /> Find {result.primary}
              </Button>
              <Button onClick={reset} variant="outline" size="sm" className="flex items-center gap-1.5">
                <RotateCcw size={13} /> Check Again
              </Button>
            </div>

          </div>
        )}

      </CardContent>
    </Card>
  )
}

export default SymptomChecker
