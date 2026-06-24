import { Details } from './details';

// Dedicated "Material Available" screen — reuses the shared Details implementation
// locked to the available/imported materials view. Reached from the Project Sections
// dropdown (Material Available option).
export default function MaterialAvailable() {
  return <Details lockedTab="imported" />;
}
