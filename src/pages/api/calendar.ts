import type { APIRoute } from "astro";
import { startOfDay, endOfDay, addMonths, getUnixTime } from "date-fns";

const GRIST_API_KEY = import.meta.env.GRIST_API_KEY;
const GRIST_DOC_ID = import.meta.env.GRIST_DOC_ID;
const GRIST_BASE_URL = import.meta.env.GRIST_BASE_URL;
const GRIST_TABLE_ID = import.meta.env.GRIST_TABLE_ID;

interface GristRecord {
  id: number;
  fields: {
    date: number;
    amount: number;
    description: string;
  };
}

async function getTransactions(): Promise<GristRecord[]> {
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
  const now = new Date();
  const todayStart = startOfDay(now);
  const twoMonthsLaterEnd = endOfDay(addMonths(now, 2));

  // Formatea las fechas para la API de Grist
  const startDateUnix = getUnixTime(todayStart);
  const endDateUnix = getUnixTime(twoMonthsLaterEnd);

  const transactions = await getTransactions();

  const filteredTransactions = transactions.filter((item: GristRecord) => {
    const itemDateTimestamp = item.fields.date;
    return (
      itemDateTimestamp >= startDateUnix && itemDateTimestamp <= endDateUnix
    );
  });

  return new Response(JSON.stringify(filteredTransactions), {
    headers: {
      "Content-Type": "application/json",
    },
    status: 200,
    statusText: "OK",
  });
};
