'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { FormField } from '@/components/ui/form-field';
import { PageLoading } from '@/components/ui/loading';
import { useApiMutation, useApiQuery } from '@/lib/hooks/use-api';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  hireDate: z.string().optional(),
  notes: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

// API returns snake_case from Supabase
interface EmployeeDetail {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  department_id?: string;
  hire_date?: string;
  notes?: string;
}

interface Department {
  id: string;
  name: string;
}

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('employees');
  const locale = params.locale as string;
  const employeeId = params.id as string;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<EmployeeFormData>>({});

  // Fetch employee data
  const { data: employee, loading: loadingEmployee } = useApiQuery<EmployeeDetail>(
    `/api/v1/employees/${employeeId}`
  );

  // Fetch departments
  const { data: departmentsData } = useApiQuery<{ data: Department[] }>(
    '/api/v1/departments'
  );
  const departments = departmentsData?.data || [];

  // Initialize form data when employee data is loaded (map snake_case → camelCase for form)
  const [initialized, setInitialized] = useState(false);
  if (employee && !initialized) {
    setFormData({
      firstName: employee.first_name,
      lastName: employee.last_name,
      email: employee.email,
      phone: employee.phone,
      departmentId: employee.department_id,
      hireDate: employee.hire_date,
      notes: employee.notes,
    });
    setInitialized(true);
  }

  const { execute: updateEmployee, loading: saving } = useApiMutation<{ id: string }>(
    `/api/v1/employees/${employeeId}`,
    'PATCH'
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      // Convert camelCase form fields to snake_case for the API
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        department_id: formData.departmentId || null,
        hire_date: formData.hireDate || null,
        notes: formData.notes || null,
      };
      await updateEmployee(payload);
      router.push(`/${locale}/employees/${employeeId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update employee';
      setErrors({ submit: message });
    }
  };

  if (loadingEmployee) {
    return <PageLoading />;
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Employee not found</p>
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/employees`)}
          className="mt-4"
        >
          Back to Employees
        </Button>
      </div>
    );
  }

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
          onClick={() => router.push(`/${locale}/employees/${employeeId}`)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('editEmployee')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('updateInfo', { name: `${employee.first_name} ${employee.last_name}` })}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('personalInfo')}</CardTitle>
          <CardDescription>
            {t('updateEmployeeProfile')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded text-sm">
                {errors.submit}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('firstName')} error={errors.firstName} required>
                <Input
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName || ''}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label={t('lastName')} error={errors.lastName} required>
                <Input
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName || ''}
                  onChange={handleChange}
                />
              </FormField>
            </div>

            <FormField label={t('email')} error={errors.email} required>
              <Input
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email || ''}
                onChange={handleChange}
              />
            </FormField>

            <FormField label={t('phone')}>
              <PhoneInput
                name="phone"
                placeholder="11 99999-9999"
                value={formData.phone || ''}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, phone: value }));
                  if (errors.phone) {
                    setErrors((prev) => ({ ...prev, phone: '' }));
                  }
                }}
              />
            </FormField>

            <FormField label={t('department')}>
              <Select
                name="departmentId"
                value={formData.departmentId || ''}
                onChange={handleChange}
              >
                <option value="">{t('selectDepartment')}</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label={t('hireDate')}>
              <Input
                name="hireDate"
                type="date"
                value={formData.hireDate || ''}
                onChange={handleChange}
              />
            </FormField>

            <FormField label={t('notes')}>
              <Textarea
                name="notes"
                placeholder="Any additional notes about the employee..."
                value={formData.notes || ''}
                onChange={handleChange}
                className="min-h-[100px]"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/employees/${employeeId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('back')}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </motion.div>
  );
}
