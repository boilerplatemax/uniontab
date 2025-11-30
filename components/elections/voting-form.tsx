'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { QuestionType } from '@/lib/db/schema';
import { GripVertical } from 'lucide-react';

type Question = {
  id: number;
  questionText: string;
  questionType: string;
  required: boolean;
  settings?: any;
  options: { id: number; optionText: string; order: number }[];
};

type VoteFormData = {
  [questionId: number]: {
    responseText?: string;
    selectedOptionId?: number;
    selectedOptionIds?: number[];
    rankingData?: number[];
    scaleValue?: number;
  };
};

export function VotingForm({
  election,
  onSubmit,
  onCancel,
  initialData,
}: {
  election: {
    id: number;
    title: string;
    description: string | null;
    questions: Question[];
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  initialData?: VoteFormData;
}) {
  const [formData, setFormData] = useState<VoteFormData>(initialData || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required questions
      const requiredQuestions = election.questions.filter((q) => q.required);
      for (const question of requiredQuestions) {
        if (!formData[question.id]) {
          throw new Error(`Please answer: ${question.questionText}`);
        }
      }

      // Build responses array
      const responses = Object.entries(formData).map(([questionId, data]) => ({
        questionId: parseInt(questionId),
        ...data,
      }));

      await onSubmit({ responses });
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const updateResponse = (questionId: number, data: any) => {
    setFormData({
      ...formData,
      [questionId]: data,
    });
  };

  const renderQuestion = (question: Question) => {
    switch (question.questionType) {
      case QuestionType.TEXT_SHORT:
        return (
          <Input
            value={formData[question.id]?.responseText || ''}
            onChange={(e) =>
              updateResponse(question.id, { responseText: e.target.value })
            }
            placeholder="Your answer..."
            required={question.required}
          />
        );

      case QuestionType.TEXT_LONG:
        return (
          <Textarea
            value={formData[question.id]?.responseText || ''}
            onChange={(e) =>
              updateResponse(question.id, { responseText: e.target.value })
            }
            placeholder="Your answer..."
            rows={4}
            required={question.required}
          />
        );

      case QuestionType.YES_NO:
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <div className="space-y-2">
            {question.options.map((option) => (
              <label
                key={option.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  checked={formData[question.id]?.selectedOptionId === option.id}
                  onChange={() =>
                    updateResponse(question.id, { selectedOptionId: option.id })
                  }
                  required={question.required}
                  className="w-4 h-4"
                />
                <span>{option.optionText}</span>
              </label>
            ))}
          </div>
        );

      case QuestionType.MULTIPLE_ANSWER:
        return (
          <div className="space-y-2">
            {question.options.map((option) => (
              <label
                key={option.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={
                    formData[question.id]?.selectedOptionIds?.includes(
                      option.id
                    ) || false
                  }
                  onChange={(e) => {
                    const current =
                      formData[question.id]?.selectedOptionIds || [];
                    const updated = e.target.checked
                      ? [...current, option.id]
                      : current.filter((id) => id !== option.id);
                    updateResponse(question.id, { selectedOptionIds: updated });
                  }}
                  className="w-4 h-4 rounded"
                />
                <span>{option.optionText}</span>
              </label>
            ))}
          </div>
        );

      case QuestionType.RANKING:
        const ranking = formData[question.id]?.rankingData || [];
        const unranked = question.options.filter(
          (opt) => !ranking.includes(opt.id)
        );

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600">
                Drag to rank (1 = most preferred)
              </Label>
              {ranking.map((optionId, index) => {
                const option = question.options.find((o) => o.id === optionId);
                if (!option) return null;
                return (
                  <div
                    key={optionId}
                    className="flex items-center space-x-3 p-3 border rounded-lg bg-blue-50"
                  >
                    <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                    <span className="font-semibold text-blue-700">
                      #{index + 1}
                    </span>
                    <span className="flex-1">{option.optionText}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = ranking.filter((id) => id !== optionId);
                        updateResponse(question.id, { rankingData: updated });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
            </div>
            {unranked.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">
                  Click to add to ranking:
                </Label>
                {unranked.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      const updated = [...ranking, option.id];
                      updateResponse(question.id, { rankingData: updated });
                    }}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 w-full text-left"
                  >
                    <span>{option.optionText}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case QuestionType.SCALE:
        const settings = question.settings as { min?: number; max?: number } | null;
        const min = settings?.min ?? 1;
        const max = settings?.max ?? 10;
        const current = formData[question.id]?.scaleValue;

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{min}</span>
              <span>{max}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              value={current ?? Math.floor((min + max) / 2)}
              onChange={(e) =>
                updateResponse(question.id, {
                  scaleValue: parseInt(e.target.value),
                })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              required={question.required}
            />
            <div className="text-center">
              <span className="text-2xl font-bold text-blue-600">
                {current ?? Math.floor((min + max) / 2)}
              </span>
            </div>
          </div>
        );

      default:
        return <div className="text-red-500">Unknown question type</div>;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {election.questions.map((question, index) => (
          <div key={question.id} className="space-y-3">
            <Label className="text-base font-medium">
              {index + 1}. {question.questionText}
              {question.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>
            {renderQuestion(question)}
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Vote'}
        </Button>
      </div>
    </form>
  );
}
