import { Leaf, Flower, TreeDeciduous, Sprout } from 'lucide-react';

// Simple mapping from plant type to an icon component.
// Extend this mapping as more plant types are added.
export default function getPlantIcon(type?: string) {
  switch (type?.toLowerCase()) {
    case 'tree':
      return TreeDeciduous;
    case 'flower':
      return Flower;
    case 'sprout':
      return Sprout;
    default:
      return Leaf; // fallback generic leaf icon
  }
}
