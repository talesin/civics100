"use client";

import React, { useState, useEffect } from "react";
import { Effect } from "effect";
import Layout from "@/components/Layout";
import StatsSummary from "@/components/StatsSummary";
import { LocalStorageService } from "@/services/LocalStorageService";
import { GameStats } from "@/types";

export default function Home() {
  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    averageScore: 0,
    bestScore: 0,
    earlyWins: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = Effect.gen(function* () {
      const storageService = yield* LocalStorageService;
      const gameStats = yield* storageService.getGameStats();
      setStats(gameStats);
      setIsLoading(false);
    });

    Effect.runPromise(
      loadStats.pipe(Effect.provide(LocalStorageService.Default)),
    ).catch(console.error);
  }, []);

  const handleStartGame = () => {
    window.location.href = "/game";
  };

  const handleViewResults = () => {
    window.location.href = "/results";
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="US Civics Test">
      <div className="space-y-8">
        <div className="text-center mb-8 lg:mb-12">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce-in">
              <span className="text-white text-3xl">🇺🇸</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 text-gradient">
              US Civics Test
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto text-balance">
              Test your knowledge of American civics and history. Answer
              questions about the Constitution, government structure, and
              American history to see if you can pass the citizenship test.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-8">
            <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
              📚 100 Questions
            </span>
            <span className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
              ✅ 60% to Pass
            </span>
            <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full">
              ⚡ 6 Early Win
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          <div className="card card-interactive group">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-200">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Take the Test
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-balance">
                Start a new civics test with up to 10 questions. You need 6
                correct answers to pass, or you can continue to answer all 10
                questions.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">
                  🎯 Interactive
                </span>
                <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">
                  🔊 Audio Feedback
                </span>
                <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">
                  ⌨️ Keyboard Support
                </span>
              </div>
            </div>
            <button
              onClick={handleStartGame}
              className="w-full btn-primary py-3 px-6 rounded-lg font-semibold text-base shadow-md hover:shadow-lg focus-ring"
            >
              Start New Test
            </button>
          </div>

          <div className="card card-interactive group">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-200">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                View Results
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-balance">
                Review your past test results, track your progress, and see
                detailed statistics about your civics knowledge.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 px-2 py-1 rounded">
                  📊 Statistics
                </span>
                <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 px-2 py-1 rounded">
                  📈 Progress Tracking
                </span>
                <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 px-2 py-1 rounded">
                  🏆 Achievements
                </span>
              </div>
            </div>
            <button
              onClick={handleViewResults}
              className="w-full btn-success py-3 px-6 rounded-lg font-semibold text-base shadow-md hover:shadow-lg focus-ring"
            >
              View Results
            </button>
          </div>
        </div>

        <StatsSummary stats={stats} />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            About the Test
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600 dark:text-gray-300">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Test Format
              </h4>
              <ul className="space-y-1">
                <li>• Up to 10 multiple choice questions</li>
                <li>• Pass with 6 correct answers</li>
                <li>• Questions from real civics test</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Topics Covered
              </h4>
              <ul className="space-y-1">
                <li>• American Government</li>
                <li>• American History</li>
                <li>• Integrated Civics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Features
              </h4>
              <ul className="space-y-1">
                <li>• Track your progress</li>
                <li>• Immediate feedback</li>
                <li>• Historical performance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
