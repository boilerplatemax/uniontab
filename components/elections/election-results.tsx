'use client';

import { QuestionType } from '@/lib/db/schema';

type ResultData = {
  questionId: number;
  questionText: string;
  questionType: string;
  results: any;
};

export function ElectionResults({
  results,
  totalVotes,
}: {
  results: ResultData[];
  totalVotes: number;
}) {
  const renderResults = (result: ResultData) => {
    switch (result.questionType) {
      case QuestionType.YES_NO:
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <div className="space-y-3">
            {result.results.map(
              (option: {
                optionId: number;
                optionText: string;
                count: number;
                percentage: number;
              }) => (
                <div key={option.optionId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{option.optionText}</span>
                    <span className="text-gray-600">
                      {option.count} votes ({option.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        );

      case QuestionType.MULTIPLE_ANSWER:
        return (
          <div className="space-y-3">
            {result.results.map(
              (option: {
                optionId: number;
                optionText: string;
                count: number;
                percentage: number;
              }) => (
                <div key={option.optionId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{option.optionText}</span>
                    <span className="text-gray-600">
                      {option.count} selections ({option.percentage.toFixed(1)}%
                      of voters)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        );

      case QuestionType.RANKING:
        const sortedResults = [...result.results].sort(
          (a: any, b: any) => a.averageRank - b.averageRank
        );
        return (
          <div className="space-y-3">
            {sortedResults.map(
              (
                option: {
                  optionId: number;
                  optionText: string;
                  averageRank: number;
                  timesRanked: number;
                },
                index
              ) => (
                <div
                  key={option.optionId}
                  className="flex items-center space-x-4 p-3 border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0
                          ? 'bg-yellow-500'
                          : index === 1
                            ? 'bg-gray-400'
                            : index === 2
                              ? 'bg-amber-600'
                              : 'bg-gray-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{option.optionText}</div>
                    <div className="text-sm text-gray-600">
                      Average rank: {option.averageRank.toFixed(2)} (ranked by{' '}
                      {option.timesRanked} voters)
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        );

      case QuestionType.SCALE:
        const distribution = result.results.distribution || {};
        const settings = result.results.settings as { min?: number; max?: number } | null;
        const min = settings?.min ?? 1;
        const max = settings?.max ?? 10;
        const values = Object.keys(distribution).map(Number).sort((a, b) => a - b);

        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">
                {result.results.average.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                Average score ({result.results.count} responses)
              </div>
            </div>
            <div className="space-y-2">
              {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(
                (value) => {
                  const count = distribution[value] || 0;
                  const percentage =
                    result.results.count > 0
                      ? (count / result.results.count) * 100
                      : 0;
                  return (
                    <div key={value} className="flex items-center space-x-3">
                      <span className="w-6 text-sm font-medium">{value}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6">
                        <div
                          className="bg-purple-600 h-6 rounded-full transition-all flex items-center justify-end pr-2"
                          style={{ width: `${percentage}%` }}
                        >
                          {count > 0 && (
                            <span className="text-xs text-white font-medium">
                              {count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        );

      case QuestionType.TEXT_SHORT:
      case QuestionType.TEXT_LONG:
        const responses = result.results as string[];
        return (
          <div className="space-y-2">
            <div className="text-sm text-gray-600 mb-3">
              {responses.length} responses
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {responses.map((response, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 border rounded-lg text-sm"
                >
                  {response}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-gray-500 text-sm">
            Results not available for this question type
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-700 font-medium">Total Votes</div>
        <div className="text-3xl font-bold text-blue-900">{totalVotes}</div>
      </div>

      {results.map((result, index) => (
        <div key={result.questionId} className="space-y-3">
          <h3 className="text-lg font-semibold">
            {index + 1}. {result.questionText}
          </h3>
          {renderResults(result)}
        </div>
      ))}
    </div>
  );
}
