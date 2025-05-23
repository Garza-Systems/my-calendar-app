import type { APIRoute } from "astro";

const GRIST_API_KEY = import.meta.env.GRIST_API_KEY;
const GRIST_DOC_ID = import.meta.env.GRIST_DOC_ID;
const GRIST_BASE_URL = import.meta.env.GRIST_BASE_URL;
const GRIST_TABLE_ID = import.meta.env.GRIST_TABLE_ID;

async function getTransactions() {
  try {
    const response = await fetch(
      `${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables/${GRIST_TABLE_ID}/records?sort=date`,
      {
        headers: {
          Authorization: `Bearer ${GRIST_API_KEY}`,
          Accept: "application/json",
        },
        method: "GET",
      }
    );
    const data = await response.json();
    return data.records;
  } catch (error) {
    console.error("Error fetching transactions from Grist:", error);
    return [];
  }
}

export const GET: APIRoute = async ({ request }) => {
  const transactions = await getTransactions();
  return new Response(JSON.stringify(transactions), {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
    statusText: "OK",
  });
};
