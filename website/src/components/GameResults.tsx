import React from "react";
import { GameResult } from "@/types";

interface GameResultsProps {
  result: GameResult;
  onPlayAgain: () => void;
  onViewHistory: () => void;
}

export default function GameResults({
  result,
  onPlayAgain,
  onViewHistory,
}: GameResultsProps) {
  const getResultMessage = () => {
    if (result.isEarlyWin) {
      return "🎉 Excellent! You passed with 6 correct answers!";
    } else if (result.percentage >= 60) {
      return "✅ Congratulations! You passed the civics test!";
    } else {
      return "📚 Keep studying! You need 60% to pass.";
    }
  };

  const getResultColor = () => {
    if (result.isEarlyWin || result.percentage >= 60) {
      return "text-green-600 dark:text-green-400";
    } else {
      return "text-red-600 dark:text-red-400";
    }
  };

  const getScoreColor = () => {
    if (result.percentage >= 80) return "text-green-600 dark:text-green-400";
    if (result.percentage >= 60) return "text-blue-600 dark:text-blue-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="result-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
      <div className="mb-6">
        <div className="animate-bounce-in">
          {result.isEarlyWin || result.percentage >= 60 ? (
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600 dark:text-green-400"
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
          ) : (
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 animate-fade-in">
          Game Complete!
        </h2>
        <p
          className={`text-lg font-medium ${getResultColor()} animate-slide-in-right`}
        >
          {getResultMessage()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className={`text-3xl font-bold ${getScoreColor()}`}>
            {result.percentage}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Final Score
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {result.correctAnswers}/{result.totalQuestions}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Correct Answers
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              result.percentage >= 60 ? "bg-green-500" : "bg-red-500"
            }`}
            style={{ width: `${Math.min(result.percentage, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Passing score: 60% • You scored: {result.percentage}%
        </p>
      </div>

      {result.isEarlyWin && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            🌟 Early Win Achievement! You answered 6 questions correctly and
            chose to finish early.
          </p>
        </div>
      )}

      <div className="flex space-x-4 justify-center">
        <button
          onClick={onPlayAgain}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Play Again
        </button>
        <button
          onClick={onViewHistory}
          className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
        >
          View History
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Session completed at {result.completedAt.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
