import { Vitals } from '@/components/vitals-form';

export interface VitalEvaluation {
  field: string;
  value: number;
  status: 'normal' | 'warning' | 'critical';
  message: string;
  reference: string;
}

/**
 * Evaluates vital signs based on pediatric reference ranges from Brazilian Pediatric Society
 */
export function evaluateVitals(vitals: Vitals, ageInMonths: number): VitalEvaluation[] {
  const evaluations: VitalEvaluation[] = [];

  // Temperature: 35.8–37.3°C normal for all ages
  if (vitals.temperature !== null) {
    const tempC = vitals.temperatureUnit === 'F'
      ? ((vitals.temperature - 32) * 5) / 9
      : vitals.temperature;

    if (tempC >= 35.8 && tempC <= 37.3) {
      evaluations.push({
        field: 'Temperature',
        value: vitals.temperature,
        status: 'normal',
        message: `${tempC.toFixed(1)}°C - Normal`,
        reference: '35.8–37.3°C',
      });
    } else {
      evaluations.push({
        field: 'Temperature',
        value: vitals.temperature,
        status: 'critical',
        message: `${tempC.toFixed(1)}°C - Outside normal range`,
        reference: '35.8–37.3°C',
      });
    }
  }

  // Heart Rate (awake)
  if (vitals.heartRate !== null) {
    let minHR = 60;
    let maxHR = 100;
    let ageGroup = '>10yr';

    if (ageInMonths < 3) {
      minHR = 85;
      maxHR = 205;
      ageGroup = 'Newborn-3mo';
    } else if (ageInMonths < 24) {
      minHR = 100;
      maxHR = 190;
      ageGroup = '3mo-2yr';
    } else if (ageInMonths < 120) {
      minHR = 60;
      maxHR = 140;
      ageGroup = '2-10yr';
    }

    if (vitals.heartRate >= minHR && vitals.heartRate <= maxHR) {
      evaluations.push({
        field: 'Heart Rate',
        value: vitals.heartRate,
        status: 'normal',
        message: `${vitals.heartRate} bpm - Normal for ${ageGroup}`,
        reference: `${minHR}-${maxHR} bpm (${ageGroup})`,
      });
    } else if (vitals.heartRate < minHR) {
      evaluations.push({
        field: 'Heart Rate',
        value: vitals.heartRate,
        status: 'warning',
        message: `${vitals.heartRate} bpm - Bradycardia for ${ageGroup}`,
        reference: `${minHR}-${maxHR} bpm (${ageGroup})`,
      });
    } else {
      evaluations.push({
        field: 'Heart Rate',
        value: vitals.heartRate,
        status: 'warning',
        message: `${vitals.heartRate} bpm - Tachycardia for ${ageGroup}`,
        reference: `${minHR}-${maxHR} bpm (${ageGroup})`,
      });
    }
  }

  // Respiratory Rate
  if (vitals.heartRate !== null) {
    // Note: We use heartRate as a placeholder since the form doesn't have respiratory rate yet
    // This is for when respiratory rate is added to the Vitals interface
    // For now, we skip RR evaluation
  }

  // Blood Pressure
  if (vitals.systolicBP !== null) {
    let minSystolic = 90; // >10yr normal minimum
    let maxSystolic = 120; // >10yr normal maximum
    let isHypotensive = false;
    let bpClassification = '';

    // Check for hypotension (age-dependent)
    if (ageInMonths < 1) {
      minSystolic = 60;
    } else if (ageInMonths < 12) {
      minSystolic = 70;
    } else if (ageInMonths < 120) {
      minSystolic = 70 + (ageInMonths / 12) * 2;
    }

    if (vitals.systolicBP < minSystolic) {
      isHypotensive = true;
    }

    // BP classification for >13yr (156 months)
    if (ageInMonths >= 156) {
      const systolic = vitals.systolicBP;
      const diastolic = vitals.diastolicBP || 0;

      if (systolic < 120 && diastolic < 80) {
        bpClassification = 'Normal';
        evaluations.push({
          field: 'Blood Pressure',
          value: vitals.systolicBP,
          status: 'normal',
          message: `${systolic}/${diastolic} mmHg - Normal`,
          reference: '<120/<80 mmHg',
        });
      } else if ((systolic >= 120 && systolic <= 129) && diastolic < 80) {
        bpClassification = 'Elevated';
        evaluations.push({
          field: 'Blood Pressure',
          value: vitals.systolicBP,
          status: 'warning',
          message: `${systolic}/${diastolic} mmHg - Elevated`,
          reference: '120-129/<80 mmHg',
        });
      } else if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
        bpClassification = 'Stage 1 HTN';
        evaluations.push({
          field: 'Blood Pressure',
          value: vitals.systolicBP,
          status: 'warning',
          message: `${systolic}/${diastolic} mmHg - Stage 1 Hypertension`,
          reference: '130-139 or 80-89 mmHg',
        });
      } else if (systolic >= 140 || diastolic >= 90) {
        bpClassification = 'Stage 2 HTN';
        evaluations.push({
          field: 'Blood Pressure',
          value: vitals.systolicBP,
          status: 'critical',
          message: `${systolic}/${diastolic} mmHg - Stage 2 Hypertension`,
          reference: '≥140 or ≥90 mmHg',
        });
      }
    } else {
      // For younger children, use age-dependent thresholds
      if (isHypotensive) {
        evaluations.push({
          field: 'Blood Pressure',
          value: vitals.systolicBP,
          status: 'critical',
          message: `${vitals.systolicBP} mmHg - Hypotension (critical)`,
          reference: `>${minSystolic} mmHg (age-dependent)`,
        });
      } else {
        evaluations.push({
          field: 'Blood Pressure',
          value: vitals.systolicBP,
          status: 'normal',
          message: `${vitals.systolicBP} mmHg - Normal`,
          reference: `>${minSystolic} mmHg (age-dependent)`,
        });
      }
    }
  }

  return evaluations;
}

/**
 * Convert date of birth to age in months
 */
export function calculateAgeInMonths(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();

  let months = (now.getFullYear() - dob.getFullYear()) * 12;
  months += now.getMonth() - dob.getMonth();

  // Adjust if birthday hasn't occurred this month
  if (now.getDate() < dob.getDate()) {
    months--;
  }

  return Math.max(0, months);
}
