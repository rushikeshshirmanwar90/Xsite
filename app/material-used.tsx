import { Details } from './details';

// Dedicated "Material Used" screen — reuses the shared Details implementation
// locked to the used materials view. Reached from the Project Sections dropdown
// (Material Used option).
export default function MaterialUsed() {
  return <Details lockedTab="used" />;
}
