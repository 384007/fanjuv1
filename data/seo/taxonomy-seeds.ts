import taxonomySeedsData from "./taxonomy-seeds.generated.json"

export type TaxonomyTopCategory =
  | "industries"
  | "professions"
  | "hobbies"
  | "interests"
  | "sports"
  | "outdoor"
  | "arts-culture"
  | "tech-ai"
  | "finance-business"
  | "startup"
  | "creator"
  | "food-dining"
  | "city-life"
  | "dating-relationship"
  | "study-abroad"
  | "immigration"
  | "women-friendly"
  | "premium-dining"

export type TaxonomySeed = {
  id: string
  zh: string
  en: string
  topCategory: TaxonomyTopCategory
  subCategory: string
  riskLevel: "low" | "medium" | "high" | "prohibited"
  fanjuRelevanceBase: number
  possibleAngles: string[]
}

export const taxonomySeeds = taxonomySeedsData as TaxonomySeed[]

export const industries = taxonomySeeds.filter((seed) => seed.topCategory === "industries")
export const professions = taxonomySeeds.filter((seed) => seed.topCategory === "professions")
export const hobbies = taxonomySeeds.filter((seed) => seed.topCategory === "hobbies")
export const interests = taxonomySeeds.filter((seed) => seed.topCategory === "interests")
export const sports = taxonomySeeds.filter((seed) => seed.topCategory === "sports")
export const outdoor = taxonomySeeds.filter((seed) => seed.topCategory === "outdoor")
export const artsCulture = taxonomySeeds.filter((seed) => seed.topCategory === "arts-culture")
export const techAi = taxonomySeeds.filter((seed) => seed.topCategory === "tech-ai")
export const financeBusiness = taxonomySeeds.filter((seed) => seed.topCategory === "finance-business")
export const startup = taxonomySeeds.filter((seed) => seed.topCategory === "startup")
export const creatorFreelance = taxonomySeeds.filter((seed) => seed.topCategory === "creator")
export const foodDining = taxonomySeeds.filter((seed) => seed.topCategory === "food-dining")
export const cityLife = taxonomySeeds.filter((seed) => seed.topCategory === "city-life")
export const datingRelationship = taxonomySeeds.filter((seed) => seed.topCategory === "dating-relationship")
export const studyAbroad = taxonomySeeds.filter((seed) => seed.topCategory === "study-abroad")
export const immigration = taxonomySeeds.filter((seed) => seed.topCategory === "immigration")
export const womenFriendly = taxonomySeeds.filter((seed) => seed.topCategory === "women-friendly")
export const premiumDining = taxonomySeeds.filter((seed) => seed.topCategory === "premium-dining")
