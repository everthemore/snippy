/**
 * Vision API Integration Mock
 * Used for plant identification and microclimate analysis
 */

export interface AnalysisResult {
  speciesSuggested?: string;
  latinName?: string;
  confidence: number;
  microclimateFlags: string[];
  description: string;
}

export const visionService = {
  /**
   * Analyze an image for microclimate indicators
   */
  async analyzeGardenEnvironment(imageFile: File): Promise<AnalysisResult> {
    console.log("Analyzing garden environment...", imageFile.name);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      confidence: 0.94,
      microclimateFlags: ['south-facing-brick-wall', 'protected-from-north-wind'],
      description: "Detected a dark brick wall on the south side which will retain heat throughout the night. The area is shielded from northern winds by a nearby structure."
    };
  },

  /**
   * Identify a plant species from a photo
   */
  async identifyPlant(imageFile: File): Promise<AnalysisResult> {
    console.log("Identifying plant...", imageFile.name);
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    return {
      speciesSuggested: 'Lavender',
      latinName: 'Lavandula angustifolia',
      confidence: 0.98,
      microclimateFlags: [],
      description: "Match found for English Lavender."
    };
  }
};
