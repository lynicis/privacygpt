import { getDb } from "./index"
import { companies, parseConfidence } from "./schema"
import { eq } from "drizzle-orm"
import seedData from "./seedData.json"

async function main() {
  const db = await getDb()
  console.log("Seeding database with AI companies privacy data...")

  for (const data of seedData) {
    const values = {
      companyKey: data.companyKey,
      companyName: data.companyName,
      productName: data.productName,
      trainsOnDataByDefault: data.trainsOnDataByDefault,
      trainsOnDataNuance: data.trainsOnDataNuance,
      optOutAvailable: data.optOutAvailable,
      optOutHow: data.optOutHow,
      optOutUrl: data.optOutUrl ?? null,
      retentionPeriod: data.retentionPeriod,
      dataDeletedOnRequest: data.dataDeletedOnRequest,
      dataDeletedOnRequestTimeframe: data.dataDeletedOnRequestTimeframe,
      thirdPartySharing: data.thirdPartySharing,
      humanReviewOfChats: data.humanReviewOfChats,
      humanReviewConditions: data.humanReviewConditions,
      regionalVariation: data.regionalVariation,
      childrenDataPolicy: data.childrenDataPolicy,
      enterpriseVsConsumerDifference: data.enterpriseVsConsumerDifference,
      enterpriseVsConsumerSummary: data.enterpriseVsConsumerSummary,
      sourceUrl: data.sourceUrl,
      lastVerifiedDate: data.lastVerifiedDate,
      lastChangedDate: data.lastChangedDate,
      confidence: parseConfidence(data.confidence),
      hasValidPrivacyPolicy:
        "hasValidPrivacyPolicy" in data
          ? Boolean(data.hasValidPrivacyPolicy)
          : true,
    }

    const existing = await db
      .select()
      .from(companies)
      .where(eq(companies.companyKey, data.companyKey))
      .get()

    if (existing) {
      console.log(`Updating existing entry for ${data.companyName}...`)
      await db
        .update(companies)
        .set(values)
        .where(eq(companies.companyKey, data.companyKey))
    } else {
      console.log(`Inserting new entry for ${data.companyName}...`)
      await db.insert(companies).values(values)
    }
  }

  console.log("Seeding complete!")
}

main().catch((err) => {
  console.error("Seeding failed:", err)
  process.exit(1)
})
