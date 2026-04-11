'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApiQuery } from '@/lib/hooks/use-api';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface Visit {
  id: string;
  type: string;
  complaint: string;
  childName: string;
  timestamp: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  childName: string;
}

interface CalendarEvent {
  date: string;
  visits: Visit[];
  medications: Medication[];
}

interface CalendarResponse {
  events: CalendarEvent[];
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function CalendarPage() {
  const t = useTranslations('calendar');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Calculate date range for the current month
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Get previous month's days to fill the first week
  const firstDayOfWeek = monthStart.getDay();
  const rangeStart = new Date(monthStart);
  rangeStart.setDate(rangeStart.getDate() - firstDayOfWeek);

  // Get next month's days to fill the last week
  const rangeEnd = new Date(monthEnd);
  const lastDayOfWeek = monthEnd.getDay();
  rangeEnd.setDate(rangeEnd.getDate() + (6 - lastDayOfWeek));

  const startStr = rangeStart.toISOString().split('T')[0];
  const endStr = rangeEnd.toISOString().split('T')[0];

  // Fetch calendar data
  const { data: calendarData, loading } = useApiQuery<CalendarResponse>(
    `/api/v1/visits/calendar?start=${startStr}&end=${endStr}`
  );

  // Create a map of events by LOCAL date for quick lookup
  // The backend groups by UTC date, but we need to re-group by the user's local date
  // to avoid visits appearing on the wrong day due to timezone offset
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent> = {};
    if (calendarData?.events) {
      calendarData.events.forEach((event) => {
        // Re-group visits by local date
        event.visits.forEach((visit) => {
          const localDate = new Date(visit.timestamp);
          const localDateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
          if (!map[localDateStr]) {
            map[localDateStr] = { date: localDateStr, visits: [], medications: [] };
          }
          map[localDateStr].visits.push(visit);
        });
        // Medications don't have precise timestamps, keep them on their original date
        if (event.medications.length > 0) {
          if (!map[event.date]) {
            map[event.date] = { date: event.date, visits: [], medications: [] };
          }
          map[event.date].medications.push(...event.medications);
        }
      });
    }
    return map;
  }, [calendarData]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const days = [];
    const current = new Date(rangeStart);

    while (current <= rangeEnd) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [rangeStart, rangeEnd]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(today);
  };

  const selectedDayEvents = selectedDate ? eventsByDate[selectedDate] : null;

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="w-7 h-7 text-indigo-600" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <Button
          onClick={handleToday}
          className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {t('today')}
        </Button>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {currentDate.toLocaleDateString(locale, {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                    {t('prevMonth')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextMonth}>
                    {t('nextMonth')}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {/* Week days header */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="text-center font-semibold text-sm text-muted-foreground"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day) => {
                      const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                      const isCurrentMonth =
                        day.getMonth() === currentDate.getMonth() &&
                        day.getFullYear() === currentDate.getFullYear();
                      const isToday = dateStr === today;
                      const isSelected = dateStr === selectedDate;
                      const dayEvents = eventsByDate[dateStr];
                      const hasVisits = dayEvents && dayEvents.visits.length > 0;
                      const hasMedications =
                        dayEvents && dayEvents.medications.length > 0;

                      return (
                        <button
                          key={dateStr}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`aspect-square p-2 rounded-lg border-2 transition-all text-sm flex flex-col items-center justify-between ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950'
                              : 'border-border hover:border-indigo-300'
                          } ${!isCurrentMonth && 'opacity-50'} ${
                            isToday ? 'ring-2 ring-indigo-600' : ''
                          }`}
                        >
                          <div
                            className={`font-semibold ${
                              isToday ? 'text-indigo-600' : 'text-foreground'
                            }`}
                          >
                            {day.getDate()}
                          </div>
                          <div className="flex gap-1 flex-wrap justify-center">
                            {hasVisits && (
                              <div className="flex gap-0.5">
                                {dayEvents!.visits.slice(0, 2).map((_, i) => (
                                  <div
                                    key={`visit-${i}`}
                                    className="w-1.5 h-1.5 rounded-full bg-indigo-600"
                                    title={`${dayEvents!.visits.length} visit${
                                      dayEvents!.visits.length > 1 ? 's' : ''
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                            {hasMedications && (
                              <div className="flex gap-0.5">
                                {dayEvents!.medications.slice(0, 2).map((_, i) => (
                                  <div
                                    key={`med-${i}`}
                                    className="w-1.5 h-1.5 rounded-full bg-purple-600"
                                    title={`${dayEvents!.medications.length} medication${
                                      dayEvents!.medications.length > 1 ? 's' : ''
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex gap-6 text-xs text-muted-foreground mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      {t('visits')}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-600" />
                      {t('medications')}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details Panel */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate
                  ? (() => {
                      const [y, m, d] = selectedDate.split('-').map(Number);
                      return new Date(y, m - 1, d).toLocaleDateString(locale, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      });
                    })()
                  : t('noEvents')}
              </CardTitle>
              {selectedDayEvents && (
                <CardDescription>
                  {selectedDayEvents.visits.length + selectedDayEvents.medications.length} event
                  {selectedDayEvents.visits.length + selectedDayEvents.medications.length !== 1
                    ? 's'
                    : ''}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedDate ? (
                <p className="text-sm text-muted-foreground">{t('noEvents')}</p>
              ) : !selectedDayEvents ||
                (selectedDayEvents.visits.length === 0 &&
                  selectedDayEvents.medications.length === 0) ? (
                <p className="text-sm text-muted-foreground">{t('noEvents')}</p>
              ) : (
                <div className="space-y-4">
                  {/* Visits */}
                  {selectedDayEvents.visits.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-600" />
                        {t('visits')} ({selectedDayEvents.visits.length})
                      </h3>
                      <div className="space-y-2 pl-4">
                        {selectedDayEvents.visits.map((visit) => (
                          <div
                            key={visit.id}
                            className="text-sm p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800"
                          >
                            <div className="font-medium text-indigo-900 dark:text-indigo-100">
                              {visit.childName}
                            </div>
                            <div className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                              Type: {visit.type}
                            </div>
                            {visit.complaint && (
                              <div className="text-xs text-indigo-700 dark:text-indigo-300">
                                {visit.complaint}
                              </div>
                            )}
                            <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                              {new Date(visit.timestamp).toLocaleTimeString(locale, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medications */}
                  {selectedDayEvents.medications.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-600" />
                        {t('medications')} ({selectedDayEvents.medications.length})
                      </h3>
                      <div className="space-y-2 pl-4">
                        {selectedDayEvents.medications.map((med) => (
                          <div
                            key={med.id}
                            className="text-sm p-2 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800"
                          >
                            <div className="font-medium text-purple-900 dark:text-purple-100">
                              {med.name}
                            </div>
                            <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                              {med.childName}
                            </div>
                            <div className="text-xs text-purple-700 dark:text-purple-300">
                              Dosage: {med.dosage}
                            </div>
                            {med.frequency && (
                              <div className="text-xs text-purple-700 dark:text-purple-300">
                                Frequency: {med.frequency}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}
