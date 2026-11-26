import { availableSubjects } from '../../lib/learnersApi'
import type { Learner, Mode } from '../../lib/types'
import { SubjectSwitch } from './SubjectSwitch'

/** Subject switch at the top of practice; each subject keeps its own level. */
export function SubjectTabs({ learner, onSwitch }: { learner: Learner; onSwitch: (m: Mode) => void }) {
  return <SubjectSwitch learner={learner} subjects={availableSubjects()} onSwitch={onSwitch} variant="tabs" label="What to practice today" />
}
