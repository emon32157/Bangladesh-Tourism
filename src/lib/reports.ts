/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserReport, ReportCategory, ReportStatus } from '../types';
import { db, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from './firebase';

const LOCAL_STORAGE_KEY = 'discover_bd_user_reports';

/**
 * Default sample reports if none exist yet
 */
const SEED_REPORTS: UserReport[] = [
  {
    id: 'rep-seed-1',
    subject: 'Updated Visiting Hours for Lalbagh Fort',
    details: 'During Ramadan and national holidays, the museum opening hours at Lalbagh Fort change to 10:30 AM instead of 10:00 AM. Please verify and update.',
    category: 'incorrect_info',
    reporterName: 'Tanvir Hossain',
    reporterEmail: 'tanvir.traveler@example.com',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    status: 'pending',
  },
  {
    id: 'rep-seed-2',
    subject: 'Road Condition Update near Sajek Valley',
    details: 'The Baghaichari to Sajek military escort route has ongoing road expansion work. Suggest travelers avoid late afternoon trips.',
    category: 'tourism_feedback',
    reporterName: 'Anonymous Traveler',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    status: 'resolved',
    resolvedBy: 'Admin',
    resolvedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    adminNotes: 'Noted and updated the travel advisory note for Sajek.',
  },
];

/**
 * Get locally cached reports
 */
export function getLocalReports(): UserReport[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_REPORTS));
    return SEED_REPORTS;
  } catch {
    return SEED_REPORTS;
  }
}

/**
 * Save reports to local storage
 */
export function saveLocalReports(reports: UserReport[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
  } catch (err) {
    console.warn('Failed to save reports locally:', err);
  }
}

/**
 * Submit a new user report (No login required)
 */
export async function submitUserReport(data: {
  subject: string;
  details: string;
  category: ReportCategory;
  imageUrl?: string;
  targetTitle?: string;
  reporterName?: string;
  reporterEmail?: string;
  reporterContact?: string;
  userId?: string;
}): Promise<UserReport> {
  const newReport: UserReport = {
    id: 'rep-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 7),
    subject: data.subject.trim(),
    details: data.details.trim(),
    category: data.category,
    imageUrl: data.imageUrl || undefined,
    targetTitle: data.targetTitle?.trim() || undefined,
    reporterName: data.reporterName?.trim() || 'Anonymous User',
    reporterEmail: data.reporterEmail?.trim() || undefined,
    reporterContact: data.reporterContact?.trim() || undefined,
    userId: data.userId || undefined,
    createdAt: Date.now(),
    status: 'pending',
  };

  // 1. Update local storage
  const currentList = getLocalReports();
  const updatedList = [newReport, ...currentList];
  saveLocalReports(updatedList);

  // 2. Try Firestore cloud save
  try {
    const reportRef = doc(db, 'user_reports', newReport.id);
    await setDoc(reportRef, newReport);
  } catch (err) {
    console.warn('Could not save report to Firestore (using local fallback):', err);
  }

  return newReport;
}

/**
 * Fetch all user reports for Admin Panel
 */
export async function fetchAllUserReports(): Promise<UserReport[]> {
  try {
    const reportsCol = collection(db, 'user_reports');
    const q = query(reportsCol, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const cloudReports: UserReport[] = [];
      snapshot.forEach((docSnap) => {
        cloudReports.push(docSnap.data() as UserReport);
      });
      // Merge with any local ones
      const local = getLocalReports();
      const mergedMap = new Map<string, UserReport>();
      local.forEach((r) => mergedMap.set(r.id, r));
      cloudReports.forEach((r) => mergedMap.set(r.id, r));
      const combined = Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      saveLocalReports(combined);
      return combined;
    }
  } catch (err) {
    console.warn('Firestore reports fetch error, using local fallback:', err);
  }

  return getLocalReports();
}

/**
 * Update report status (e.g. resolve, dismiss)
 */
export async function updateReportStatusInDb(
  reportId: string,
  status: ReportStatus,
  adminNotes?: string,
  resolvedBy?: string
): Promise<void> {
  // 1. Update local
  const current = getLocalReports();
  const updated = current.map((r) => {
    if (r.id === reportId) {
      return {
        ...r,
        status,
        adminNotes: adminNotes !== undefined ? adminNotes : r.adminNotes,
        resolvedAt: status === 'resolved' ? (r.resolvedAt || Date.now()) : undefined,
        resolvedBy: status === 'resolved' ? (resolvedBy || r.resolvedBy || 'Admin') : undefined,
      };
    }
    return r;
  });
  saveLocalReports(updated);

  // 2. Update Firestore
  try {
    const docRef = doc(db, 'user_reports', reportId);
    await updateDoc(docRef, {
      status,
      adminNotes: adminNotes || '',
      resolvedAt: status === 'resolved' ? Date.now() : null,
      resolvedBy: status === 'resolved' ? (resolvedBy || 'Admin') : null,
    });
  } catch (err) {
    console.warn('Firestore update report error:', err);
  }
}

/**
 * Delete a report
 */
export async function deleteReportFromDb(reportId: string): Promise<void> {
  // 1. Delete from local
  const current = getLocalReports();
  const filtered = current.filter((r) => r.id !== reportId);
  saveLocalReports(filtered);

  // 2. Delete from Firestore
  try {
    const docRef = doc(db, 'user_reports', reportId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore delete report error:', err);
  }
}
