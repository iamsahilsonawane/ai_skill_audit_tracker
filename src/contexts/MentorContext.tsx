import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLinkedLearners } from '@/hooks/useProfile';

interface MentorContextType {
  selectedLearnerId: string | null;
  setSelectedLearnerId: (id: string) => void;
  selectedLearner: { id: string; full_name: string } | null;
  linkedLearners: { id: string; full_name: string }[];
  // The profile ID that all pages should use for data fetching
  // For mentors: selectedLearnerId. For learners: their own profile id.
  viewingProfileId: string | null;
}

const MentorContext = createContext<MentorContextType | undefined>(undefined);

export function MentorProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const isMentor = profile?.role === 'mentor';

  const { data: linked } = useLinkedLearners(isMentor ? profile?.id : undefined);
  const linkedLearners: { id: string; full_name: string }[] = (linked || []) as any;

  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);

  // Auto-select first learner when list loads
  useEffect(() => {
    if (isMentor && linkedLearners.length > 0 && !selectedLearnerId) {
      setSelectedLearnerId(linkedLearners[0].id);
    }
  }, [isMentor, linkedLearners, selectedLearnerId]);

  const selectedLearner = linkedLearners.find(l => l.id === selectedLearnerId) ?? null;

  const viewingProfileId = isMentor
    ? (selectedLearnerId ?? null)
    : (profile?.id ?? null);

  return (
    <MentorContext.Provider
      value={{
        selectedLearnerId,
        setSelectedLearnerId,
        selectedLearner,
        linkedLearners,
        viewingProfileId,
      }}
    >
      {children}
    </MentorContext.Provider>
  );
}

export function useMentorContext() {
  const ctx = useContext(MentorContext);
  if (!ctx) throw new Error('useMentorContext must be used within MentorProvider');
  return ctx;
}
