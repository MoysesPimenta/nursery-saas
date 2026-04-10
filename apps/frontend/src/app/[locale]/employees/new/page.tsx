'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { useApiMutation, useApiQuery } from '@/lib/hooks/use-api';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  departmentId: z.string().optional(),
  hireDate: z.string().min(1, 'Hire date is required'),
  certifications: z.string().optional(),
  notes: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface Department {
  id: string;
  name: string;
}

interface DepartmentsResponse {
  data: Department[];
}

export default function NewEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState<Partial<EmployeeFormData>>({
    position: 'nurse',
  });

  const { execute: createEmployee, loading } = useApiMutation<{ id: string }>(
    '/api/v1/employees',
    'POST'
  );

  // Fetch departments from API
  const { data: departmentsData } = useApiQuery<DepartmentsResponse>(
    '/api/v1/departments'
  );
  const departments = departmentsData?.data || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = (): boolean => {
    try {
      const dataToValidate = {
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        email: formData.email || '',
        phone: formData.phone || '',
        position: formData.position || '',
        departmentId: formData.departmentId || '',
        hireDate: formData.hireDate || '',
        certifications: formData.certifications || '',
        notes: formData.notes || '',
      };
      employeeSchema.parse(dataToValidate);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as string;
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Convert camelCase form fields to snake_case for the API
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        position: formData.position,
        department_id: formData.departmentId || undefined,
        hire_date: formData.hireDate,
        notes: formData.certifications
          ? `Certifications: ${formData.certifications}${formData.notes ? '\n' + formData.notes : ''}`
          : formData.notes || undefined,
      };
      const result = await createEmployee(payload);
      router.push(`/${locale}/employees/${result.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create employee';
      setSubmitError(message);
    }
  };

  return (
    <motion.div
      className="space-y-6 max-w-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/${locale}/employees`)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Employee</h1>
          <p className="text-muted-foreground mt-1">
            Create a new employee profile in the system
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Information</CardTitle>
          <CardDescription>
            Fill in the employee details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {submitError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded text-sm">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField label="First Name" error={errors.firstName} required>
                <Input
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName || ''}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label="Last Name" error={errors.lastName} required>
                <Input
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName || ''}
                  onChange={handleChange}
                />
              </FormField>
            </div>

            <FormField label="Email" error={errors.email} required>
              <Input
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email || ''}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Phone Number">
              <Input
                name="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone || ''}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Position" error={errors.position} required>
              <Select
                name="position"
                value={formData.position || 'nurse'}
                onChange={handleChange}
              >
                <option value="nurse">Nurse</option>
                <option value="teacher">Teacher</option>
                <option value="administrator">Administrator</option>
                <option value="assistant">Assistant</option>
                <option value="maintenance">Maintenance</option>
              </Select>
            </FormField>

            <FormField label="Department">
              <Select
                name="departmentId"
                value={formData.departmentId || ''}
                onChange={handleChange}
              >
                <option value="">Select a department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Hire Date" error={errors.hireDate} required>
              <Input
                name="hireDate"
                type="date"
                value={formData.hireDate || ''}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Certifications">
              <Textarea
                name="certifications"
                placeholder="List any relevant certifications..."
                value={formData.certifications || ''}
                onChange={handleChange}
                className="min-h-[100px]"
              />
            </FormField>

            <FormField label="Notes">
              <Textarea
                name="notes"
                placeholder="Any additional notes..."
                value={formData.notes || ''}
                onChange={handleChange}
                className="min-h-[100px]"
              />
            </FormField>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/${locale}/employees`)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {loading ? 'Creating...' : 'Create Employee'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
