'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Loader2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import type { Union } from '@/lib/db/schema';

interface FormData {
  // Step 1: Basic Info
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;

  // Step 2: Employment Info
  employer: string;
  jobTitle: string;
  worksite: string;
  employmentStatus: string;

  // Step 3: Optional Info
  address: string;
  dateOfBirth: string;
  memberId: string;
  localChapter: string;
  bargainingUnit: string;
  startDateWithEmployer: string;
}

export function MultiStepMemberSignUp({
  params,
  union
}: {
  params: Promise<{ slug: string }>;
  union: Union;
}) {
  const { slug } = use(params);
  const unionDisplayName = union.publicName || union.name;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    employer: '',
    jobTitle: '',
    worksite: '',
    employmentStatus: '',
    address: '',
    dateOfBirth: '',
    memberId: '',
    localChapter: '',
    bargainingUnit: '',
    startDateWithEmployer: '',
  });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.phone) {
        setError('Please fill in all required fields');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
      // Basic email validation
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.employer || !formData.jobTitle || !formData.worksite || !formData.employmentStatus) {
        setError('Please fill in all required employment information');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      setError('');
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If not on the final step, advance to next step instead of submitting
    if (step < totalSteps) {
      handleNext();
      return;
    }

    if (!validateStep(step)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/union/${slug}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      // If email verification is required, redirect to verify-pending page
      if (data.requiresVerification) {
        router.push(`/auth/verify-pending?email=${encodeURIComponent(formData.email)}`);
      } else {
        // Redirect to union page after successful signup
        router.push(`/${slug}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((stepNum) => (
        <div key={stepNum} className="flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              step > stepNum
                ? 'bg-green-500 border-green-500 text-white'
                : step === stepNum
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-500'
            }`}
          >
            {step > stepNum ? <Check className="h-5 w-5" /> : stepNum}
          </div>
          {stepNum < 3 && (
            <div
              className={`w-16 h-1 ${
                step > stepNum ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {unionDisplayName}
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {union.logoUrl ? (
                <div className="h-24 max-w-xs flex items-center justify-center">
                  <img
                    src={union.logoUrl}
                    alt={`${unionDisplayName} logo`}
                    className="max-h-24 max-w-full w-auto h-auto object-contain"
                  />
                </div>
              ) : (
                <Users className="h-12 w-12 text-blue-600" />
              )}
            </div>
            <CardTitle className="text-2xl">Join {unionDisplayName}</CardTitle>
            <CardDescription>
              {step === 1 && 'Step 1 of 3: Basic Information'}
              {step === 2 && 'Step 2 of 3: Employment Details'}
              {step === 3 && 'Step 3 of 3: Additional Information (Optional)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepIndicator()}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        required
                        value={formData.firstName}
                        onChange={(e) => updateField('firstName', e.target.value)}
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        required
                        value={formData.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="Min. 8 characters"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Employment Information */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="employer">Employer *</Label>
                    <Input
                      id="employer"
                      required
                      value={formData.employer}
                      onChange={(e) => updateField('employer', e.target.value)}
                      placeholder="ABC Company"
                    />
                  </div>

                  <div>
                    <Label htmlFor="jobTitle">Job Title / Classification *</Label>
                    <Input
                      id="jobTitle"
                      required
                      value={formData.jobTitle}
                      onChange={(e) => updateField('jobTitle', e.target.value)}
                      placeholder="Your job title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="worksite">Worksite / Location *</Label>
                    <Input
                      id="worksite"
                      required
                      value={formData.worksite}
                      onChange={(e) => updateField('worksite', e.target.value)}
                      placeholder="Main Office, Building A"
                    />
                  </div>

                  <div>
                    <Label htmlFor="employmentStatus">Employment Status *</Label>
                    <Select
                      value={formData.employmentStatus}
                      onValueChange={(value) => updateField('employmentStatus', value)}
                      required
                    >
                      <SelectTrigger id="employmentStatus">
                        <SelectValue placeholder="Select employment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="term">Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 3: Optional Information */}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    The following fields are optional but help us serve you better.
                  </p>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="123 Main St, City, State, ZIP"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="memberId">Member ID / Number</Label>
                      <Input
                        id="memberId"
                        value={formData.memberId}
                        onChange={(e) => updateField('memberId', e.target.value)}
                        placeholder="M12345"
                      />
                    </div>
                    <div>
                      <Label htmlFor="startDateWithEmployer">Start Date with Employer</Label>
                      <Input
                        id="startDateWithEmployer"
                        type="date"
                        value={formData.startDateWithEmployer}
                        onChange={(e) => updateField('startDateWithEmployer', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="localChapter">Local / Chapter Assignment</Label>
                    <Input
                      id="localChapter"
                      value={formData.localChapter}
                      onChange={(e) => updateField('localChapter', e.target.value)}
                      placeholder="Local 123"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bargainingUnit">Bargaining Unit</Label>
                    <Input
                      id="bargainingUnit"
                      value={formData.bargainingUnit}
                      onChange={(e) => updateField('bargainingUnit', e.target.value)}
                      placeholder="Technical Services"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={loading}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}

                {step < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Member Account'
                    )}
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Already a member? </span>
              <Link
                href={`/${slug}/sign-in`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
