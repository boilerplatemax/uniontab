'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, GripVertical, Trash2 } from 'lucide-react';
import { QuestionType } from '@/lib/db/schema';

type Question = {
  id: string;
  questionText: string;
  questionType: QuestionType;
  required: boolean;
  settings?: any;
  options: { id: string; optionText: string; order: number }[];
  order: number;
};

const QUESTION_TYPES = [
  { value: 'text_short', label: 'Short Text' },
  { value: 'text_long', label: 'Long Text (Paragraph)' },
  { value: 'multiple_choice', label: 'Single Choice (Radio Buttons)' },
  { value: 'multiple_answer', label: 'Multiple Choice (Checkboxes)' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'scale', label: 'Scale (1-10)' },
  { value: 'yes_no', label: 'Yes/No' },
];

const NEEDS_OPTIONS = [
  'multiple_choice',
  'multiple_answer',
  'ranking',
  'yes_no',
];

export function CreateElectionDialog({
  unionId,
  onSuccess,
}: {
  unionId: number;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [allowRevotes, setAllowRevotes] = useState(false);
  const [resultsVisibility, setResultsVisibility] = useState<'hidden' | 'members' | 'public'>('hidden');
  const [questions, setQuestions] = useState<Question[]>([]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Auto-generate slug from title
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug);
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      questionText: '',
      questionType: QuestionType.TEXT_SHORT,
      required: true,
      options: [],
      order: questions.length,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === id) {
          const updated = { ...q, ...updates };
          // If type changed and now needs options, add default Yes/No
          if (
            updates.questionType &&
            NEEDS_OPTIONS.includes(updates.questionType) &&
            q.options.length === 0
          ) {
            if (updates.questionType === 'yes_no') {
              updated.options = [
                { id: `opt-${Date.now()}-1`, optionText: 'Yes', order: 0 },
                { id: `opt-${Date.now()}-2`, optionText: 'No', order: 1 },
              ];
            } else {
              updated.options = [
                { id: `opt-${Date.now()}`, optionText: '', order: 0 },
              ];
            }
          }
          // If type changed and no longer needs options, clear them
          if (
            updates.questionType &&
            !NEEDS_OPTIONS.includes(updates.questionType)
          ) {
            updated.options = [];
          }
          return updated;
        }
        return q;
      })
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: [
              ...q.options,
              {
                id: `opt-${Date.now()}`,
                optionText: '',
                order: q.options.length,
              },
            ],
          };
        }
        return q;
      })
    );
  };

  const updateOption = (
    questionId: string,
    optionId: string,
    optionText: string
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.map((opt) =>
              opt.id === optionId ? { ...opt, optionText } : opt
            ),
          };
        }
        return q;
      })
    );
  };

  const removeOption = (questionId: string, optionId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: q.options.filter((opt) => opt.id !== optionId),
          };
        }
        return q;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!title || !openTime || !closeTime || questions.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      // Validate each question
      for (const question of questions) {
        if (!question.questionText.trim()) {
          throw new Error('All questions must have text');
        }
        if (
          NEEDS_OPTIONS.includes(question.questionType) &&
          question.options.length < 2
        ) {
          throw new Error(
            `Question "${question.questionText}" needs at least 2 options`
          );
        }
        if (
          NEEDS_OPTIONS.includes(question.questionType) &&
          question.options.some((opt) => !opt.optionText.trim())
        ) {
          throw new Error(
            `All options for question "${question.questionText}" must have text`
          );
        }
      }

      // Convert datetime-local format to ISO 8601
      const openTimeISO = new Date(openTime).toISOString();
      const closeTimeISO = new Date(closeTime).toISOString();

      const response = await fetch('/api/elections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId,
          title,
          description,
          slug,
          openTime: openTimeISO,
          closeTime: closeTimeISO,
          timezone,
          allowRevotes,
          resultsVisibility,
          questions: questions.map((q) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            required: q.required,
            order: q.order,
            settings: q.settings,
            options:
              q.options.length > 0
                ? q.options.map((opt) => ({
                    optionText: opt.optionText,
                    order: opt.order,
                  }))
                : undefined,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create election');
      }

      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSlug('');
    setOpenTime('');
    setCloseTime('');
    setTimezone('UTC');
    setAllowRevotes(false);
    setResultsVisibility('hidden');
    setQuestions([]);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Election
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Election</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Election Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Board of Directors Election 2025"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="board-election-2025"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this election..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="openTime">Opening Date & Time *</Label>
                <Input
                  id="openTime"
                  type="datetime-local"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  step="900"
                  required
                />
              </div>
              <div>
                <Label htmlFor="closeTime">Closing Date & Time *</Label>
                <Input
                  id="closeTime"
                  type="datetime-local"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  step="900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
              <div>
                <Label htmlFor="resultsVisibility">Results Visibility</Label>
                <select
                  id="resultsVisibility"
                  value={resultsVisibility}
                  onChange={(e) =>
                    setResultsVisibility(e.target.value as any)
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="hidden">Hidden (Admin Only)</option>
                  <option value="members">Members Only</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowRevotes"
                checked={allowRevotes}
                onChange={(e) => setAllowRevotes(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="allowRevotes" className="font-normal">
                Allow members to change their vote
              </Label>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Questions</h3>
              <Button type="button" onClick={addQuestion} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Question
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border rounded-lg p-4 space-y-3 bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">Question {index + 1}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>

                  <div>
                    <Input
                      value={question.questionText}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          questionText: e.target.value,
                        })
                      }
                      placeholder="Enter your question..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Question Type</Label>
                      <select
                        value={question.questionType}
                        onChange={(e) =>
                          updateQuestion(question.id, {
                            questionType: e.target.value as QuestionType,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        {QUESTION_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              required: e.target.checked,
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-sm">Required</span>
                      </label>
                    </div>
                  </div>

                  {NEEDS_OPTIONS.includes(question.questionType) && (
                    <div className="space-y-2 pl-7">
                      <Label className="text-sm">Answer Options</Label>
                      {question.options.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Input
                            value={option.optionText}
                            onChange={(e) =>
                              updateOption(
                                question.id,
                                option.id,
                                e.target.value
                              )
                            }
                            placeholder="Option text..."
                            className="flex-1"
                            required
                          />
                          {question.options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeOption(question.id, option.id)
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(question.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Option
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {questions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No questions yet. Click "Add Question" to get started.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Election'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
