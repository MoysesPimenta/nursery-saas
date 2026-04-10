'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { motion } from 'framer-motion';
import { Download, FileJson, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

type ExportType = 'children' | 'employees' | 'visits' | 'authorizations';
type ExportFormat = 'json' | 'csv';

export default function ExportPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [exportType, setExportType] = useState<ExportType>('children');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await api(`/api/v1/export?type=${exportType}&format=${exportFormat}`);

      if (exportFormat === 'csv') {
        // For CSV, trigger a download
        const blob = new Blob([response], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportType}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For JSON, trigger a download
        const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportType}_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const exportOptions = [
    { value: 'children', label: 'Children', description: 'All enrolled children and their details' },
    { value: 'employees', label: 'Employees', description: 'Staff members and employment records' },
    { value: 'visits', label: 'Visits', description: 'Health visit logs and records' },
    { value: 'authorizations', label: 'Authorizations', description: 'Authorization requests and approvals' },
  ];

  return (
    <motion.div
      className="space-y-6 max-w-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Export Data</h1>
        <p className="text-muted-foreground mt-1">
          Download your nursery data in CSV or JSON format
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            Export Configuration
          </CardTitle>
          <CardDescription>
            Select the data type and format to export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200 px-4 py-3 rounded text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Export downloaded successfully!
              </div>
            )}

            <FormField label="Data Type" required>
              <Select
                name="type"
                value={exportType}
                onChange={(e) => setExportType(e.target.value as ExportType)}
              >
                {exportOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {exportOptions.find((o) => o.value === exportType)?.description}
              </p>
            </FormField>

            <FormField label="Format" required>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    exportFormat === 'csv'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                      : 'border-border hover:border-indigo-300'
                  }`}
                >
                  <FileSpreadsheet className={`w-6 h-6 ${exportFormat === 'csv' ? 'text-indigo-600' : 'text-muted-foreground'}`} />
                  <div className="text-left">
                    <p className="font-medium text-sm">CSV</p>
                    <p className="text-xs text-muted-foreground">Spreadsheet compatible</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('json')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    exportFormat === 'json'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                      : 'border-border hover:border-indigo-300'
                  }`}
                >
                  <FileJson className={`w-6 h-6 ${exportFormat === 'json' ? 'text-indigo-600' : 'text-muted-foreground'}`} />
                  <div className="text-left">
                    <p className="font-medium text-sm">JSON</p>
                    <p className="text-xs text-muted-foreground">Developer friendly</p>
                  </div>
                </button>
              </div>
            </FormField>

            <Button
              onClick={handleExport}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {loading ? (
                'Exporting...'
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {exportOptions.find((o) => o.value === exportType)?.label} as {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
