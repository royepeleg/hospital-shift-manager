import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  WithFieldValue,
  DocumentData,
} from 'firebase/firestore';

import { db } from './firebase';
import { CalendarEvent, FamilyMember } from '@/types';

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

/**
 * Subscribes to real-time updates of the `members` collection.
 * Returns an unsubscribe function that stops the listener when called.
 */
export function subscribeToMembers(
  callback: (members: FamilyMember[]) => void
): () => void {
  const ref = collection(db, 'members');

  return onSnapshot(ref, (snapshot) => {
    const members: FamilyMember[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<FamilyMember, 'id'>),
    }));

    callback(members);
  });
}

/**
 * Adds a new family member document to the `members` collection.
 * The Firestore document id is taken from `member.id`.
 */
export async function addMember(member: FamilyMember): Promise<void> {
  const { id, ...data } = member;

  await setDoc(doc(db, 'members', id), data);
}

/**
 * Updates an existing family member document in the `members` collection.
 */
export async function updateMember(
  id: string,
  updates: Partial<FamilyMember>
): Promise<void> {
  const ref = doc(db, 'members', id);

  await updateDoc(ref, updates as WithFieldValue<DocumentData>);
}

/**
 * Deletes a family member document from the `members` collection.
 */
export async function removeMember(id: string): Promise<void> {
  const ref = doc(db, 'members', id);

  await deleteDoc(ref);
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/**
 * Subscribes to real-time updates of the `events` collection.
 * Returns an unsubscribe function that stops the listener when called.
 */
export function subscribeToEvents(
  callback: (events: CalendarEvent[]) => void
): () => void {
  const ref = collection(db, 'events');

  return onSnapshot(ref, (snapshot) => {
    const events: CalendarEvent[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<CalendarEvent, 'id'>),
    }));

    callback(events);
  });
}

/**
 * Adds a new calendar event document to the `events` collection.
 * The Firestore document id is taken from `event.id`.
 */
export async function addEvent(event: CalendarEvent): Promise<void> {
  const { id, ...data } = event;

  await setDoc(doc(db, 'events', id), data);
}

/**
 * Updates an existing calendar event document in the `events` collection.
 */
export async function updateEvent(
  id: string,
  updates: Partial<CalendarEvent>
): Promise<void> {
  const ref = doc(db, 'events', id);

  await updateDoc(ref, updates as WithFieldValue<DocumentData>);
}

/**
 * Deletes a calendar event document from the `events` collection.
 */
export async function removeEvent(id: string): Promise<void> {
  const ref = doc(db, 'events', id);

  await deleteDoc(ref);
}
