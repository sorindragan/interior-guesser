"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { QUIZ_QUESTIONS, Question } from '@/lib/quizConfig'
import {
  DEMOGRAPHIC_AGE_RANGES,
  DEMOGRAPHIC_INDUSTRIES,
  DEMOGRAPHIC_COUNTRIES_COUNT
} from '@/lib/demographicsConfig'

type GameStep = 'WELCOME' | 'QUIZ' | 'DEMOGRAPHICS' | 'RESULTS'

interface Answer {
  questionId: number
  imageUrl: string
  guess: string
  correct: boolean
}

interface Demographics {
  ageRange: string
  industry: string
  currentCity: string
  countriesLivedIn: string
}

export default function Home() {
  // Game states
  const [step, setStep] = useState<GameStep>('WELCOME')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [score, setScore] = useState(0)

  // Demographics form states
  const [demographics, setDemographics] = useState<Demographics>({
    ageRange: '',
    industry: '',
    currentCity: '',
    countriesLivedIn: '',
  })

  // Results / stats states
  const [percentile, setPercentile] = useState<number | null>(null)
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false)

  // Start the game: Create session in database
  const handleStartGame = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to create session')

      const data = await response.json()
      setSessionId(data.sessionId)

      // Reset game states
      setCurrentQuestionIndex(0)
      setAnswers([])
      setScore(0)
      setStep('QUIZ')
    } catch (err) {
      console.error(err)
      // Fallback: start game even if database fails, using a mock session ID
      setSessionId('offline-' + Math.random().toString(36).substr(2, 9))
      setStep('QUIZ')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle choice selection during quiz
  const handleAnswerSelect = async (selectedCity: string) => {
    const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex]
    const isCorrect = selectedCity === currentQuestion.correctCity

    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      imageUrl: currentQuestion.imageUrl,
      guess: selectedCity,
      correct: isCorrect,
    }

    const updatedAnswers = [...answers, newAnswer]
    const newScore = isCorrect ? score + 1 : score

    setAnswers(updatedAnswers)
    setScore(newScore)

    // Save progress to database in the background
    if (sessionId) {
      fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answers: updatedAnswers,
          score: newScore,
        }),
      }).catch(err => console.error('Error saving progress:', err))
    }

    // Move to next step or next question
    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setStep('DEMOGRAPHICS')
    }
  }

  // Handle demographics form submission
  const handleDemographicsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Clean inputs (fill empty text with 'I prefer not to say')
    const finalDemographics = {
      ageRange: demographics.ageRange || 'I prefer not to say',
      industry: demographics.industry || 'I prefer not to say',
      currentCity: demographics.currentCity.trim() || 'I prefer not to say',
      countriesLivedIn: demographics.countriesLivedIn || 'I prefer not to say',
    }

    try {
      // Save demographics to database
      if (sessionId) {
        await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            demographics: finalDemographics,
          }),
        })
      }

      // Fetch global leaderboard percentile stats
      const statsRes = await fetch(`/api/submit?score=${score}`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setPercentile(statsData.percentile)
        setTotalPlayers(statsData.totalPlayers)
      }
    } catch (err) {
      console.error('Error submitting demographics:', err)
    } finally {
      setIsLoading(false)
      setStep('RESULTS')
    }
  }

  // Get current active question
  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-[#130f17] text-[#e3def0] font-sans flex flex-col items-center justify-center p-4 sm:p-8 selection:bg-purple-900 selection:text-purple-100">
      <div className="w-full max-w-2xl bg-[#1d1622] rounded-3xl border border-[#2e2335]/50 shadow-2xl p-6 sm:p-12 transition-all duration-500 overflow-hidden relative">
        {/* Subtle background glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-fuchsia-900/10 rounded-full blur-3xl pointer-events-none" />

        {/* ================= STEP 1: WELCOME SCREEN ================= */}
        {step === 'WELCOME' && (
          <div className="flex flex-col items-center text-center py-6 relative z-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#d8b4fe] mb-4">
              Interior Location Guesser
            </span>
            <h1 className="text-4xl sm:text-5xl font-serif text-white mb-6 leading-tight max-w-lg">
              Can you guess the city from the interior?
            </h1>
            <p className="text-[#a69bb0] text-base sm:text-lg mb-8 leading-relaxed max-w-md">
              You will be shown 4 café interiors. For each photo, choose which city you think it's located in from 5 multiple-choice options.
            </p>
            <button
              onClick={handleStartGame}
              disabled={isLoading}
              className="px-8 py-4 bg-white hover:bg-[#f3edff] text-[#130f17] text-base font-semibold rounded-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer shadow-lg shadow-purple-950/20 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Start Guessing'}
            </button>
          </div>
        )}

        {/* ================= STEP 2: QUIZ SCREEN ================= */}
        {step === 'QUIZ' && currentQuestion && (
          <div className="flex flex-col relative z-10">
            {/* Header / Progress */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#d8b4fe]">
                Round {currentQuestionIndex + 1} of {QUIZ_QUESTIONS.length}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-[#2c2235] rounded-full mb-8 overflow-hidden">
              <div
                className="h-full bg-[#d8b4fe] transition-all duration-500 ease-out"
                style={{ width: `${((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              />
            </div>

            {/* Image Container */}
            <div className="w-full aspect-[4/3] relative rounded-2xl overflow-hidden mb-8 shadow-lg border border-[#2e2335]">
              <Image
                src={currentQuestion.imageUrl}
                alt={`Café interior round ${currentQuestion.id}`}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                priority
                className="object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>

            {/* Instruction */}
            <h2 className="text-xl sm:text-2xl font-serif text-white mb-6 text-center">
              Where was this photo taken?
            </h2>

            {/* 5 City Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(option)}
                  className="w-full py-4 px-6 text-left rounded-xl bg-[#2a2231] hover:bg-[#392e42] border border-[#483a54]/60 text-[#e3def0] font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer hover:border-[#d8b4fe]/50"
                >
                  <span className="inline-block w-6 text-[#d8b4fe]/60 text-xs font-mono">{idx + 1}.</span>
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= STEP 3: DEMOGRAPHICS FORM ================= */}
        {step === 'DEMOGRAPHICS' && (
          <div className="flex flex-col relative z-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#d8b4fe] mb-2 text-center">
              Almost Done
            </span>
            <h2 className="text-3xl font-serif text-white mb-6 text-center">
              Help us with some quick stats
            </h2>
            <p className="text-[#a69bb0] text-sm text-center mb-8 max-w-md mx-auto">
              Your answers will be stored anonymously to help us analyze geographical guess distributions and interior aesthetics trends.
            </p>

            <form onSubmit={handleDemographicsSubmit} className="space-y-5">
              {/* Age Range */}
              <div className="flex flex-col">
                <label className="text-xs uppercase tracking-wider text-[#a69bb0] mb-2 font-semibold">
                  Age Range
                </label>
                <select
                  value={demographics.ageRange}
                  onChange={(e) => setDemographics(prev => ({ ...prev, ageRange: e.target.value }))}
                  className="w-full py-3 px-4 rounded-xl bg-[#2a2231] border border-[#483a54]/60 text-[#e3def0] focus:border-[#d8b4fe] focus:outline-none cursor-pointer"
                >
                  <option value="">Select Age Range</option>
                  {DEMOGRAPHIC_AGE_RANGES.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  <option value="I prefer not to say">I prefer not to say</option>
                </select>
              </div>

              {/* Industry */}
              <div className="flex flex-col">
                <label className="text-xs uppercase tracking-wider text-[#a69bb0] mb-2 font-semibold">
                  What industry do you work in?
                </label>
                <select
                  value={demographics.industry}
                  onChange={(e) => setDemographics(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full py-3 px-4 rounded-xl bg-[#2a2231] border border-[#483a54]/60 text-[#e3def0] focus:border-[#d8b4fe] focus:outline-none cursor-pointer"
                >
                  <option value="">Select Industry</option>
                  {DEMOGRAPHIC_INDUSTRIES.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  <option value="I prefer not to say">I prefer not to say</option>
                </select>
              </div>

              {/* Current City */}
              <div className="flex flex-col">
                <label className="text-xs uppercase tracking-wider text-[#a69bb0] mb-2 font-semibold font-sans">
                  What city do you currently live in?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amsterdam (or leave blank to skip)"
                  value={demographics.currentCity}
                  onChange={(e) => setDemographics(prev => ({ ...prev, currentCity: e.target.value }))}
                  className="w-full py-3 px-4 rounded-xl bg-[#2a2231] border border-[#483a54]/60 text-[#e3def0] placeholder-[#a69bb0]/50 focus:border-[#d8b4fe] focus:outline-none font-sans"
                />
              </div>

              {/* Countries Lived In */}
              <div className="flex flex-col">
                <label className="text-xs uppercase tracking-wider text-[#a69bb0] mb-2 font-semibold">
                  How many countries have you lived in?
                </label>
                <select
                  value={demographics.countriesLivedIn}
                  onChange={(e) => setDemographics(prev => ({ ...prev, countriesLivedIn: e.target.value }))}
                  className="w-full py-3 px-4 rounded-xl bg-[#2a2231] border border-[#483a54]/60 text-[#e3def0] focus:border-[#d8b4fe] focus:outline-none cursor-pointer"
                >
                  <option value="">Select Number of Countries</option>
                  {DEMOGRAPHIC_COUNTRIES_COUNT.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  <option value="I prefer not to say">I prefer not to say</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-white hover:bg-[#f3edff] text-[#130f17] text-base font-semibold rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-lg shadow-purple-950/20 disabled:opacity-50 mt-6"
              >
                {isLoading ? 'Submitting...' : 'View Results'}
              </button>
            </form>
          </div>
        )}

        {/* ================= STEP 4: RESULTS SCREEN ================= */}
        {step === 'RESULTS' && (
          <div className="flex flex-col relative z-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#d8b4fe] mb-2 text-center">
              Your Result
            </span>

            {/* Score Title */}
            <h2 className="text-4xl font-serif text-white mb-2 text-center">
              You scored {score} / {QUIZ_QUESTIONS.length}!
            </h2>

            {/* Score Message */}
            <p className="text-[#a69bb0] text-center text-sm sm:text-base mb-8 max-w-sm mx-auto">
              {score === QUIZ_QUESTIONS.length
                ? "Perfect! You're a true interior design globetrotter."
                : score >= 2
                  ? "Pretty good! You can recognize key design capitals."
                  : "Not bad, but a great excuse to travel and explore more cafes!"}
            </p>

            {/* Global Percentile Stats */}
            {percentile !== null && (
              <div className="bg-[#241c2a] border border-[#483a54]/40 rounded-2xl p-6 text-center mb-8">
                <span className="text-sm text-[#a69bb0] block mb-1">Rank Comparison</span>
                <span className="text-3xl sm:text-4xl font-serif text-white font-bold block">
                  You beat {percentile}%
                </span>
                <span className="text-xs text-[#d8b4fe]/85 mt-2 block">
                  of {totalPlayers || 'all'} players worldwide
                </span>
              </div>
            )}

            {/* Expandable Methodology Accordion */}
            <div className="border border-[#483a54]/40 rounded-xl overflow-hidden mb-8 bg-[#201925]">
              <button
                onClick={() => setIsMethodologyOpen(prev => !prev)}
                className="w-full py-4 px-6 flex justify-between items-center text-left text-sm font-semibold text-[#e3def0] hover:bg-[#2c2235] transition-colors"
              >
                <span>Methodology & Why We Did This</span>
                <span className="text-[#d8b4fe] text-lg font-bold">
                  {isMethodologyOpen ? '−' : '+'}
                </span>
              </button>

              {isMethodologyOpen && (
                <div className="p-6 border-t border-[#483a54]/40 bg-[#1d1622] text-[#a69bb0] text-sm leading-relaxed space-y-4">
                  <p>
                    <strong>Why this project?</strong> The Interior Guesser is an experimental study designed to explore if people can recognize regional aesthetic patterns (material selections, layouts, light configurations, and furnishings) in modern café designs without explicit landmarks.
                  </p>
                  <p>
                    <strong>Data Tracking:</strong> We collect session progress and demographic information anonymously. No personally identifying information is saved. All stats are tracked using a PostgreSQL database with Supabase to analyze how backgrounds (age, industry, location) influence guess accuracy.
                  </p>
                </div>
              )}
            </div>


          </div>
        )}
      </div>
    </div>
  )
}
