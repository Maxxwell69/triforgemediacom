import "dotenv/config";

async function main() {
  const { populateOfficialProgression } = await import("../lib/progression/populate");
  const result = await populateOfficialProgression();
  console.log("Populated official progression content:", result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
